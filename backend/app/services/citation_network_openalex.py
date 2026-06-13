"""OpenAlex-backed citation network builder.

Why OpenAlex: every work has a stable OpenAlex ID and lists `referenced_works`
(the papers it cites) as OpenAlex IDs, and the `cites` / `cited_by` filters are
ID-based. That means we can use **OpenAlex IDs as the canonical node id** and
build every edge with one rule — `edge(A→B) iff B ∈ A.referenced_works` — with
no DOI/arXiv/title matching (the source of the old network's missing edges).

Graph roles & edge direction (matches the frontend's expectations):
- a node is `seed`, `cited` (a reference of a seed), `citing` (cites a seed), or `other`
- an edge `from → to` means *from cites to*; so seed→reference and citing→seed
"""
from __future__ import annotations

import asyncio
import logging
import re
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import quote

from app.config import OPENALEX_MAILTO

from .cache import openalex_cache
from .clustering import cluster_papers
from .search.connectors.base import get_with_retry

logger = logging.getLogger(__name__)

OPENALEX = "https://api.openalex.org/works"
_SELECT = ",".join([
    "id", "doi", "display_name", "publication_year", "publication_date",
    "cited_by_count", "referenced_works", "authorships", "primary_location",
    "abstract_inverted_index", "type",
])
_TOP_DEFAULT = 25
_ALL_CAP = 200            # protect the frontend graph from thousands of nodes
_CANDIDATE_MULT = 4       # over-fetch factor before connection-based reranking
_MAX_SEEDS = 30           # cap seeds (a coming-from-search request can have ~100 DOIs)
_CONCURRENCY = 8          # polite cap on simultaneous OpenAlex requests

_sema = asyncio.Semaphore(_CONCURRENCY)


def _short(oaid: Optional[str]) -> str:
    return oaid.rsplit("/", 1)[-1] if oaid else ""


def _reconstruct_abstract(inv: Dict[str, List[int]]) -> str:
    if not inv:
        return ""
    positions = sorted((p, w) for w, ps in inv.items() for p in ps)
    return " ".join(w for _, w in positions)


class OpenAlexNetworkBuilder:
    def __init__(self) -> None:
        self.mailto = OPENALEX_MAILTO

    async def _get(self, *, url: str = OPENALEX, params: Dict[str, Any]) -> Optional[dict]:
        # Cache key ignores mailto and is order-independent, so repeated
        # resolve/cites/cited_by calls within the TTL are served for free.
        cache_key = (url, tuple(sorted((k, str(v)) for k, v in params.items())))
        cached = openalex_cache.get(cache_key)
        if cached is not None:
            return cached
        req = {**params, "mailto": self.mailto} if self.mailto else params
        async with _sema:  # bound concurrency to stay within OpenAlex's polite pool
            resp = await get_with_retry(url, params=req)
        if resp is None:
            return None
        try:
            data = resp.json()
        except Exception:  # noqa: BLE001
            return None
        openalex_cache.set(cache_key, data)
        return data

    # --- fetching ---------------------------------------------------------
    async def resolve_seed(self, ref: str) -> Optional[dict]:
        """Resolve a DOI / arXiv id / OpenAlex id to a full OpenAlex work."""
        ref = (ref or "").strip()
        if not ref:
            return None
        m = re.search(r"(W\d{5,})", ref)
        if m:
            return await self._get(url=f"{OPENALEX}/{m.group(1)}", params={"select": _SELECT})
        am = re.match(r"(?:arxiv:)?(\d{4}\.\d{4,5})(v\d+)?$", ref, re.I)
        if am:
            data = await self._get(params={"filter": f"ids.arxiv:{am.group(1)}", "select": _SELECT, "per-page": 1})
            results = (data or {}).get("results", [])
            return results[0] if results else None
        doi = ref.replace("https://doi.org/", "").replace("http://doi.org/", "").replace("doi:", "").strip()
        return await self._get(url=f"{OPENALEX}/doi:{quote(doi)}", params={"select": _SELECT})

    async def _fetch_related(self, sid: str, kind: str, limit: int) -> List[dict]:
        """kind='cited_by' -> references of sid; kind='cites' -> papers citing sid."""
        out: List[dict] = []
        cursor = "*"
        while len(out) < limit:
            data = await self._get(params={
                "filter": f"{kind}:{sid}",
                "per-page": min(200, limit),
                "select": _SELECT,
                "sort": "cited_by_count:desc",
                "cursor": cursor,
            })
            if not data:
                break
            results = data.get("results", [])
            out.extend(results)
            cursor = (data.get("meta") or {}).get("next_cursor")
            if not cursor or not results:
                break
        return out[:limit]

    # --- normalization ----------------------------------------------------
    def _to_paper(self, w: dict) -> Dict[str, Any]:
        sid = _short(w.get("id"))
        authors = [a["author"].get("display_name", "") for a in w.get("authorships", []) or [] if a.get("author")]
        source = (w.get("primary_location") or {}).get("source") or {}
        venue = source.get("display_name") or ""
        refs = [_short(r) for r in (w.get("referenced_works") or [])]
        cc = w.get("cited_by_count", 0) or 0
        return {
            "id": sid,
            "openalex_id": sid,
            "doi": (w.get("doi") or "").replace("https://doi.org/", "") or None,
            "title": w.get("display_name") or "Untitled",
            "authors": [{"name": a} for a in authors if a],
            "year": w.get("publication_year") or 0,
            "published": w.get("publication_date") or "",
            "venue": venue,
            "journal": venue,
            "abstract": _reconstruct_abstract(w.get("abstract_inverted_index") or {}),
            "citationCount": cc,
            "citationsCount": cc,
            "referenceCount": len(refs),
            "referencesCount": len(refs),
            "type": w.get("type") or "article",
            "source": "openalex",
            "source_name": "OpenAlex",
            "url": w.get("id"),
            "_refs": refs,
        }

    def _node(self, p: Dict[str, Any], role: str) -> Dict[str, Any]:
        parts = [p["title"]]
        yv = [str(p["year"])] if p["year"] else []
        if p["venue"]:
            yv.append(p["venue"])
        if yv:
            parts.append(" • ".join(yv))
        if p["citationCount"]:
            parts.append(f"{p['citationCount']} citations")
        names = [a["name"] for a in p["authors"][:3]]
        if names:
            parts.append(", ".join(names) + (" et al." if len(p["authors"]) > 3 else ""))
        return {
            "id": p["id"],
            "label": p["title"][:40],
            "title": "\n".join(parts),
            "isSeed": role == "seed",
            "type": role,
            "citationsCount": p["citationCount"],
            "year": p["year"],
            "journal": p["venue"],
        }

    # --- main -------------------------------------------------------------
    async def build(
        self,
        seed_refs: List[str],
        *,
        cited: str = "top",
        citing: str = "top",
        top_n: int = _TOP_DEFAULT,
    ) -> Dict[str, Any]:
        # 1. resolve seeds (parallel, capped)
        seed_refs = [r for r in seed_refs if r][:_MAX_SEEDS]
        resolved = await asyncio.gather(*(self.resolve_seed(r) for r in seed_refs))
        seeds: Dict[str, Dict[str, Any]] = {}
        for w in resolved:
            if w and w.get("id"):
                p = self._to_paper(w)
                seeds[p["id"]] = p
        if not seeds:
            return {"_no_seeds": True}

        seed_ids = set(seeds)
        want = _ALL_CAP if (cited == "all" or citing == "all") else max(60, top_n * _CANDIDATE_MULT)

        # 2. fetch references + citations per seed (parallel)
        async def per_seed(sid: str) -> Tuple[List[dict], List[dict]]:
            refs = await self._fetch_related(sid, "cited_by", want) if cited != "none" else []
            cits = await self._fetch_related(sid, "cites", want) if citing != "none" else []
            return refs, cits

        results = await asyncio.gather(*(per_seed(sid) for sid in seeds))
        cand_refs: Dict[str, Dict[str, Any]] = {}
        cand_cits: Dict[str, Dict[str, Any]] = {}
        for refs, cits in results:
            for w in refs:
                p = self._to_paper(w)
                if p["id"] and p["id"] not in seed_ids:
                    cand_refs.setdefault(p["id"], p)
            for w in cits:
                p = self._to_paper(w)
                if p["id"] and p["id"] not in seed_ids:
                    cand_cits.setdefault(p["id"], p)

        # 3a. select references: rank by #seeds citing them, then citation count
        def ref_conn(pid: str) -> int:
            return sum(1 for s in seeds.values() if pid in s["_refs"])

        if cited == "all":
            sel_refs = list(cand_refs)
        elif cited == "none":
            sel_refs = []
        else:
            sel_refs = sorted(cand_refs, key=lambda pid: (ref_conn(pid), cand_refs[pid]["citationCount"]), reverse=True)[:top_n]

        # 3b. select citing papers: rank by how many *core* papers (seeds +
        # selected refs) they cite — this floats topically-connected follow-ups
        # above generic tool papers (SciPy/NumPy) that merely cite the seed.
        core = seed_ids | set(sel_refs)

        def cit_conn(p: Dict[str, Any]) -> int:
            return len(core.intersection(p["_refs"]))

        if citing == "all":
            sel_cits = list(cand_cits)
        elif citing == "none":
            sel_cits = []
        else:
            sel_cits = sorted(cand_cits, key=lambda pid: (cit_conn(cand_cits[pid]), cand_cits[pid]["citationCount"]), reverse=True)[:top_n]

        # 4. assemble final node set with roles
        final: Dict[str, Dict[str, Any]] = {}
        roles: Dict[str, str] = {}
        for pid, p in seeds.items():
            final[pid] = p
            roles[pid] = "seed"
        for pid in sel_refs:
            final.setdefault(pid, cand_refs[pid])
            roles.setdefault(pid, "cited")
        for pid in sel_cits:
            final.setdefault(pid, cand_cits[pid])
            roles.setdefault(pid, "citing")

        node_ids = set(final)

        # 5. edges: A→B iff B ∈ A.referenced_works and both are nodes
        edge_set = set()
        for pid, p in final.items():
            for b in p["_refs"]:
                if b in node_ids and b != pid:
                    edge_set.add((pid, b))
        edges = [{"from": f, "to": t} for f, t in edge_set]

        # 6. cluster nodes by embedding similarity (theme grouping for coloring)
        final_items = list(final.items())
        labels, cluster_summary = await cluster_papers(
            [p for _, p in final_items], min_papers=8, max_k=6, per_cluster=8
        )

        # 7. build outputs (each node/paper tagged with its theme cluster)
        nodes, papers = [], []
        for i, (pid, p) in enumerate(final_items):
            cl = labels[i] if i < len(labels) else -1
            node = self._node(p, roles[pid])
            node["cluster"] = cl
            nodes.append(node)
            q = {k: v for k, v in p.items() if k != "_refs"}
            q["isSeed"] = roles[pid] == "seed"
            q["type"] = roles[pid]
            q["cluster"] = cl
            papers.append(q)

        stats = {
            "total_papers": len(final),
            "seed_papers": len(seeds),
            "cited_papers": len(sel_refs),
            "citing_papers": len(sel_cits),
            "total_edges": len(edges),
            "clusters": len(cluster_summary),
        }
        return {
            "nodes": nodes,
            "edges": edges,
            "papers": papers,
            "seed_paper_ids": list(seeds),
            "stats": stats,
            "clusters": cluster_summary,
        }


network_builder = OpenAlexNetworkBuilder()
