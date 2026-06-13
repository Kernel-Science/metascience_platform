"""Shared embedding-based clustering for papers.

Used by both trend analysis (theme discovery) and the citation network (coloring
nodes by sub-topic). Reuses the cached Gemini embedder, so papers already
embedded during search are clustered for free.
"""
from __future__ import annotations

import logging
import re
from collections import Counter
from typing import Any, Dict, List, Tuple

import numpy as np

from .search.rerank import embed_texts, paper_embedding_text

logger = logging.getLogger(__name__)

_STOPWORDS = set(
    "the a an of and or for to in on with using via from by we our is are be as at "
    "this that these those new novel approach method results study paper toward towards "
    "based use used model models system systems analysis between into over under within "
    "can will may also more most than then them they it its their which whose where "
    "high low large small first second three two one non via vs et al".split()
)


def _kmeans(X: np.ndarray, k: int, iters: int = 30, seed: int = 0) -> Tuple[np.ndarray, np.ndarray]:
    """Cosine k-means (rows of X are L2-normalized, so dot == cosine)."""
    rng = np.random.default_rng(seed)
    centroids = X[rng.choice(len(X), size=k, replace=False)].copy()
    labels = np.full(len(X), -1)
    for _ in range(iters):
        new_labels = (X @ centroids.T).argmax(axis=1)
        if np.array_equal(new_labels, labels):
            break
        labels = new_labels
        for j in range(k):
            members = X[labels == j]
            if len(members):
                c = members.mean(axis=0)
                n = np.linalg.norm(c)
                centroids[j] = c / n if n > 0 else centroids[j]
    return labels, centroids


def cluster_keywords(papers: List[Dict[str, Any]], n: int = 4) -> List[str]:
    text = " ".join((p.get("title", "") or "") for p in papers).lower()
    tokens = re.findall(r"[a-z][a-z0-9\-]{2,}", text)
    counts = Counter(t for t in tokens if t not in _STOPWORDS)
    return [w for w, _ in counts.most_common(n)]


async def cluster_papers(
    papers: List[Dict[str, Any]],
    *,
    min_papers: int = 8,
    max_k: int = 8,
    per_cluster: int = 10,
) -> Tuple[List[int], List[Dict[str, Any]]]:
    """Cluster papers by embedding similarity.

    Returns ``(labels, clusters)`` where ``labels[i]`` is the cluster id of
    ``papers[i]`` (-1 if clustering was skipped) and ``clusters`` is a list of
    per-cluster summaries (id, label_terms, size, share_pct, avg_citations,
    year_range, representative_papers). Degrades to ``([-1]*n, [])`` when there
    are too few papers or embeddings are unavailable.
    """
    n = len(papers)
    if n < min_papers:
        return [-1] * n, []
    vecs = await embed_texts([paper_embedding_text(p) for p in papers])
    if not vecs or len(vecs) != n:
        return [-1] * n, []

    X = np.asarray(vecs, dtype="float32")
    X /= np.linalg.norm(X, axis=1, keepdims=True) + 1e-8
    k = max(2, min(max_k, n // per_cluster))
    labels, centroids = _kmeans(X, k)

    clusters: List[Dict[str, Any]] = []
    for j in range(k):
        idx = np.where(labels == j)[0]
        if len(idx) == 0:
            continue
        members = [papers[i] for i in idx]
        sims = X[idx] @ centroids[j]
        rep = [members[i] for i in np.argsort(-sims)]  # closest to centroid first
        cites = [m.get("citationCount", 0) or 0 for m in members]
        yrs = [m.get("year", 0) for m in members if m.get("year", 0)]
        clusters.append({
            "id": j,
            "label_terms": cluster_keywords(members),
            "size": len(members),
            "share_pct": round(100 * len(members) / n),
            "avg_citations": round(sum(cites) / len(cites), 1) if cites else 0,
            "year_range": [min(yrs), max(yrs)] if yrs else None,
            "representative_papers": [r.get("title", "")[:120] for r in rep[:3]],
        })
    clusters.sort(key=lambda c: c["size"], reverse=True)
    return labels.tolist(), clusters
