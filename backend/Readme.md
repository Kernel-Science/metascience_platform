# Metascience Platform — Backend

[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688.svg)](https://fastapi.tiangolo.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

The Python/FastAPI engine behind the Metascience Platform. It orchestrates the
literature sources, builds citation networks, clusters and synthesises research
trends, and runs AI paper assessments.

> New here? Start with the [root README](../README.md) for the full-stack setup.

## 🧩 What it does

| Area | Module(s) | Notes |
|---|---|---|
| Multi-source search | `app/services/search/` | Intent → connectors → enrich → rerank → orchestrate. See its [README](app/services/search/README.md). |
| Citation networks | `app/services/citation_network_openalex.py`, `citation_network_core.py`, `citations.py` | OpenAlex ID backbone for reliable edges |
| Trends & clustering | `app/services/trends.py`, `clustering.py` | Embedding clusters + Claude synthesis |
| Paper assessment | `app/services/paper_review.py` | Gemini structured review |
| Reviewer3 (optional) | `app/services/reviewer3.py` | External multi-reviewer peer review |
| Caching | `app/services/cache.py` | Shared embedding / OpenAlex caches |
| Config | `app/config.py` | Reads all env vars + model selection |

HTTP routes live in `app/routes/` and are mounted under `/api` in
`app/main.py`.

## 🚀 Quick start

```bash
python -m venv .venv
source .venv/bin/activate          # Windows: .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

cp .env.example .env               # add ANTHROPIC_API_KEY and GOOGLE_API_KEY
uvicorn app.main:app --reload      # http://localhost:8000
```

Health check: `GET http://localhost:8000/api/health`.
Interactive docs (FastAPI): `http://localhost:8000/docs`.

## 🔑 Environment variables

`ANTHROPIC_API_KEY` and `GOOGLE_API_KEY` are **required** (the app refuses to
start without them). Everything else is optional and upgrades a capability.

| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | **Required.** Claude — query understanding, trends, LLM rerank |
| `GOOGLE_API_KEY` | **Required.** Gemini — paper review + embeddings |
| `ANTHROPIC_MODEL` | Override Claude model (default `claude-sonnet-4-6`) |
| `GEMINI_REVIEW_MODEL` | Override review model (default `gemini-flash-latest`) |
| `OPENALEX_MAILTO` | Email for OpenAlex's polite pool (higher rate limits) |
| `SEMANTIC_SCHOLAR_API_KEY` | Lifts Semantic Scholar rate limits (alias: `SEMANTIC_SCHOLAR_API`) |
| `ADS_API_TOKEN` | Enables the NASA ADS source |
| `RERANK_PROVIDER` | `auto` (default) / `google` / `anthropic` / `none` |
| `EMBEDDING_MODEL` | Default `gemini-embedding-001` |
| `SEARCH_CANDIDATES_PER_SOURCE` | Over-fetch per source before merge/rerank (default 120) |
| `RELEVANCE_BLEND_ALPHA` | Relevance vs. citation-impact blend for hybrid sort (default 0.7) |
| `REVIEWER3_API_KEY`, `REVIEWER3_USER_ID`, `REVIEWER3_BASE_URL` | Optional Reviewer3 integration |

## 🌐 Key endpoints (mounted under `/api`)

| Endpoint | Method | Description |
|---|---|---|
| `/health` | GET | Liveness check |
| `/categories` | GET | Research category taxonomy |
| `/search` | GET / POST | Multi-source search (GET = flat params, POST = structured intent) |
| `/citation-network` | POST | Citation graph from a DOI |
| `/citation-network/expand` | POST | Grow an existing graph |
| `/analyze/trends` | POST | Trend clustering + AI synthesis for a set of papers |
| `/review/upload` | POST | AI paper assessment (multipart file) |
| `/review/reviewer3/*` | POST/GET | Optional Reviewer3 flow |

The public-facing Developer API is exposed by the **frontend** at `/api/v1/*`,
which authenticates the caller and proxies to these endpoints.

## 📚 Data sources

- **Search:** ArXiv, OpenAlex, INSPIRE-HEP, NASA ADS (key-gated).
- **Citations:** Semantic Scholar, OpenAlex, OpenCitations.

Connectors live in `app/services/search/connectors/`. No keys are needed to get
started, but `OPENALEX_MAILTO`, `SEMANTIC_SCHOLAR_API_KEY`, and `ADS_API_TOKEN`
raise rate limits and unlock full quality.

## 🚢 Deployment

- **Render:** `render.yaml` builds with `pip install -r requirements.txt` and
  starts `uvicorn server:app`. Set `ANTHROPIC_API_KEY` / `GOOGLE_API_KEY` in the
  dashboard. Health check path `/api/health`.
- **Docker:** `docker compose up` (see `Dockerfile` / `docker-compose.yml`).
- **`server.py`** is a thin entrypoint re-exporting `app.main:app` for hosts
  that import `server:app`.

## 📁 Structure

```
app/
├── main.py            # FastAPI app + router registration + CORS
├── config.py          # env vars + model selection
├── store.py           # in-memory document store (papers/analysis)
├── routes/            # health, catalog, analysis, network, papers, review, tools
└── services/
    ├── search/        # connectors, intent, enrich, rerank, orchestrator
    ├── citation_network_openalex.py, citation_network_core.py, citations.py
    ├── trends.py, clustering.py, visualization.py
    ├── paper_review.py, reviewer3.py, cache.py, research_client.py
    └── config/        # AI prompts (system.txt, prompt.txt)
```

## 📄 License
[MIT](../LICENSE).
