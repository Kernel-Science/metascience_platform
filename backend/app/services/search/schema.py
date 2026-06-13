"""Search intent schema and the normalized paper record.

`SearchIntent` is the structured representation the LLM extracts from a user's
natural-language request. Every connector turns this same intent into its own
provider query, so adding/removing a source never changes the contract.
"""
from __future__ import annotations

import re
from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field

SortMode = Literal["relevance", "date", "citations", "hybrid"]


class SearchIntent(BaseModel):
    """Structured search request derived from natural language.

    The LLM fills semantic + boolean + scope + time fields; connectors build
    their queries deterministically from them. Keeping "understand the request"
    (LLM) separate from "speak arXiv/OpenAlex/INSPIRE syntax" (code) is what
    makes precise queries reliable.
    """

    # --- Semantic core -----------------------------------------------------
    topics: List[str] = Field(
        default_factory=list,
        description="Core concepts/keywords of the request, most important "
        "first. Used both for keyword queries and for semantic reranking. "
        "Example: ['quantum error correction', 'surface codes'].",
    )
    phrases: List[str] = Field(
        default_factory=list,
        description="Multi-word terms that must be matched as exact phrases "
        "(quoted). Example: ['spontaneous collapse', 'de Sitter space'].",
    )

    # --- Boolean refinement ------------------------------------------------
    must_include: List[str] = Field(
        default_factory=list,
        description="Terms that MUST appear (logical AND). Use sparingly for "
        "hard constraints the user clearly requires.",
    )
    should_include: List[str] = Field(
        default_factory=list,
        description="Optional synonyms/expansions that broaden recall "
        "(logical OR). Example: for 'XAI' add ['explainability', "
        "'interpretability'].",
    )
    exclude: List[str] = Field(
        default_factory=list,
        description="Terms to exclude (logical NOT). Example: user says "
        "'not about machine learning' -> ['machine learning'].",
    )

    # --- Entities ----------------------------------------------------------
    authors: List[str] = Field(
        default_factory=list,
        description="Author full names to filter by, e.g. ['Juan Maldacena'].",
    )

    # --- Scope -------------------------------------------------------------
    arxiv_categories: List[str] = Field(
        default_factory=list,
        description="Specific arXiv category codes to scope physics subfields. "
        "Examples: 'quant-ph' (quantum), 'gr-qc' (gravitation/relativity), "
        "'hep-th' (high-energy theory), 'hep-ph', 'astro-ph.CO' (cosmology), "
        "'cond-mat.stat-mech', 'physics.hist-ph'. Only set when the subfield "
        "is clear from the request.",
    )
    field: Optional[str] = Field(
        default=None,
        description="Coarse discipline, one of: physics, computer_science, "
        "mathematics, biology, chemistry, engineering. Null if unclear.",
    )

    # --- Time --------------------------------------------------------------
    date_from: Optional[str] = Field(
        default=None,
        description="Earliest publication/submission date as YYYY-MM-DD. "
        "Resolve relative expressions against today's date (provided in the "
        "prompt). 'since 2020' -> '2020-01-01'; 'last 3 years' -> three years "
        "before today.",
    )
    date_to: Optional[str] = Field(
        default=None,
        description="Latest publication/submission date as YYYY-MM-DD.",
    )

    # --- Sorting & filters -------------------------------------------------
    sort: SortMode = Field(
        default="relevance",
        description="'relevance' (default — best topical match), 'date' when the "
        "user wants newest/latest/recent, 'citations' when they want purely the "
        "most-cited papers, or 'hybrid' to balance topical match with citation "
        "impact. Prefer 'hybrid' when the user wants influential work that is "
        "still on-topic (e.g. 'important/seminal/key papers about X').",
    )
    min_citations: Optional[int] = Field(
        default=None,
        description="Minimum citation count, if the user asks for well-cited "
        "or influential work.",
    )
    open_access_only: bool = Field(
        default=False,
        description="True only if the user explicitly wants open-access papers.",
    )

    # --- Meta --------------------------------------------------------------
    canonical_query: str = Field(
        default="",
        description="A concise human-readable summary of the interpreted "
        "query, shown back to the user. Example: 'Quantum error correction "
        "with surface codes (2021-2024), sorted by recency'.",
    )
    reasoning: str = Field(
        default="",
        description="One or two sentences explaining the interpretation "
        "choices (categories, date handling, synonyms).",
    )

    # --- Helpers -----------------------------------------------------------
    @staticmethod
    def anthropic_tool_schema() -> Dict[str, Any]:
        """JSON schema for the Anthropic tool-use definition."""
        schema = SearchIntent.model_json_schema()
        # Anthropic accepts standard JSON schema; strip the top-level title.
        schema.pop("title", None)
        return schema

    def semantic_text(self) -> str:
        """The text used to embed the query for reranking."""
        parts = list(self.topics) + list(self.phrases) + list(self.must_include)
        if not parts and self.canonical_query:
            parts = [self.canonical_query]
        return ", ".join(p for p in parts if p)

    def keyword_terms(self) -> List[str]:
        """De-duplicated keyword terms (original casing) for source queries."""
        out: List[str] = []
        seen: set = set()
        for t in list(self.topics) + list(self.phrases) + list(self.must_include):
            t = (t or "").strip()
            if t and t.lower() not in seen:
                seen.add(t.lower())
                out.append(t)
        return out

    def year_from(self) -> Optional[int]:
        return _year_of(self.date_from)

    def year_to(self) -> Optional[int]:
        return _year_of(self.date_to)

    def to_conversion_dict(self) -> Dict[str, Any]:
        """Back-compat payload for the existing /convert-query frontend.

        The current UI reads conversion.query, .category, .reasoning, and
        .suggested_filters.{years,subject_areas,document_type}. We keep those
        populated while also returning the full structured ``intent``.
        """
        yf, yt = self.year_from(), self.year_to()
        years: Optional[str] = None
        if yf and yt:
            years = f"{yf}-{yt}"
        elif yf:
            years = f"{yf}-present"
        elif yt:
            years = f"-{yt}"

        return {
            "query": self.canonical_query or self.semantic_text(),
            "category": self.field,
            "reasoning": self.reasoning,
            "suggested_filters": {
                "years": years,
                "subject_areas": self.arxiv_categories or None,
                "sort": self.sort,
            },
            "intent": self.model_dump(),
        }


def _year_of(date_str: Optional[str]) -> Optional[int]:
    if not date_str:
        return None
    m = re.match(r"\s*(\d{4})", str(date_str))
    return int(m.group(1)) if m else None


# ---------------------------------------------------------------------------
# Normalized paper record
# ---------------------------------------------------------------------------

def make_paper(
    *,
    source: str,
    source_name: str,
    title: str,
    authors: List[str],
    abstract: str = "",
    year: int = 0,
    published: str = "",
    doi: Optional[str] = None,
    arxiv_id: Optional[str] = None,
    paper_id: Optional[str] = None,
    citation_count: int = 0,
    reference_count: int = 0,
    venue: str = "",
    categories: Optional[List[str]] = None,
    url: str = "",
    pdf_url: str = "",
    abs_url: str = "",
    is_open_access: bool = False,
    extra: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Build a paper dict with the shape the frontend + downstream expect.

    Authors are normalized to ``[{"name": ...}]`` (PaperCard, the citation
    analyzer and trends all accept this shape).
    """
    doi = _clean_doi(doi)
    canonical = doi or (f"arxiv:{arxiv_id}" if arxiv_id else None) or paper_id or url
    paper: Dict[str, Any] = {
        "id": canonical or title[:60],
        "paperId": paper_id,
        "doi": doi,
        "arxiv_id": arxiv_id,
        "title": (title or "Untitled").strip(),
        "authors": [{"name": a} for a in authors if a],
        "abstract": (abstract or "").strip() or "No abstract available",
        "year": year or _year_of(published) or 0,
        "published": published or "",
        "citationCount": citation_count or 0,
        "referenceCount": reference_count or 0,
        "venue": venue or source_name,
        "categories": categories or [],
        "concepts": categories or [],
        "source": source,
        "source_name": source_name,
        "url": url or abs_url or pdf_url,
        "pdf_url": pdf_url,
        "abs_url": abs_url,
        "isOpenAccess": is_open_access,
    }
    if extra:
        paper.update(extra)
    return paper


def _clean_doi(doi: Optional[str]) -> Optional[str]:
    if not doi:
        return None
    d = str(doi).strip()
    for prefix in ("https://doi.org/", "http://doi.org/", "doi:", "DOI:"):
        if d.lower().startswith(prefix.lower()):
            d = d[len(prefix):]
    return d.strip().lower() or None


def normalize_title(title: str) -> str:
    """Aggressively normalized title for cross-source dedup."""
    t = (title or "").lower().strip()
    t = re.sub(r"[^a-z0-9 ]+", " ", t)
    t = re.sub(r"\s+", " ", t).strip()
    return t


def dedup_key(paper: Dict[str, Any]) -> str:
    """Best available identity key for a paper: DOI > arXiv id > title."""
    if paper.get("doi"):
        return f"doi:{_clean_doi(paper['doi'])}"
    if paper.get("arxiv_id"):
        aid = re.sub(r"v\d+$", "", str(paper["arxiv_id"]))  # strip version
        return f"arxiv:{aid.lower()}"
    nt = normalize_title(paper.get("title", ""))
    return f"title:{nt}" if len(nt) > 12 else f"id:{paper.get('id')}"


def candidate_keys(paper: Dict[str, Any]) -> List[str]:
    """All identity keys a paper exposes — used to merge the same work across
    sources even when one record has a DOI and another only an arXiv id/title."""
    keys: List[str] = []
    if paper.get("doi"):
        keys.append(f"doi:{_clean_doi(paper['doi'])}")
    if paper.get("arxiv_id"):
        aid = re.sub(r"v\d+$", "", str(paper["arxiv_id"]))
        keys.append(f"arxiv:{aid.lower()}")
    nt = normalize_title(paper.get("title", ""))
    if len(nt) > 12:
        keys.append(f"title:{nt}")
    if not keys and paper.get("id"):
        keys.append(f"id:{paper['id']}")
    return keys


def today_iso() -> str:
    return datetime.utcnow().strftime("%Y-%m-%d")
