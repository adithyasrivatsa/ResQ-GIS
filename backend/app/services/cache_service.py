"""
ResQ-GIS Caching Service.
Provides in-memory caching with TTL and stale data fallback.
Optionally integrates with Redis if configured.
"""
from __future__ import annotations
import time
import logging
from typing import Any, Optional
from app.config import get_settings

logger = logging.getLogger(__name__)


class CacheEntry:
    def __init__(self, value: Any, ttl_seconds: float):
        self.value = value
        self.created_at = time.time()
        self.expires_at = self.created_at + ttl_seconds

    @property
    def is_expired(self) -> bool:
        return time.time() > self.expires_at

    @property
    def age_minutes(self) -> int:
        return max(0, int((time.time() - self.created_at) / 60))


class CacheService:
    def __init__(self):
        self._memory_cache: dict[str, CacheEntry] = {}
        self.settings = get_settings()
        self._redis_client = None

        if self.settings.redis_url:
            try:
                import redis
                self._redis_client = redis.from_url(self.settings.redis_url)
                logger.info("Connected to Redis cache")
            except Exception as e:
                logger.info(f"Redis not available, using in-memory cache: {e}")

    def get(self, key: str) -> Optional[Any]:
        """Get item if not expired."""
        entry = self._memory_cache.get(key)
        if entry and not entry.is_expired:
            return entry.value
        return None

    def get_stale(self, key: str) -> Optional[tuple[Any, int]]:
        """Get stale item if available along with age in minutes."""
        entry = self._memory_cache.get(key)
        if entry:
            return entry.value, entry.age_minutes
        return None

    def set(self, key: str, value: Any, ttl_seconds: float = 300.0):
        """Store item with TTL in seconds."""
        self._memory_cache[key] = CacheEntry(value, ttl_seconds)

    def is_redis_active(self) -> bool:
        return self._redis_client is not None


_cache_instance = CacheService()


def get_cache() -> CacheService:
    return _cache_instance
