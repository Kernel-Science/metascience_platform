# Metascience Platform — Frontend

The Next.js 15 web app for the Metascience Platform. It provides the UI
(Assistant, Search, Analysis, Citation, Paper Assessment, Docs, Developer),
thin `/api` proxy routes to the FastAPI engine, and the public `/api/v1`
Developer API.

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)

> New here? Start with the [root README](../README.md) for the full-stack setup.

## 🧱 Tech stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **HeroUI** components on **Tailwind CSS**
- **Supabase** (`@supabase/ssr`) — auth + per-user data
- **Vercel AI SDK** (`ai`, `@ai-sdk/anthropic`, `@ai-sdk/react`) — the Assistant
- **D3 / Chart.js** — citation graphs and trend charts

## 🚀 Local development

```bash
pnpm install
cp .env.example .env.local     # fill in the values (see below)
pnpm dev                       # http://localhost:3000
```

Production build: `pnpm build && pnpm start`. Lint: `pnpm lint`.

> Requires the backend running (default `http://localhost:8000`) and a Supabase
> project with the SQL migrations applied — see [Supabase setup](#-supabase-setup).

## 🔑 Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key (auth) |
| `NEXT_PUBLIC_SITE_URL` | ✅ | Base URL for auth callbacks |
| `NEXT_PUBLIC_BACKEND_URL` | ✅ | FastAPI engine base URL |
| `ANTHROPIC_API_KEY` | ✅ | Assistant calls Claude from the server (Vercel AI SDK) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅* | Server-only; verifies public API keys. *Needed for `/api/v1`.* |

`NEXT_PUBLIC_*` values are exposed to the browser. **`SUPABASE_SERVICE_ROLE_KEY`
must never be prefixed with `NEXT_PUBLIC_`** — it bypasses row-level security.

## 🗄️ Supabase setup

Run these SQL files (in `frontend/`) in the Supabase SQL editor:

| File | Creates |
|---|---|
| `supabase_migration_feedback.sql` | `user_feedback` |
| `supabase_migration_chat.sql` | chat history tables |
| `supabase_migration_reviewer3.sql` | `reviewer3_sessions` |
| `supabase_migration_api_keys.sql` | `api_keys` (Developer API) |

Also create a public Storage bucket named **`avatars`** (profile pictures) and
enable the Email / Google auth providers.

## 📁 Project structure

```
app/
├── api/                     # Server route handlers
│   ├── search, analyze, …   # thin proxies to the FastAPI engine
│   ├── chat/                # Assistant (Vercel AI SDK + Claude tools)
│   ├── keys/                # API key management (session-authed)
│   └── v1/                  # PUBLIC Developer API (key-authed)
│       ├── search/  citation-network/  trends/  review/
├── research/                # chat · search · analysis · history
├── citation/  review/       # citation network · paper assessment
├── docs/                    # in-app documentation (was /methods)
├── developer/               # API keys + integration docs
├── profile/  auth/          # account + authentication
components/
├── app-shell.tsx            # sidebar shell used by app pages
├── app-sidebar.tsx          # primary in-app navigation
├── developer/               # ApiKeysManager, ApiDocs
├── chat/  research/  review/  charts/  landing/  ui/
lib/
├── api/                     # keys.ts (generate/verify) · gateway.ts (proxy+CORS)
├── supabase/                # client.ts · server.ts · admin.ts (service role)
├── auth/context.tsx         # auth provider / useAuth
└── *Store.ts                # Zustand stores (search, analysis, chat, review, …)
middleware.ts                # session refresh + protected-route gating
```

## 🌐 API layers

- **`/api/*`** — internal proxies that forward browser requests to
  `NEXT_PUBLIC_BACKEND_URL`. Used by the app's own pages.
- **`/api/chat`** — the Assistant. Runs Claude server-side with tools that call
  the engine (see `lib/chat/tools.ts`).
- **`/api/keys`, `/api/keys/[id]`** — create / list / revoke API keys for the
  signed-in user (RLS via the cookie session).
- **`/api/v1/*`** — the **public Developer API**. Each route verifies an API key
  (`lib/api/keys.ts` → `verifyApiKey`), then proxies to the engine via
  `lib/api/gateway.ts`. Keys are SHA-256 hashed; only a short display prefix and
  the hash are stored. See the in-app `/developer` page for the full reference.

## 🤝 Contributing
See [CONTRIBUTING.md](../CONTRIBUTING.md). Run `pnpm lint` before opening a PR.

## 📄 License
[MIT](../LICENSE).
