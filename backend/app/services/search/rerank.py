"""Semantic reranking of merged candidates.

After multi-source retrieval the candidate pool is relevance-mixed, so we
re-score every paper by relevance to the user's intent. This is what fixes
"results not even related to my query".

Two backends, selected by ``RERANK_PROVIDER``:
- embeddings (Google ``gemini-embedding`` ) — cheapest/fastest;
- an Anthropic LLM listwise rerank — works without Google billing.
In "auto" mode we try embeddings and fall back to the LLM. Reranking is always
best-effort: on total failure papers are returned unchanged.
"""
from __future__ import annotations

import asyncio
import json
import logging
from typing import Any, Dict, List, Optional

from app.config import (
    ANTHROPIC_API_KEY,
    ANTHROPIC_MODEL,
    EMBEDDING_MODEL,
    GOOGLE_API_KEY,
    RERANK_PROVIDER,
)
from app.services.cache import embedding_cache, text_key

logger = logging.getLogger(__name__)

_BATCH = 64
_MAX_CHARS = 2000
_LLM_CAP = 150  # max papers sent to the LLM reranker (token budget)


def _doc_text(p: Dict[str, Any], limit: int = _MAX_CHARS) -> str:
    title = p.get("title", "") or ""
    abstract = p.get("abstract", "") or ""
    if abstract == "No abstract available":
        abstract = ""
    return f"{title}\n\n{abstract}"[:limit]


def paper_embedding_text(p: Dict[str, Any]) -> str:
    """Canonical text used to embed a paper. Shared by reranking and trend
    clustering so the same paper hits the embedding cache instead of being
    re-embedded."""
    return _doc_text(p, _MAX_CHARS)


# ---------------------------------------------------------------------------
# Embedding backend (Google)
# ---------------------------------------------------------------------------
class _GoogleEmbedder:
    _FALLBACK_MODEL = "gemini-embedding-001"  # known-good if the configured one 404s

    def __init__(self) -> None:
        from google import genai

        self._client = genai.Client(api_key=GOOGLE_API_KEY)
        self.model = EMBEDDING_MODEL

    def _embed_sync(self, texts: List[str], task_type: str) -> List[List[float]]:
        from google.genai import types

        models = [self.model]
        if self.model != self._FALLBACK_MODEL:
            models.append(self._FALLBACK_MODEL)
        last_err: Optional[Exception] = None
        for model in models:
            # Try with task_type config, then plain (older/newer SDKs differ).
            for cfg in (types.EmbedContentConfig(task_type=task_type), None):
                try:
                    kwargs: Dict[str, Any] = {"model": model, "contents": texts}
                    if cfg is not None:
                        kwargs["config"] = cfg
                    resp = self._client.models.embed_content(**kwargs)
                    if model != self.model:
                        logger.warning("Embedding model %r unavailable; using %r", self.model, model)
                        self.model = model  # remember the working model
                    return [list(e.values) for e in resp.embeddings]
                except Exception as e:  # noqa: BLE001
                    last_err = e
        raise last_err if last_err else RuntimeError("embed failed")

    async def embed(self, texts: List[str], task_type: str) -> List[List[float]]:
        # Serve from the content-addressed cache; only embed the misses.
        results: List[Optional[List[float]]] = [None] * len(texts)
        misses: List[str] = []
        miss_idx: List[int] = []
        for i, t in enumerate(texts):
            cached = embedding_cache.get((self.model, task_type, text_key(t)))
            if cached is not None:
                results[i] = cached
            else:
                misses.append(t)
                miss_idx.append(i)

        for start in range(0, len(misses), _BATCH):
            chunk = misses[start : start + _BATCH]
            vecs = await asyncio.to_thread(self._embed_sync, chunk, task_type)
            for j, v in enumerate(vecs):
                gi = miss_idx[start + j]
                results[gi] = v
                embedding_cache.set((self.model, task_type, text_key(chunk[j])), v)

        if texts:
            logger.info("Embeddings: %d new, %d cached", len(misses), len(texts) - len(misses))
        return [r for r in results if r is not None]


_embedder: Optional[_GoogleEmbedder] = None
_embedder_disabled = False  # init or runtime failure -> stop trying for this process


def _get_embedder() -> Optional[_GoogleEmbedder]:
    global _embedder, _embedder_disabled
    if _embedder_disabled:
        return None
    if _embedder is None:
        try:
            _embedder = _GoogleEmbedder()
        except Exception as e:  # noqa: BLE001
            logger.error("Embedder init failed: %s", e)
            _embedder_disabled = True
            return None
    return _embedder


async def _embedding_rerank(query_text: str, papers: List[Dict[str, Any]]) -> Optional[List[Dict[str, Any]]]:
    """Return reranked papers, or None if embeddings are unavailable (so the
    caller can fall back)."""
    global _embedder_disabled
    embedder = _get_embedder()
    if embedder is None:
        return None
    try:
        import numpy as np

        q_vecs = await embedder.embed([query_text], "RETRIEVAL_QUERY")
        doc_vecs = await embedder.embed([paper_embedding_text(p) for p in papers], "RETRIEVAL_DOCUMENT")
        if not q_vecs or len(doc_vecs) != len(papers):
            return None
        q = np.asarray(q_vecs[0], dtype="float32")
        d = np.asarray(doc_vecs, dtype="float32")
        q /= np.linalg.norm(q) + 1e-8
        d /= np.linalg.norm(d, axis=1, keepdims=True) + 1e-8
        scores = d @ q
        order = np.argsort(-scores)
        ranked: List[Dict[str, Any]] = []
        for rank, idx in enumerate(order):
            p = papers[int(idx)]
            p["relevance_score"] = round(float(scores[int(idx)]), 4)
            p["relevance_rank"] = rank + 1
            ranked.append(p)
        logger.info("Embedding rerank: %d papers (top %.3f)", len(ranked), float(scores[order[0]]))
        return ranked
    except Exception as e:  # noqa: BLE001
        # Disable for the rest of the process so we don't 429 on every search.
        _embedder_disabled = True
        logger.warning("Embedding rerank failed (%s); disabling embeddings, will fall back", str(e)[:120])
        return None


# ---------------------------------------------------------------------------
# LLM backend (Anthropic listwise rerank)
# ---------------------------------------------------------------------------
_anthropic = None
_anthropic_disabled = False
_RANK_TOOL = {
    "name": "submit_ranking",
    "description": "Submit papers ordered by relevance to the query.",
    "input_schema": {
        "type": "object",
        "properties": {
            "ranking": {
                "type": "array",
                "items": {"type": "integer"},
                "description": "Paper indices from MOST to LEAST relevant. "
                "Include every index exactly once.",
            }
        },
        "required": ["ranking"],
    },
}


def _get_anthropic():
    global _anthropic, _anthropic_disabled
    if _anthropic_disabled:
        return None
    if _anthropic is None:
        try:
            from anthropic import Anthropic

            _anthropic = Anthropic(api_key=ANTHROPIC_API_KEY)
        except Exception as e:  # noqa: BLE001
            logger.error("Anthropic rerank init failed: %s", e)
            _anthropic_disabled = True
            return None
    return _anthropic


async def _llm_rerank(query_text: str, papers: List[Dict[str, Any]]) -> Optional[List[Dict[str, Any]]]:
    client = _get_anthropic()
    if client is None:
        return None

    head = papers[:_LLM_CAP]
    tail = papers[_LLM_CAP:]
    listing = "\n".join(f"[{i}] {_doc_text(p, 280)}" for i, p in enumerate(head))
    prompt = (
        f"Query: {query_text}\n\n"
        f"Rank these {len(head)} papers by how well they match the query. "
        "Call submit_ranking with every index ordered most-relevant first.\n\n"
        f"{listing}"
    )

    def _call():
        return client.messages.create(
            model=ANTHROPIC_MODEL,
            max_tokens=2048,
            temperature=0,
            tools=[_RANK_TOOL],
            tool_choice={"type": "tool", "name": "submit_ranking"},
            messages=[{"role": "user", "content": prompt}],
        )

    try:
        resp = await asyncio.to_thread(_call)
        ranking = None
        for block in resp.content:
            if getattr(block, "type", None) == "tool_use":
                ranking = block.input.get("ranking")
                break
        if not ranking:
            return None

        seen: set = set()
        ordered_idx: List[int] = []
        for i in ranking:
            if isinstance(i, int) and 0 <= i < len(head) and i not in seen:
                seen.add(i)
                ordered_idx.append(i)
        # Append any indices the model dropped, preserving original order.
        ordered_idx += [i for i in range(len(head)) if i not in seen]

        n = len(ordered_idx)
        ranked: List[Dict[str, Any]] = []
        for rank, idx in enumerate(ordered_idx):
            p = head[idx]
            p["relevance_rank"] = rank + 1
            p["relevance_score"] = round(1.0 - rank / max(1, n), 4)  # proxy score
            ranked.append(p)
        ranked.extend(tail)
        logger.info("LLM rerank: ordered %d papers (+%d tail)", n, len(tail))
        return ranked
    except Exception as e:  # noqa: BLE001
        logger.warning("LLM rerank failed (%s)", str(e)[:120])
        return None


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------
async def embed_texts(texts: List[str], task_type: str = "RETRIEVAL_DOCUMENT") -> Optional[List[List[float]]]:
    """Embed arbitrary texts (e.g. for clustering). None if unavailable.

    Reuses the same Google embedder + process-level disable latch as reranking.
    """
    global _embedder_disabled
    if not texts:
        return []
    embedder = _get_embedder()
    if embedder is None:
        return None
    try:
        return await embedder.embed(texts, task_type)
    except Exception as e:  # noqa: BLE001
        _embedder_disabled = True
        logger.warning("embed_texts failed (%s); embeddings disabled", str(e)[:120])
        return None


async def rerank(query_text: str, papers: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Reorder papers by relevance to ``query_text`` (adds ``relevance_score``).
    No-op if reranking is disabled or every backend fails."""
    if not query_text or len(papers) <= 1 or RERANK_PROVIDER == "none":
        return papers

    if RERANK_PROVIDER in ("auto", "google"):
        ranked = await _embedding_rerank(query_text, papers)
        if ranked is not None:
            return ranked
        if RERANK_PROVIDER == "google":
            return papers

    if RERANK_PROVIDER in ("auto", "anthropic"):
        ranked = await _llm_rerank(query_text, papers)
        if ranked is not None:
            return ranked

    return papers
