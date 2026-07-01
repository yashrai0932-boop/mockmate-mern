"""
Centralized NVIDIA NIM API Service.
Handles ALL AI requests with rate limiting, caching, retries, and structured output parsing.
This is the SINGLE entry point for all AI operations.
"""

import json
import asyncio
import logging
import re
from typing import Optional, Any

import httpx

from app.config import settings
from app.ai.rate_limiter import TokenBucketRateLimiter
from app.ai.cache import ResponseCache
from app.ai.prompts import (
    resume_parse_prompt,
    candidate_summary_prompt,
    question_generation_prompt,
    evaluate_answer_prompt,
    final_report_prompt,
    job_match_prompt,
)
from app.ai.personalities import get_personality

logger = logging.getLogger(__name__)


class NIMService:
    """
    Centralized NVIDIA NIM API client.
    
    Features:
    - Rate limiting (token bucket, stays under 35 RPM)
    - Response caching (LRU with TTL)
    - Automatic retries with exponential backoff
    - Structured JSON output parsing
    - Centralized error handling
    """

    def __init__(self):
        self.base_url = settings.NVIDIA_NIM_BASE_URL
        self.api_key = settings.NVIDIA_NIM_API_KEY
        self.model = settings.NVIDIA_NIM_MODEL
        self.rate_limiter = TokenBucketRateLimiter(
            max_tokens=settings.NIM_MAX_RPM,
            refill_rate=settings.NIM_MAX_RPM / 60.0,
        )
        self.cache = ResponseCache(
            max_size=settings.CACHE_MAX_SIZE,
            ttl_seconds=settings.CACHE_TTL_SECONDS,
        )
        self.client: Optional[httpx.AsyncClient] = None
        self._retry_attempts = settings.NIM_RETRY_ATTEMPTS
        self._retry_delay = settings.NIM_RETRY_DELAY

    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create the HTTP client."""
        if self.client is None or self.client.is_closed:
            self.client = httpx.AsyncClient(
                base_url=self.base_url,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                timeout=httpx.Timeout(60.0, connect=10.0),
            )
        return self.client

    async def close(self):
        """Close the HTTP client."""
        if self.client and not self.client.is_closed:
            await self.client.aclose()

    def _extract_json(self, text: str) -> Any:
        """
        Extract JSON from AI response text.
        Handles cases where the model wraps JSON in markdown code blocks.
        """
        # Try direct JSON parse first
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        # Try to extract from markdown code blocks
        patterns = [
            r"```json\s*([\s\S]*?)\s*```",
            r"```\s*([\s\S]*?)\s*```",
            r"\{[\s\S]*\}",
            r"\[[\s\S]*\]",
        ]
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                try:
                    return json.loads(match.group(1) if "```" in pattern else match.group(0))
                except (json.JSONDecodeError, IndexError):
                    continue

        logger.error(f"Failed to extract JSON from response: {text[:200]}")
        return None

    async def _chat_completion(
        self,
        messages: list,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        cache_key: Optional[str] = None,
    ) -> Optional[str]:
        """
        Core method: make a chat completion request to NIM.
        Handles rate limiting, retries, and caching.
        """
        # Check cache
        if cache_key:
            cached = self.cache.get(cache_key)
            if cached is not None:
                logger.info("Using cached response")
                return cached

        # Acquire rate limit token
        await self.rate_limiter.acquire()

        client = await self._get_client()

        # Retry loop with exponential backoff
        for attempt in range(self._retry_attempts):
            try:
                response = await client.post(
                    "/chat/completions",
                    json={
                        "model": self.model,
                        "messages": messages,
                        "temperature": temperature,
                        "max_tokens": max_tokens,
                        "top_p": 0.9,
                    },
                )

                if response.status_code == 429:
                    # Rate limited - wait and retry
                    wait_time = self._retry_delay * (2 ** attempt)
                    logger.warning(f"Rate limited (429), waiting {wait_time}s before retry {attempt + 1}")
                    await asyncio.sleep(wait_time)
                    continue

                response.raise_for_status()
                data = response.json()
                content = data["choices"][0]["message"]["content"]

                # Cache the result
                if cache_key:
                    self.cache.set(content, cache_key)

                return content

            except httpx.HTTPStatusError as e:
                status = e.response.status_code
                logger.error(f"NIM API error (attempt {attempt + 1}): {status} - {e.response.text[:200]}")
                # Fail fast on auth errors, no point retrying
                if status in (401, 403):
                    raise ValueError(f"NVIDIA API Key is missing or invalid (HTTP {status}). Please check your environment variables.")
                    
                if attempt < self._retry_attempts - 1:
                    await asyncio.sleep(self._retry_delay * (2 ** attempt))
                else:
                    raise

            except httpx.RequestError as e:
                logger.error(f"NIM request error (attempt {attempt + 1}): {str(e)}")
                if attempt < self._retry_attempts - 1:
                    await asyncio.sleep(self._retry_delay * (2 ** attempt))
                else:
                    raise

        return None

    # ===== PUBLIC API METHODS =====

    async def parse_resume(self, resume_text: str) -> Optional[dict]:
        """Parse resume text into structured data using AI."""
        prompt = resume_parse_prompt(resume_text)
        messages = [
            {"role": "system", "content": "You are a resume parsing expert. Return only valid JSON."},
            {"role": "user", "content": prompt},
        ]

        response = await self._chat_completion(
            messages, temperature=0.3, max_tokens=2000
        )
        if response:
            return self._extract_json(response)
        return None

    async def generate_candidate_summary(self, parsed_data: dict) -> Optional[str]:
        """Generate a compressed candidate summary from parsed resume data."""
        prompt = candidate_summary_prompt(parsed_data)
        messages = [
            {"role": "system", "content": "You are a talent assessment expert. Be concise."},
            {"role": "user", "content": prompt},
        ]

        return await self._chat_completion(
            messages,
            temperature=0.5,
            max_tokens=500,
            cache_key=f"summary_{hash(str(parsed_data)[:200])}",
        )

    async def generate_questions_batch(
        self,
        candidate_summary: str,
        target_role: str,
        personality_key: str,
        difficulty: float,
        count: int = 5,
        previous_topics: list = None,
    ) -> Optional[list]:
        """
        PRE-GENERATE multiple questions in one request.
        Key optimization: reduces API calls during the interview.
        """
        personality = get_personality(personality_key)
        adjusted_difficulty = max(1, min(10, difficulty + personality["difficulty_modifier"]))

        prompt = question_generation_prompt(
            candidate_summary=candidate_summary,
            target_role=target_role,
            personality_prompt=personality["system_prompt"],
            difficulty=adjusted_difficulty,
            question_style=personality["question_style"],
            count=count,
            previous_topics=previous_topics,
        )

        messages = [
            {"role": "system", "content": personality["system_prompt"] + "\nReturn only valid JSON arrays."},
            {"role": "user", "content": prompt},
        ]

        response = await self._chat_completion(
            messages, temperature=0.8, max_tokens=2500
        )
        if response:
            result = self._extract_json(response)
            if isinstance(result, list):
                return result
        return None

    async def evaluate_and_advance(
        self,
        candidate_summary: str,
        question_text: str,
        question_category: str,
        answer_text: str,
        personality_key: str,
        interview_context: str = "",
    ) -> Optional[dict]:
        """
        SINGLE REQUEST EVALUATION: evaluates answer + generates feedback + scores + next question.
        This is THE key optimization - one API call per answer instead of multiple.
        """
        personality = get_personality(personality_key)

        prompt = evaluate_answer_prompt(
            candidate_summary=candidate_summary,
            question_text=question_text,
            question_category=question_category,
            answer_text=answer_text,
            personality_prompt=personality["system_prompt"],
            evaluation_style=personality["evaluation_style"],
            interview_context=interview_context,
        )

        messages = [
            {"role": "system", "content": personality["system_prompt"] + "\nReturn only valid JSON."},
            {"role": "user", "content": prompt},
        ]

        response = await self._chat_completion(
            messages, temperature=0.6, max_tokens=2500
        )
        if response:
            return self._extract_json(response)
        return None

    async def generate_final_report(
        self,
        candidate_summary: str,
        target_role: str,
        questions_and_answers: list,
        score_averages: dict,
    ) -> Optional[dict]:
        """Generate comprehensive final interview report."""
        prompt = final_report_prompt(
            candidate_summary=candidate_summary,
            target_role=target_role,
            questions_and_answers=questions_and_answers,
            score_averages=score_averages,
        )

        messages = [
            {"role": "system", "content": "You are a senior hiring manager writing a detailed assessment. Return only valid JSON."},
            {"role": "user", "content": prompt},
        ]

        response = await self._chat_completion(
            messages, temperature=0.5, max_tokens=3000
        )
        if response:
            return self._extract_json(response)
        return None

    async def evaluate_job_match(
        self, candidate_summary: str, job_description: str
    ) -> Optional[dict]:
        """Evaluate candidate-job fit for recruiter mode."""
        prompt = job_match_prompt(candidate_summary, job_description)
        messages = [
            {"role": "system", "content": "You are a talent matching expert. Return only valid JSON."},
            {"role": "user", "content": prompt},
        ]

        response = await self._chat_completion(
            messages,
            temperature=0.4,
            max_tokens=1000,
            cache_key=f"match_{hash(candidate_summary[:100])}_{hash(job_description[:100])}",
        )
        if response:
            return self._extract_json(response)
        return None


# Singleton instance
nim_service = NIMService()
