"""
Prompt Templates for NVIDIA NIM API.
All prompts enforce structured JSON output for reliable parsing.
"""


def resume_parse_prompt(resume_text: str) -> str:
    """Prompt to extract structured data from resume text."""
    return f"""Analyze the following resume text and extract structured information.

RESUME TEXT:
{resume_text[:3000]}

Return a JSON object with EXACTLY this structure (no markdown, no code blocks, just pure JSON):
{{
    "skills": ["skill1", "skill2", ...],
    "projects": [
        {{"name": "Project Name", "description": "Brief description", "technologies": "tech1, tech2"}}
    ],
    "education": [
        {{"degree": "Degree Name", "institution": "University", "year": "Year or range"}}
    ],
    "experience": [
        {{"title": "Job Title", "company": "Company", "duration": "Duration", "description": "Brief description"}}
    ],
    "certifications": ["cert1", "cert2", ...],
    "technologies": ["tech1", "tech2", ...]
}}

If a section has no data, use an empty array []. Return ONLY valid JSON."""


def candidate_summary_prompt(parsed_data: dict) -> str:
    """Generate a compressed candidate summary for AI optimization."""
    return f"""Create a concise candidate summary (200 words max) from this parsed resume data.

PARSED DATA:
{str(parsed_data)[:2000]}

Focus on:
- Key technical strengths and domain expertise
- Notable projects and their impact
- Experience level and progression
- Unique selling points

Return ONLY a plain text summary paragraph. No JSON, no formatting."""


def question_generation_prompt(
    candidate_summary: str,
    target_role: str,
    personality_prompt: str,
    difficulty: float,
    question_style: str,
    count: int = 5,
    previous_topics: list = None,
) -> str:
    """Generate a batch of interview questions."""
    prev_topics_str = ""
    if previous_topics:
        prev_topics_str = f"\nAlready covered topics (DO NOT repeat): {', '.join(previous_topics)}"

    return f"""{personality_prompt}

Generate {count} interview questions for a candidate applying for: {target_role}

CANDIDATE SUMMARY:
{candidate_summary[:500]}

DIFFICULTY LEVEL: {difficulty}/10
QUESTION STYLE: {question_style}
{prev_topics_str}

Requirements:
- Mix of categories: HR, Technical, Situational, Behavioral
- IMPORTANT: You MUST generate a mix of open-ended AND multiple-choice questions. 
- At least half of the questions MUST be "question_type": "multiple_choice" with 4 "options".
- Questions should relate to the candidate's background
- Difficulty should match the specified level
- Questions should be specific, not generic
- Each question should test a different skill/area

Return a JSON array with EXACTLY this structure (no markdown, no code blocks, just pure JSON):
[
    {{
        "text": "The interview question text",
        "category": "hr|technical|situational|behavioral",
        "difficulty": 5.0,
        "related_resume_section": "skills|projects|experience|education|null",
        "question_type": "open_ended|multiple_choice",
        "options": ["Option A", "Option B", "Option C", "Option D"] // ONLY if question_type is multiple_choice, otherwise null
    }}
]

Return ONLY valid JSON array."""


def evaluate_answer_prompt(
    candidate_summary: str,
    question_text: str,
    question_category: str,
    answer_text: str,
    personality_prompt: str,
    evaluation_style: str,
    interview_context: str = "",
) -> str:
    """
    SINGLE REQUEST that evaluates the answer AND generates the next question.
    This is the key optimization - one API call per answer.
    """
    return f"""{personality_prompt}

You are evaluating an interview answer and preparing the next question.

CANDIDATE SUMMARY: {candidate_summary[:400]}

CURRENT QUESTION ({question_category}): {question_text}

CANDIDATE'S ANSWER: {answer_text}

EVALUATION STYLE: {evaluation_style}

{f"INTERVIEW CONTEXT (previous Q&A summary): {interview_context}" if interview_context else ""}

Provide your evaluation and the next question. Return a JSON object with EXACTLY this structure (no markdown, no code blocks, just pure JSON):
{{
    "scores": {{
        "communication": 7.5,
        "technical_depth": 6.0,
        "relevance": 8.0,
        "confidence": 7.0,
        "overall": 7.1
    }},
    "feedback": {{
        "strengths": ["One brief strength (max 10 words)"],
        "weaknesses": ["One brief weakness (max 10 words)"],
        "ideal_answer": "One very short sentence explaining the ideal answer"
    }},
    "next_question": {{
        "text": "The next interview question based on this answer and the candidate's profile",
        "category": "hr|technical|situational|behavioral",
        "difficulty": 5.5,
        "related_resume_section": "skills|projects|experience|education|null",
        "is_follow_up": false,
        "question_type": "open_ended|multiple_choice",
        "options": ["Option A", "Option B", "Option C", "Option D"] // ONLY if question_type is multiple_choice, otherwise null
    }}
}}

CRITICAL INSTRUCTION: The scores in the JSON structure above (7.5, 6.0, 8.0, 7.0, 7.1) are ONLY EXAMPLES. You MUST NOT hardcode or blindly copy these exact numbers. You MUST honestly and accurately evaluate the user's specific answer against the question and provide REAL calculated scores based on the guidelines below.

SPEED OPTIMIZATION: Keep ALL text fields extremely brief. Do not exceed the length limits specified. The goal is to return the response as fast as possible.

Score guidelines (1-10 scale):
- 1-3: Poor/inadequate
- 4-5: Below average
- 6-7: Good/acceptable  
- 8-9: Very good/excellent
- 10: Outstanding/perfect

Return ONLY valid JSON."""


def final_report_prompt(
    candidate_summary: str,
    target_role: str,
    questions_and_answers: list,
    score_averages: dict,
) -> str:
    """Generate comprehensive final interview report."""
    qa_text = ""
    for i, qa in enumerate(questions_and_answers[:15], 1):
        qa_text += f"\nQ{i} ({qa.get('category', 'general')}): {qa.get('question', '')[:100]}\n"
        qa_text += f"A{i}: {qa.get('answer', '')[:150]}\n"
        qa_text += f"Score: {qa.get('score', 'N/A')}/10\n"

    return f"""Generate a comprehensive final interview report.

CANDIDATE SUMMARY: {candidate_summary[:400]}
TARGET ROLE: {target_role}

AVERAGE SCORES:
- Communication: {score_averages.get('communication', 0):.1f}/10
- Technical Depth: {score_averages.get('technical', 0):.1f}/10
- Relevance: {score_averages.get('relevance', 0):.1f}/10
- Confidence: {score_averages.get('confidence', 0):.1f}/10
- Overall: {score_averages.get('overall', 0):.1f}/10

QUESTIONS AND ANSWERS:
{qa_text}

Return a JSON object with EXACTLY this structure (no markdown, no code blocks, just pure JSON):
{{
    "interview_summary": "2-3 paragraph summary of the interview performance",
    "strengths": ["strength1", "strength2", "strength3"],
    "weaknesses": ["weakness1", "weakness2"],
    "personalized_roadmap": [
        {{
            "topic": "Topic to improve",
            "action": "Specific action to take",
            "priority": "high|medium|low",
            "timeline": "1 week|2 weeks|1 month",
            "resources": ["resource1", "resource2"]
        }}
    ],
    "hiring_recommendation": "strong_hire|hire|lean_hire|lean_no_hire|no_hire",
    "hiring_explanation": "Explanation for the hiring recommendation",
    "resume_suggestions": ["suggestion1", "suggestion2"]
}}

Return ONLY valid JSON."""


def job_match_prompt(candidate_summary: str, job_description: str) -> str:
    """Evaluate candidate-job fit for recruiter mode."""
    return f"""Evaluate how well this candidate fits the job description.

CANDIDATE SUMMARY:
{candidate_summary[:500]}

JOB DESCRIPTION:
{job_description[:1000]}

Return a JSON object with EXACTLY this structure (no markdown, no code blocks, just pure JSON):
{{
    "fit_score": 75,
    "matching_skills": ["skill1", "skill2"],
    "missing_skills": ["skill3", "skill4"],
    "recommendation": "Brief recommendation text"
}}

Return ONLY valid JSON."""
