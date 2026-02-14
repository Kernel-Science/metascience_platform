# FQxI Metascience Platform

> A comprehensive open-source research analysis platform combining a modern Next.js frontend with a powerful Python/FastAPI backend to help academics, researchers, and curious individuals understand scientific literature through AI-driven insights and analytics.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🌟 Overview

The **Metascience Platform** consists of two main components working together:

1.  **Frontend (`/frontend`)**: A Next.js 15 application providing an intuitive interface for searching papers, visualizing citation networks, and viewing AI-generated insights.
2.  **Backend (`/backend`)**: A Python/FastAPI service that integrates with multiple academic data sources (ArXiv, OpenAlex, Semantic Scholar) and AI models (Claude 4.5 Sonnet, Google Gemini 3 Flash) to power the analysis.

### Key Features
- **🔍 Multi-Database Search**: Unified search across ArXiv, Semantic Scholar, and OpenAlex.
- **🤖 AI-Driven Insights**: Natural language query processing and automated paper reviews using Claude 4.5 Sonnet and Gemini 3 Flash.
- **🕸️ Citation Network Analysis**: Visualize relationships between papers and identify influential research.
- **📊 Advanced Analytics**: Trend discovery, author collaboration networks, and key metrics.

## 🚀 Quick Start

### Prerequisites
- **Node.js**: 18.x or higher
- **Python**: 3.11+ or 3.13+
- **pnpm** (recommended) or npm/yarn
- **Anthropic API Key** (for AI features)
- **Google API Key** (for Gemini features)

### Installation & Setup

Clone the repository:
```bash
git clone https://github.com/Kernel-Science/Metascience_Platform.git
cd Metascience_Platform
```

#### 1. Backend Setup
Navigate to the backend directory and start the server:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env to add your ANTHROPIC_API_KEY and GOOGLE_API_KEY

# Start the server
uvicorn app.main:app --reload
```
The backend API will be available at `http://localhost:8000`.

#### 2. Frontend Setup
In a new terminal, navigate to the frontend directory:

```bash
cd frontend
pnpm install

# Configure environment
cp .env.example .env.local
# Add required environment variables (e.g., Supabase config if needed)

# Start the development server
pnpm dev
```
Open `http://localhost:3000` to view the application.

## 📁 Repository Structure

```
metascience-platform/
├── frontend/           # Next.js Frontend Application
│   ├── app/            # Application routes and pages
│   ├── components/     # UI Components
│   └── ...
├── backend/            # FastAPI Backend Service
│   ├── app/            # Application logic (routes, services)
│   ├── services/       # AI & Data integrations
│   └── ...
└── README.md           # This file
```

## 📚 Documentation

For detailed documentation on each component, please refer to their respective README files:
- [Frontend Documentation](frontend/README.md)
- [Backend Documentation](backend/Readme.md)

## 🤝 Contributing
Contributions are welcome! Please read the [Contributing Guidelines](CONTRIBUTING.md) and our [Code of Conduct](CODE_OF_CONDUCT.md).

## 📄 License
This project is licensed under the [MIT License](LICENSE).

## 🛡️ Security
To report a security vulnerability, please see our [Security Policy](SECURITY.md).
