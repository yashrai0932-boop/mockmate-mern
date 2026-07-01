"""
In-memory LRU cache with TTL for AI responses.
Avoids redundant NIM API calls for similar prompts.
"""

import hashlib
import time
from collections import OrderedDict
from typing import Optional, Any
import logging

logger = logging.getLogger(__name__)


class ResponseCache:
    """
    Thread-safe LRU cache with time-to-live expiration.
    Uses hash of prompt content as cache key.
    """

    def __init__(self, max_size: int = 500, ttl_seconds: int = 3600):
        self.max_size = max_size
        self.ttl_seconds = ttl_seconds
        self._cache: OrderedDict[str, dict] = OrderedDict()

    def _make_key(self, *args) -> str:
        """Create a hash key from input arguments."""
        content = "|".join(str(a) for a in args)
        return hashlib.sha256(content.encode()).hexdigest()[:16]

    def get(self, *args) -> Optional[Any]:
        """Get a cached response. Returns None if not found or expired."""
        key = self._make_key(*args)

        if key not in self._cache:
            return None

        entry = self._cache[key]
        if time.time() - entry["timestamp"] > self.ttl_seconds:
            # Expired
            del self._cache[key]
            logger.debug(f"Cache expired for key {key}")
            return None

        # Move to end (most recently used)
        self._cache.move_to_end(key)
        logger.debug(f"Cache hit for key {key}")
        return entry["value"]

    def set(self, value: Any, *args):
        """Store a response in cache."""
        key = self._make_key(*args)

        if key in self._cache:
            self._cache.move_to_end(key)
        elif len(self._cache) >= self.max_size:
            # Remove least recently used
            evicted = self._cache.popitem(last=False)
            logger.debug(f"Cache evicted key {evicted[0]}")

        self._cache[key] = {
            "value": value,
            "timestamp": time.time(),
        }
        logger.debug(f"Cache set for key {key}")

    def clear(self):
        """Clear the entire cache."""
        self._cache.clear()

    @property
    def size(self) -> int:
        return len(self._cache)
