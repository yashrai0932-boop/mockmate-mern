"""
Token Bucket Rate Limiter for NVIDIA NIM API.
Keeps requests safely under the 40 RPM free tier limit.
"""

import asyncio
import time
import logging

logger = logging.getLogger(__name__)


class TokenBucketRateLimiter:
    """
    Async-compatible token bucket rate limiter.
    
    How it works:
    - Starts with max_tokens available
    - Each request consumes 1 token
    - Tokens refill at refill_rate per second
    - If no tokens available, waits until one is available
    """

    def __init__(self, max_tokens: int = 35, refill_rate: float = 0.55):
        """
        Args:
            max_tokens: Maximum tokens in bucket (burst capacity)
            refill_rate: Tokens added per second (35/60 ≈ 0.583 for 35 RPM)
        """
        self.max_tokens = max_tokens
        self.refill_rate = refill_rate
        self.tokens = float(max_tokens)
        self.last_refill = time.monotonic()
        self._lock = asyncio.Lock()

    async def acquire(self):
        """
        Acquire a token. Waits if none available.
        Call this before making an API request.
        """
        async with self._lock:
            self._refill()

            if self.tokens >= 1:
                self.tokens -= 1
                logger.debug(f"Rate limiter: token acquired, {self.tokens:.1f} remaining")
                return

            # Calculate wait time for next token
            wait_time = (1 - self.tokens) / self.refill_rate
            logger.info(f"Rate limiter: throttling, waiting {wait_time:.1f}s")

        # Wait outside the lock so other coroutines aren't blocked
        await asyncio.sleep(wait_time)

        # Re-acquire after waiting
        async with self._lock:
            self._refill()
            self.tokens = max(0, self.tokens - 1)

    def _refill(self):
        """Refill tokens based on elapsed time."""
        now = time.monotonic()
        elapsed = now - self.last_refill
        self.tokens = min(self.max_tokens, self.tokens + elapsed * self.refill_rate)
        self.last_refill = now

    @property
    def available_tokens(self) -> float:
        """Check available tokens without consuming."""
        return self.tokens
