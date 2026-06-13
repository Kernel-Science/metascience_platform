"""Shared HTTP plumbing for source connectors.

One async client is reused across connectors. Every connector is expected to
catch its own errors and return ``[]`` so one failing source never sinks a
whole search (the orchestrator also guards with ``return_exceptions``).
"""
from __future__ import annotations

import asyncio
import logging
from typing import Any, Dict, List, Optional, Protocol

import httpx

from ..schema import SearchIntent

logger = logging.getLogger(__name__)

_USER_AGENT = (
    "MetasciencePlatform/2.0 (https://metascience.fqxi.org; research tool)"
)

# Single shared client. Created lazily so importing connectors never opens a
# socket at import time (matters for tests / cold starts).
_client: Optional[httpx.AsyncClient] = None


def get_client() -> httpx.AsyncClient:
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.AsyncClient(
            timeout=httpx.Timeout(25.0, connect=10.0),
            headers={"User-Agent": _USER_AGENT},
            follow_redirects=True,
        )
    return _client


async def get_with_retry(
    url: str,
    *,
    params: Optional[Dict[str, Any]] = None,
    headers: Optional[Dict[str, str]] = None,
    retries: int = 2,
    backoff: float = 1.5,
) -> Optional[httpx.Response]:
    """GET with light retry on 429/5xx. Returns None on persistent failure."""
    client = get_client()
    for attempt in range(retries + 1):
        try:
            resp = await client.get(url, params=params, headers=headers)
            if resp.status_code == 200:
                return resp
            if resp.status_code in (429, 500, 502, 503, 504) and attempt < retries:
                wait = backoff * (2 ** attempt)
                logger.warning("%s -> %s, retrying in %.1fs", url, resp.status_code, wait)
                await asyncio.sleep(wait)
                continue
            logger.warning("GET %s failed: %s", url, resp.status_code)
            return None
        except Exception as e:  # noqa: BLE001 - connectors must never raise
            if attempt < retries:
                await asyncio.sleep(backoff * (2 ** attempt))
                continue
            logger.error("GET %s error: %s", url, e)
            return None
    return None


class Connector(Protocol):
    """A literature source. Turns a SearchIntent into normalized papers."""

    name: str        # human-readable, e.g. "arXiv"
    source_id: str   # stable id used in filters, e.g. "arxiv"

    def available(self) -> bool: ...

    async def search(self, intent: SearchIntent, limit: int) -> List[Dict[str, Any]]: ...
