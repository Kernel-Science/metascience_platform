# Metascience Backend API

[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-009688.svg)](https://fastapi.tiangolo.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> A powerful, modular FastAPI backend for academic research discovery, citation network analysis, and AI-powered trend insights.

Metascience Backend integrates multiple academic data sources (arXiv, OpenAlex, Semantic Scholar) with Claude 3.5 Sonnet to provide natural language query conversion, intelligent trend analysis, and comprehensive citation network visualization.

## ✨ Features

- **🔍 Multi-Source Paper Discovery**
  - Unified search across arXiv, OpenAlex, and Semantic Scholar
  - DOI lookup and citation/reference retrieval
  - Intelligent deduplication and relevance ranking

- **🕸️ Citation Network Analysis**
  - Build and visualize citation networks from single or multiple DOIs
  - Support for multiple data sources (S2, OpenAlex, OpenCitations)
  - Advanced network metrics and analysis

- **🤖 AI-Powered Insights**
  - Natural language to structured query conversion via Claude 4.5 Sonnet
  - AI-driven trend analysis combining statistics with contextual insights
  - Automated research pattern detection

- **📊 Data Visualization**
  - Temporal publication trends
  - Top venues and research concepts
  - Author collaboration networks
  - Export-ready chart data

- **🏗️ Clean Architecture**
  - Modular design with clear separation of concerns
  - Async/await throughout for optimal performance
  - Storage abstraction for easy database migration
  - Comprehensive API documentation

## 📋 Table of Contents

- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [API Documentation](#-api-documentation)
- [Configuration](#️-configuration)
- [Architecture](#️-architecture)
- [Storage & Migration](#-storage--migration)
- [Development](#-development)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)
- [Roadmap](#-roadmap)

## 🛠️ Tech Stack

**Core Framework**
- **Python 3.13.4** - Modern Python with async support
- **FastAPI** - High-performance async web framework
- **Uvicorn** - Lightning-fast ASGI server
- **httpx** - Async HTTP client for external APIs

**AI & Machine Learning**
- **Anthropic Claude 4.5 Sonnet** - Natural language processing and trend analysis
- **`ANTHROPIC_MODEL`: Model identifier (default: `claude-sonnet-4-5-20250929`).

**Data Sources**
- **arXiv** - Physics, mathematics, computer science preprints
- **OpenAlex** - Comprehensive open catalog of scholarly papers
- **Semantic Scholar** - AI-powered research database
- **OpenCitations** - Open citation data

**Storage**
- **In-Memory Store** (current) - Lightweight temporary storage
- **Supabase Ready** - Easy migration path to PostgreSQL

**Configuration**
- **python-dotenv** - Environment variable management

## 🚀 Quick Start

### Prerequisites

- **Python 3.13.4**
- **Anthropic API Key** for Claude 4.5 Sonnet ([Get one here](https://console.anthropic.com/))
- **Google API Key** for Gemini 3 Flash features ([Get one here](https://aistudio.google.com/))

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/metascience-backend.git
cd metascience-backend
```

2. **Create a virtual environment**
```bash
# macOS/Linux
python -m venv .venv
source .venv/bin/activate

# Windows (PowerShell)
py -m venv .venv
.\.venv\Scripts\Activate.ps1
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Configure environment**
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your ANTHROPIC_API_KEY and GOOGLE_API_KEY
nano .env  # or use your preferred editor
```

5. **Run the server**
```bash
# Development mode with auto-reload
uvicorn app.main:app --reload

# Production mode
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

6. **Verify installation**
```bash
curl http://localhost:8000/api/health
```

Visit `http://localhost:8000/docs` for interactive API documentation.

## 📚 API Documentation

### Base URL
```
http://localhost:8000
```

### Interactive Docs
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### Key Endpoints

#### 🏥 Health & Utilities

**Health Check**
```http
GET /api/health
```
Returns server health status and runtime information.

**Test arXiv Integration**
```http
GET /test-arxiv?query=quantum computing
```
Quick test of arXiv integration with sample queries.

**Convert Natural Language Query**
```http
POST /api/convert-query
Content-Type: application/json

{
  "natural_language": "recent papers on quantum computing"
}
```
Convert natural language to structured search query using Claude 3.5 Sonnet.

#### 🔍 Search & Discovery

**Get Research Categories**
```http
GET /api/categories
```
Retrieve academic research category taxonomy.

**Search Papers**
```http
GET /api/search?query=machine learning&source=all&limit=20
```

**Query Parameters:**
- `query` - Search terms
- `source` - `all`, `arxiv`, `openalex`, or `semantic_scholar`
- `category` - Filter by research category
- `min_citations` - Minimum citation count
- `year_from` / `year_to` - Date range
- `limit` - Results per page (default: 20)

#### 📊 Analysis

**Trend Analysis**
```http
POST /api/analyze/trends-advanced
Content-Type: application/json

{
  "papers": [...]
}
```
Generate AI-powered trend analysis with statistics and visualizations.

**Citation Analysis**
```http
POST /api/analyze/citations-advanced
Content-Type: application/json

{
  "papers": [...]
}
```
Analyze citation patterns and generate collaboration networks.

**Recent Analyses**
```http
GET /api/recent-analyses?limit=20
```
Retrieve recent analysis results.

**Analytics Dashboard**
```http
GET /api/analytics/dashboard
```
Get analytics dashboard with popular queries and statistics.

**Export Report**
```http
POST /api/export/report
Content-Type: application/json

{
  "analysis_ids": ["id1", "id2"],
  "format": "json"
}
```
Export combined analysis report.

#### 🕸️ Citation Networks

**Single DOI Network**
```http
POST /citation-network
Content-Type: application/json

{
  "doi": "10.1234/example",
  "data_source": "s2",
  "max_references": 50,
  "max_citations": 50
}
```
Build citation network for a single DOI.

**Multiple DOI Network**
```http
POST /citation-network-multiple
Content-Type: application/json

{
  "dois": ["10.1234/example1", "10.1234/example2"],
  "data_source": "s2",
  "max_references": 50,
  "max_citations": 50
}
```
Build combined citation network from multiple DOIs.

**Data Sources:** `s2` (Semantic Scholar), `oa` (OpenAlex), `oc` (OpenCitations)

**Paper Details**
```http
GET /api/paper/{doi}/details
```
Retrieve detailed information about a paper by DOI.

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Required
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GOOGLE_API_KEY=your_google_api_key_here

# Optional (for future Supabase integration)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_key
```

### AI Configuration

- **Model**: `claude-3-5-sonnet-20241022` (configured in `app/config.py`)
- **Temperature**: 0.1 for consistent, low-variance outputs
- **Use Cases**: 
  - Natural language query conversion (`services/nlq.py`)
  - Trend analysis with contextual insights (`services/trends.py`)

## 🏗️ Architecture

```
metascience_backend/
├── app/
│   ├── main.py                 # FastAPI app initialization, CORS, routes
│   ├── config.py               # Environment variables and constants
│   ├── store.py                # Storage abstraction layer
│   ├── routes/
│   │   ├── health.py           # Health check endpoints
│   │   ├── catalog.py          # Research categories and search
│   │   ├── analysis.py         # Trend and citation analysis
│   │   ├── papers.py           # Paper details and DOI lookup
│   │   ├── network.py          # Citation network endpoints
│   │   └── tools.py            # Testing and NLQ conversion
│   └── services/
│       ├── research_client.py  # External API integrations
│       ├── nlq.py              # Natural language query processing
│       ├── trends.py           # AI-powered trend analysis
│       ├── citations.py        # Citation pattern analysis
│       ├── visualization.py    # Data visualization preparation
│       └── citation_network_core.py  # Network analysis core
├── server.py                   # Server entry point
├── requirements.txt            # Python dependencies
├── .env.example               # Environment template
└── Readme.md                  # This file
```

### Design Principles

- **Separation of Concerns**: Routes handle HTTP, services contain business logic
- **Async First**: All I/O operations use async/await for maximum performance
- **Storage Agnostic**: Abstract storage layer makes database migration seamless
- **Type Safety**: Pydantic models for request/response validation

## 💾 Storage & Migration

### Current Implementation (In-Memory)

The `app/store.py` module provides a lightweight in-memory storage abstraction:

```python
insert_one(collection, doc)
insert_many(collection, docs)
count_documents(collection)
find_recent(collection, sort_field, limit)
aggregate(collection, pipeline)
```

This mimics core database operations without persisting to disk, perfect for development and testing.

### Supabase Migration Path

To migrate to Supabase PostgreSQL:

1. **Install Supabase client**
```bash
pip install supabase
```

2. **Add environment variables**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_key
```

3. **Create tables**
```sql
-- papers table
CREATE TABLE papers (
  id TEXT PRIMARY KEY,
  title TEXT,
  authors JSONB,
  abstract TEXT,
  year INTEGER,
  venue TEXT,
  source TEXT,
  citation_count INTEGER,
  retrieved_at TIMESTAMP,
  search_query TEXT,
  relevance_rank INTEGER
);

-- analysis table
CREATE TABLE analysis (
  id TEXT PRIMARY KEY,
  type TEXT,
  analysis JSONB,
  visualization_data JSONB,
  paper_count INTEGER,
  timestamp TIMESTAMP
);
```

4. **Update `app/store.py`**

Replace in-memory operations with Supabase calls while keeping the same function signatures. No changes needed in route handlers!

## 💻 Development

### Project Structure

Routes are thin HTTP handlers that delegate to service modules:

- **Routes** (`app/routes/`) - Handle HTTP requests/responses
- **Services** (`app/services/`) - Contain business logic
- **Config** (`app/config.py`) - Centralized configuration
- **Store** (`app/store.py`) - Storage abstraction

### Development Tips

- Keep route handlers focused on HTTP concerns
- Implement business logic in service modules
- Use type hints and Pydantic models for validation
- Leverage async/await for all I/O operations
- Consider caching for frequently accessed external API data

### Testing

Create a `tests/` directory with route and service tests:

```bash
# Install testing dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest -v
```

**Example test structure:**
```python
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
```

## 🚀 Deployment

### Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and run:
```bash
docker build -t metascience-backend .
docker run -p 8000:8000 --env-file .env metascience-backend
```

### Platform Deployment

#### Render (Recommended) ⭐

This project is pre-configured for easy deployment on Render with:
- **100 MB payload limit** (vs Vercel's 4.5 MB)
- **Python 3.13.4** runtime
- **Auto-deployment** from git

**Quick Deploy:**
```bash
# Deploy files are already configured
git push

# Then create a Blueprint on Render using render.yaml
```

📖 **See [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) for complete step-by-step instructions**

**Other Platforms (Fly.io, Railway):**
- These platforms auto-detect Python/FastAPI apps
- Ensure `.env` variables are set in platform dashboard
- Set start command: `uvicorn server:app --host 0.0.0.0 --port $PORT`
- Use `.python-version` file to specify Python 3.13.4

**Production Considerations:**
- Use a reverse proxy (Nginx, Caddy) for HTTPS
- Enable rate limiting to protect against abuse
- Monitor external API rate limits (Semantic Scholar, OpenAlex)
- Implement caching for expensive operations
- Use structured logging for observability
- For files > 100 MB, implement S3 presigned URL uploads

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Contribution Guidelines

- Follow PEP 8 style guidelines
- Add tests for new features
- Update documentation for API changes
- Ensure all tests pass before submitting PR
- Keep commits focused and atomic

### Code Style

```bash
# Format code with black
pip install black
black app/

# Lint with flake8
pip install flake8
flake8 app/

# Type check with mypy
pip install mypy
mypy app/
```

## 🐛 Troubleshooting

**Rate Limiting (429 errors)**
- Implement exponential backoff for external API calls
- Consider caching results to reduce request frequency

**Anthropic API Errors**
- Verify `ANTHROPIC_API_KEY` is set correctly
- Check model name in `app/config.py` matches available models
- Monitor API usage at [Anthropic Console](https://console.anthropic.com/)

**arXiv Integration Issues**
- Ensure `arxiv` package is installed: `pip install arxiv`
- Check `/test-arxiv` endpoint for detailed error messages

**Memory Issues**
- Current in-memory store is limited by available RAM
- Migrate to Supabase for persistent, scalable storage

## 🔒 Security

- **Never commit `.env` files** - Use `.gitignore`
- **Rotate API keys regularly**
- **Enable RLS (Row-Level Security)** when using Supabase
- **Use secrets management** in production (AWS Secrets Manager, HashiCorp Vault)
- **Implement authentication** for production deployments
- **Validate and sanitize** all user inputs

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🗺️ Roadmap

### Storage
- [ ] Complete Supabase integration
- [ ] Add pagination support
- [ ] Implement cursor-based query filters

### AI Enhancements
- [ ] JSON schema validation for Claude outputs
- [ ] Retry logic and circuit breakers for AI calls
- [ ] Support for additional AI models

### Performance
- [ ] Redis caching for external API results
- [ ] Request deduplication
- [ ] Background job processing

### Observability
- [ ] Structured logging (JSON format)
- [ ] Request ID tracking
- [ ] OpenTelemetry integration
- [ ] Performance metrics

### Security
- [ ] JWT authentication
- [ ] API key management
- [ ] Rate limiting per user/API key

### Documentation
- [ ] OpenAPI examples
- [ ] Postman collection
- [ ] Video tutorials
- [ ] Architecture diagrams

### CI/CD
- [ ] GitHub Actions workflows
- [ ] Automated testing
- [ ] Code quality checks
- [ ] Pre-commit hooks

## 🙏 Acknowledgments

- [arXiv](https://arxiv.org/) for open access to research papers
- [OpenAlex](https://openalex.org/) for comprehensive scholarly data
- [Semantic Scholar](https://www.semanticscholar.org/) for AI-powered research tools
- [Anthropic](https://www.anthropic.com/) for Claude AI models
- [FastAPI](https://fastapi.tiangolo.com/) for the excellent web framework

## 📧 Contact

For questions, suggestions, or issues, please:
- Open an issue on GitHub
- Start a discussion in the repository
- Contact the maintainers

---

Made with ❤️ for the research community

