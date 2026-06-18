# FQxI Metascience Platform

> An open-source research platform that helps academics and curious minds search, map, and evaluate scientific literature with AI assistance. A Next.js web app sits on top of a Python/FastAPI engine that unifies multiple scholarly databases (ArXiv, OpenAlex, INSPIRE-HEP, NASA ADS) and modern AI models.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Live instance: **https://metascience.fqxi.org**

---

## ✨ Features

- **🤖 Assistant** — a conversational research agent (Claude) that searches, builds citation networks, analyses trends, and assesses papers, rendering rich results inline.
- **🔍 Multi-source search** — one query fans out to **ArXiv, OpenAlex, INSPIRE-HEP, and NASA ADS**, then results are deduplicated and reranked for relevance.
- **🕸️ Citation networks** — interactive citation graphs built on an OpenAlex identifier backbone, with Semantic Scholar / OpenCitations for citation data.
- **📈 Trend analysis** — theme clustering plus an AI-written synthesis of how a field is evolving.
- **📝 Paper assessment** — automated, peer-review-style scoring of an uploaded paper (Gemini), with per-criterion justifications.
- **🧑‍💻 Public Developer API** — generate an API key and call the same engines from your own projects (see [Developer API](#-developer-api)).

## 🏗️ Architecture

```
┌─────────────────────────┐        ┌─────────────────────────┐
│  frontend/ (Next.js 15) │  HTTP  │  backend/ (FastAPI)     │
│  • App Router UI        │ ─────▶ │  • search orchestrator  │
│  • /api proxy routes    │        │  • citation network     │
│  • /api/v1 public API   │        │  • trends + clustering  │
└───────────┬─────────────┘        │  • AI paper review      │
            │                      └───────────┬─────────────┘
            │ auth + per-user data             │ literature + AI
            ▼                                  ▼
   ┌──────────────────┐            ArXiv · OpenAlex · INSPIRE-HEP
   │  Supabase        │            NASA ADS · Semantic Scholar
   │  (Postgres+Auth) │            Anthropic Claude · Google Gemini
   └──────────────────┘
```

- **Frontend** (`/frontend`) — Next.js 15 (App Router) + HeroUI/Tailwind. Hosts the UI, thin `/api` proxy routes to the engine, and the public `/api/v1` Developer API.
- **Backend** (`/backend`) — Python/FastAPI engine that orchestrates the literature sources, citation-network builder, trend clustering, and AI review.
- **Supabase** — authentication and per-user data (chat history, saved reviews, API keys, feedback) under row-level security.

## 🚀 Quick start

### Prerequisites
- **Node.js** 18+ and **pnpm** (or npm)
- **Python** 3.11+ (3.13 supported)
- A **Supabase** project (free tier is fine)
- **Anthropic API key** (Assistant, query understanding, trends)
- **Google AI API key** (paper review + embeddings)

### 1. Clone
```bash
git clone https://github.com/Kernel-Science/Metascience_Platform.git
cd Metascience_Platform
```

### 2. Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate           # Windows: .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

cp .env.example .env                # then edit .env (see table below)
uvicorn app.main:app --reload       # http://localhost:8000
```

### 3. Supabase (database & auth)
In your Supabase project's **SQL editor**, run the migration files in
`frontend/` (order doesn't matter, but run all four):

```
supabase_migration_feedback.sql
supabase_migration_chat.sql
supabase_migration_reviewer3.sql
supabase_migration_api_keys.sql
```

For profile avatars, create a public Storage bucket named **`avatars`**.
Enable the Email and (optionally) Google auth providers under **Authentication > Providers**.

### 4. Frontend
```bash
cd frontend
pnpm install
cp .env.example .env.local          # then edit .env.local (see table below)
pnpm dev                            # http://localhost:3000
```

For production: `pnpm build && pnpm start`.

## 🔑 Environment variables

### Backend (`backend/.env`)
| Variable | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ | Claude — query understanding, trends, rerank fallback |
| `GOOGLE_API_KEY` | ✅ | Gemini — paper review + embeddings |
| `ANTHROPIC_MODEL` | – | Override the Claude model (default `claude-sonnet-4-6`) |
| `GEMINI_REVIEW_MODEL` | – | Override the review model (default `gemini-flash-latest`) |
| `OPENALEX_MAILTO` | – | Email for OpenAlex's polite pool (higher rate limits) |
| `SEMANTIC_SCHOLAR_API_KEY` | – | Lifts Semantic Scholar rate limits |
| `ADS_API_TOKEN` | – | Enables the NASA ADS source |
| `RERANK_PROVIDER` | – | `auto` / `google` / `anthropic` / `none` |
| `REVIEWER3_API_KEY`, `REVIEWER3_USER_ID` | – | Optional Reviewer3 multi-reviewer integration |

### Frontend (`frontend/.env.local`)
| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key (auth) |
| `NEXT_PUBLIC_SITE_URL` | ✅ | Base URL for auth callbacks (e.g. `http://localhost:3000`) |
| `NEXT_PUBLIC_BACKEND_URL` | ✅ | FastAPI engine URL (e.g. `http://localhost:8000`) |
| `ANTHROPIC_API_KEY` | ✅ | Assistant (chat) calls Claude from the Next.js server |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅* | Server-only; verifies public API keys. *Required only for the Developer API.* |

## 🚀 Deployment notes

Paper review and the Reviewer3 integration upload PDFs (multipart). If a
reverse proxy sits in front of the app (nginx, etc.), its body-size limit must
be raised or uploads are rejected **before reaching the app** — nginx's default
`client_max_body_size` is **1 MB**, which rejects almost every academic PDF with
a `413` HTML error page (the app then sees the cryptic “Unexpected token `<`”).

```nginx
# in the server { } block(s) that proxy to the frontend and backend
client_max_body_size 100m;
```

Reload after changing it: `sudo nginx -t && sudo systemctl reload nginx`.

## 🧑‍💻 Developer API

Signed-in users can create API keys at **`/developer`** and call the platform's
engines over HTTP at `https://<your-host>/api/v1`:

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/search` | GET | Multi-source paper search |
| `/api/v1/citation-network` | POST | Build a citation graph from a DOI |
| `/api/v1/trends` | POST | Trend clustering + AI synthesis for a topic |
| `/api/v1/review` | POST | AI paper assessment (multipart file upload) |

Authenticate with `Authorization: Bearer <key>`. Full reference and code
samples live on the in-app Developer page. See
[`frontend/README.md`](frontend/README.md) for implementation details.

## 📁 Repository structure

```
Metascience_Platform/
├── frontend/                 # Next.js web app
│   ├── app/                  # routes (research, citation, review, docs, developer, api)
│   ├── components/           # UI components
│   ├── lib/                  # stores, supabase clients, api gateway helpers
│   └── supabase_migration_*.sql
├── backend/                  # FastAPI engine
│   └── app/
│       ├── routes/           # HTTP endpoints
│       └── services/         # search, citations, trends, review, clustering, cache
└── README.md
```

## 📚 Component docs
- [Frontend documentation](frontend/README.md)
- [Backend documentation](backend/Readme.md)
- [Search subsystem](backend/app/services/search/README.md)

## 🤝 Contributing
Contributions are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md) and the
[Code of Conduct](CODE_OF_CONDUCT.md).

## 📄 License
[MIT](LICENSE).

## 🛡️ Security
To report a vulnerability, see the [Security Policy](SECURITY.md).
