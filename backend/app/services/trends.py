"""Trend analysis over a set of papers.

Rebuilt to be genuinely useful without a heavy full-text RAG dependency:
- statistics computed from the metadata the search already provides (no slow
  Semantic Scholar re-fetch — papers arrive with citation counts);
- **embedding-based theme clustering** groups the abstracts into data-driven
  themes (reuses the Gemini embedder), so themes aren't just LLM guesswork;
- a **structured, grounded synthesis** (Anthropic tool-use) writes the insights,
  referencing specific papers and the discovered clusters.

Output shape is unchanged so the existing analysis UI keeps working:
`{ai_analysis: {...6 fields...}, statistics: {...}, clusters: [...], ...}`.
"""
import asyncio
import logging
from collections import Counter
from datetime import datetime
from typing import Any, Dict, List

from anthropic import Anthropic

from ..config import ANTHROPIC_API_KEY, ANTHROPIC_MODEL
from .clustering import cluster_papers

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

_anthropic = Anthropic(api_key=ANTHROPIC_API_KEY)

_TREND_TOOL = {
    "name": "report_trends",
    "description": "Report a grounded trend analysis of the paper set.",
    "input_schema": {
        "type": "object",
        "properties": {
            "research_evolution": {"type": "string", "description": "2-4 sentences on how the topic evolved over the time span, referencing specific years/shifts."},
            "emerging_trends": {"type": "array", "items": {"type": "string"}, "description": "3-6 concrete emerging trends, each grounded in the papers/themes (name representative work)."},
            "key_research_themes": {"type": "array", "items": {"type": "string"}, "description": "The main themes present (use the discovered clusters), named clearly with their rough share of the set."},
            "notable_findings": {"type": "array", "items": {"type": "string"}, "description": "3-6 specific findings from high-impact papers, naming the paper."},
            "high_impact_areas": {"type": "string", "description": "2-4 sentences on which sub-areas concentrate the citations/impact."},
            "future_directions": {"type": "array", "items": {"type": "string"}, "description": "3-5 plausible future directions implied by the set."},
        },
        "required": ["research_evolution", "emerging_trends", "key_research_themes", "notable_findings", "high_impact_areas", "future_directions"],
    },
}

def _author_names(p: Dict[str, Any]) -> List[str]:
    out = []
    for a in p.get("authors", []) or []:
        name = a.get("name", "") if isinstance(a, dict) else str(a or "")
        if name and name != "Unknown authors":
            out.append(name)
    return out


class EnhancedTrendAnalyzer:
    async def _enrich_papers_with_citations(self, papers: List[Dict]) -> List[Dict]:
        """No-op kept for back-compat: search already provides citation counts."""
        return papers

    # --- statistics -------------------------------------------------------
    def _compute_stats(self, papers: List[Dict]) -> Dict[str, Any]:
        authors, concepts, years, venues, citations = [], [], [], [], []
        for p in papers:
            authors.extend(_author_names(p))
            concepts.extend([c for c in (p.get("concepts") or p.get("categories") or []) if c])
            y = p.get("year", 0) or 0
            if y > 1900:
                years.append(y)
            v = p.get("venue", "") or ""
            if v and v not in ("Unknown Venue", "Unknown"):
                venues.append(v)
            citations.append(p.get("citationCount", 0) or 0)

        cites_sorted = sorted(citations)
        return {
            "total_papers": len(papers),
            "processed_papers": len(papers),
            "year_range": {"min": min(years) if years else 0, "max": max(years) if years else 0},
            "avg_citations": sum(citations) / len(citations) if citations else 0,
            "median_citations": cites_sorted[len(cites_sorted) // 2] if cites_sorted else 0,
            "max_citations": max(citations) if citations else 0,
            "total_citations": sum(citations),
            "top_authors": Counter(authors).most_common(15),
            "top_venues": Counter(venues).most_common(15),
            "top_concepts": Counter(concepts).most_common(15),
            "yearly_distribution": dict(sorted(Counter(years).items())),
            "highly_cited_papers": len([c for c in citations if c > 100]),
            "recent_papers": len([y for y in years if y >= 2020]),
            "papers_with_citations": len([c for c in citations if c > 0]),
            "citation_distribution": {
                "0_citations": len([c for c in citations if c == 0]),
                "1_10_citations": len([c for c in citations if 1 <= c <= 10]),
                "11_50_citations": len([c for c in citations if 11 <= c <= 50]),
                "51_100_citations": len([c for c in citations if 51 <= c <= 100]),
                "100_plus_citations": len([c for c in citations if c > 100]),
            },
        }

    # --- clustering -------------------------------------------------------
    async def _cluster_themes(self, papers: List[Dict]) -> List[Dict[str, Any]]:
        _, clusters = await cluster_papers(papers, min_papers=8, max_k=8, per_cluster=10)
        return clusters

    # --- synthesis --------------------------------------------------------
    async def _synthesize(self, papers: List[Dict], stats: Dict, clusters: List[Dict]) -> Dict[str, Any]:
        top = sorted(papers, key=lambda p: p.get("citationCount", 0) or 0, reverse=True)[:15]
        top_papers = [{
            "title": p.get("title", "")[:140],
            "year": p.get("year", 0),
            "citations": p.get("citationCount", 0) or 0,
            "abstract": (p.get("abstract", "") or "")[:220],
        } for p in top if p.get("title")]

        context = {
            "stats": {
                "total_papers": stats["total_papers"],
                "year_range": stats["year_range"],
                "avg_citations": round(stats["avg_citations"], 1),
                "median_citations": stats["median_citations"],
                "max_citations": stats["max_citations"],
                "highly_cited_papers": stats["highly_cited_papers"],
                "recent_papers": stats["recent_papers"],
                "yearly_distribution": stats["yearly_distribution"],
                "top_venues": [v for v, _ in stats["top_venues"][:8]],
                "top_authors": [a for a, _ in stats["top_authors"][:8]],
            },
            "themes": clusters,
            "top_cited_papers": top_papers,
        }

        system = (
            "You are a metascience analyst. Given statistics, embedding-derived "
            "themes (clusters), and the top-cited papers from a literature set, "
            "produce a grounded trend analysis by calling report_trends. Ground "
            "every claim in the provided data: reference specific papers by title "
            "and use the discovered themes. Do not invent papers or facts. Be "
            "concrete and concise; avoid generic filler."
        )
        import json as _json
        user = "Analyze this literature set:\n" + _json.dumps(context, ensure_ascii=False)

        def _call():
            return _anthropic.messages.create(
                model=ANTHROPIC_MODEL,
                max_tokens=1500,
                temperature=0.3,
                system=system,
                tools=[_TREND_TOOL],
                tool_choice={"type": "tool", "name": "report_trends"},
                messages=[{"role": "user", "content": user}],
            )

        try:
            resp = await asyncio.to_thread(_call)
            for block in resp.content:
                if getattr(block, "type", None) == "tool_use":
                    out = dict(block.input)
                    # Guarantee all six keys exist (the model may omit some).
                    for k, default in {
                        "research_evolution": "", "emerging_trends": [],
                        "key_research_themes": [], "notable_findings": [],
                        "high_impact_areas": "", "future_directions": [],
                    }.items():
                        out.setdefault(k, default)
                    return out
            raise ValueError("no tool_use block")
        except Exception as e:  # noqa: BLE001
            logger.error("Trend synthesis failed (%s); using fallback", e)
            return {
                "fallback_mode": True,
                "research_evolution": f"Set spans {stats['year_range']['min']}-{stats['year_range']['max']} with {stats['total_papers']} papers.",
                "key_research_themes": [", ".join(c["label_terms"]) for c in clusters[:6]] or [c for c, _ in stats["top_concepts"][:5]],
                "emerging_trends": [c for c, _ in stats["top_concepts"][:4]],
                "notable_findings": [f"Most-cited paper has {stats['max_citations']} citations"],
                "high_impact_areas": f"{stats['highly_cited_papers']} papers exceed 100 citations.",
                "future_directions": [],
            }

    # --- main -------------------------------------------------------------
    async def analyze_comprehensive_trends(self, papers: List[Dict]) -> Dict[str, Any]:
        try:
            if not papers:
                return {"error": "No papers provided"}
            stats = self._compute_stats(papers)
            clusters = await self._cluster_themes(papers)
            ai_analysis = await self._synthesize(papers, stats, clusters)
            return {
                "ai_analysis": ai_analysis,
                "statistics": stats,
                "clusters": clusters,
                "paper_count": len(papers),
                "processed_count": len(papers),
                "timestamp": datetime.now().isoformat(),
            }
        except Exception as e:  # noqa: BLE001
            logger.error("Trend analysis error: %s", e, exc_info=True)
            return {"error": str(e)}


trend_analyzer = EnhancedTrendAnalyzer()
