"""Tiny in-process caches shared across services.

Goal: never pay twice for the same expensive call within a session — Gemini
embeddings (reused between search reranking and trend clustering) and OpenAlex
citation/reference lookups (reused across repeated network builds). These are
process-local; swap for Redis if/when we run multiple instances.
"""
from __future__ import annotations

import hashlib
import threading
import time
from typing import Any, Optional


def text_key(text: str) -> str:
    return hashlib.md5((text or "").encode("utf-8", "ignore")).hexdigest()


class TTLCache:
    def __init__(self, ttl: float = 3600.0, max_size: int = 2000) -> None:
        self.ttl = ttl
        self.max_size = max_size
        self._store: dict[Any, tuple[Any, float]] = {}
        self._lock = threading.Lock()
        self.hits = 0
        self.misses = 0

    def get(self, key: Any) -> Optional[Any]:
        with self._lock:
            item = self._store.get(key)
            if item is None:
                self.misses += 1
                return None
            val, ts = item
            if self.ttl and (time.time() - ts) > self.ttl:
                self._store.pop(key, None)
                self.misses += 1
                return None
            self.hits += 1
            return val

    def set(self, key: Any, val: Any) -> None:
        with self._lock:
            if len(self._store) >= self.max_size and key not in self._store:
                # Evict ~10% oldest by insertion order.
                for k in list(self._store.keys())[: max(1, self.max_size // 10)]:
                    self._store.pop(k, None)
            self._store[key] = (val, time.time())

    def stats(self) -> dict:
        with self._lock:
            return {"size": len(self._store), "hits": self.hits, "misses": self.misses}


# Content-addressed embedding cache: identical text -> identical vector, so a
# long TTL is fine. Keyed by (model, task_type, text_hash).
embedding_cache = TTLCache(ttl=24 * 3600, max_size=8000)

# OpenAlex citation/reference responses, keyed by (url, params).
openalex_cache = TTLCache(ttl=3600, max_size=3000)

# Semantic Scholar citation counts, keyed by the S2 id (DOI:.. / ARXIV:..).
s2_cache = TTLCache(ttl=3600, max_size=5000)

# Full ranked search result lists, keyed by intent signature. Lets pagination
# ("load more") slice a stable ranking without re-fetching/re-ranking. Short TTL
# since it holds large lists; bounded entry count to cap memory.
search_results_cache = TTLCache(ttl=600, max_size=100)
