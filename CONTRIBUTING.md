# Contributing to Metascience Platform

Thank you for your interest in contributing to the Metascience Platform! This project was developed by **Kernel Science SRL for FQXI**.

We welcome contributions from everyone, whether you're fixing a bug, improving documentation, or suggesting new features.

---

## 🏗️ Project Origins
The Metascience Platform is a comprehensive open-source research analysis platform designed to help academics and researchers understand scientific literature through AI-driven insights. It was originally developed by Kernel Science SRL for FQXI.

## 🚀 Getting Started

To contribute effectively, you'll need to set up both the frontend and backend components.

### Prerequisites
- **Node.js**: 18.x or higher
- **Python**: 3.11+ or 3.13+
- **pnpm** (recommended) or npm/yarn

### 1. Backend Setup
The backend is a FastAPI application.
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
cp .env.example .env
# Edit .env to add your API keys
uvicorn app.main:app --reload
```

### 2. Frontend Setup
The frontend is a Next.js application.
```bash
cd frontend
pnpm install
cp .env.example .env.local
# Edit .env.local as needed
pnpm dev
```

---

## 🧪 Testing

### Backend Tests
Navigate to the `backend` directory:
```bash
pytest
```

### Frontend Tests
Navigate to the `frontend` directory:
```bash
pnpm test
```

---

## 🤝 How to Contribute

### 1. Bug Reports & Feature Requests
Please use [GitHub Issues](https://github.com/Kernel-Science/Metascience_Platform/issues) to report bugs or suggest features. Provide as much detail as possible, including steps to reproduce or clear use cases.

### 2. Pull Requests
1. **Fork** the repository.
2. Create a **feature branch** (`git checkout -b feature/amazing-feature`).
3. **Commit** your changes following [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).
4. **Push** to the branch (`git push origin feature/amazing-feature`).
5. Open a **Pull Request**.

### 3. Code Style
- **Python**: Follow PEP 8 and use `black` for formatting.
    - Formatting: `black backend/app/`
    - Linting: `flake8 backend/app/ --max-line-length=100`
    - Type Checking: `mypy backend/app/`
- **JavaScript/TypeScript**: Follow the project's ESLint and Prettier configurations.

## 🏗️ Backend Architecture
When adding new features to the backend:
- **Routes** (`backend/app/routes/`) - HTTP handlers only.
- **Services** (`backend/app/services/`) - Business logic.
- **Models** - Use Pydantic for request/response validation.
- **Config** (`backend/app/config.py`) - Environment variables.

---

## 📜 Code of Conduct
By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## 🔒 Security
If you discover a security vulnerability, please follow the instructions in our [Security Policy](SECURITY.md).

---

Thank you for helping us build the future of metascience!
