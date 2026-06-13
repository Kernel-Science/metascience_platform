# Search subsystem

Multi-source paper search: one query is expanded into a structured intent, fanned
out to several scholarly databases in parallel, then deduplicated, enriched, and
reranked into a single relevance-ordered list.

## Pipeline

```
query/intent
   │
   ▼  intent.py        normalise into a SearchIntent (topics, authors, dates,
   │                   arxiv categories, min_citations, sort)
   ▼  connectors/      query each source in parallel (over-fetch candidates)
   │     ├─ arxiv_connector.py      ArXiv
   │     ├─ openalex_connector.py   OpenAlex
   │     ├─ inspire_connector.py    INSPIRE-HEP
   │     └─ ads_connector.py        NASA ADS (key-gated)
   ▼  orchestrator.py  merge + dedup across sources
   ▼  enrich.py        backfill missing metadata (abstracts, citation counts)
   ▼  rerank.py        semantic rerank (embeddings, LLM fallback, or off)
   ▼
results  (papers[], total_found, sources_used, reranked, errors, intent)
```

## Files

| File | Role |
|---|---|
| `schema.py` | `SearchIntent` dataclass + the result shape |
| `intent.py` | Build/normalise a `SearchIntent` |
| `connectors/base.py` | Connector interface shared by all sources |
| `connectors/*.py` | One adapter per source |
| `enrich.py` | Fill gaps in merged records |
| `rerank.py` | Relevance reranking (see `RERANK_PROVIDER`) |
| `orchestrator.py` | `run_search(intent, limit, offset, sources)` — ties it together |

## Entry point

`orchestrator.run_search()` is the single entry point. It's called from
`app/routes/catalog.py` (`GET`/`POST /api/search`) and reused by the trends and
Assistant flows.

## Configuration

Set in `app/config.py` (overridable via env):

- `SEARCH_CANDIDATES_PER_SOURCE` — how many candidates to over-fetch per source
  before merge/rerank.
- `RERANK_PROVIDER` — `auto` (embeddings → LLM fallback) / `google` /
  `anthropic` / `none`.
- `EMBEDDING_MODEL`, `RELEVANCE_BLEND_ALPHA`.

API keys that upgrade individual sources: `OPENALEX_MAILTO`,
`SEMANTIC_SCHOLAR_API_KEY`, `ADS_API_TOKEN`.
