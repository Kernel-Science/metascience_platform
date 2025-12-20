# Metascience Platform

> An open-source research analysis platform that helps academics, researchers, and curious individuals understand scientific literature through AI-driven insights and comprehensive analytics.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

## 🌟 Overview

Metascience Platform is a powerful research discovery and analysis tool that provides access to **2.3M+ scientific papers** with advanced analytics capabilities. Think of it as your personal research assistant that can read, analyze, and help you discover patterns in academic literature.

### Key Features

- 🔍 **Multi-Database Search** - Search across ArXiv, Semantic Scholar, and OpenAlex simultaneously
- 🤖 **AI-Driven Insights** - Leverage Claude 4.5 Sonnet and Gemini 3 AI for intelligent analysis
- 📊 **Citation Network Analysis** - Visualize relationships between papers and identify influential research
- 📈 **Trend Discovery** - Spot emerging research topics and identify research gaps
- 📝 **AI-Powered Paper Review** - Automated peer review system with objective evaluation criteria
- 🎨 **Intuitive Interface** - User-centric design with customizable dashboards
- 💯 **100% Free & Open Source** - No paywalls, fully transparent

## 🚀 Quick Start

### Prerequisites

- Node.js 18.x or higher
- pnpm (recommended), npm, or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/metascience-frontend.git
cd metascience-frontend
```

2. Install dependencies:
```bash
pnpm install
```

pnpm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory and add your configuration (see `.env.example` for details):
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
# Add other required environment variables (e.g., NEXT_PUBLIC_SITE_URL)
```

4. Run the development server:
```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Building for Production

```bash
pnpm build
pnpm start
```

## 🎯 How It Works

### 1. Search & Discover
Enter DOIs or search by keywords to find papers from our database of 2.3M+ scholarly articles across all disciplines. The platform queries multiple academic databases simultaneously and combines results for comprehensive coverage.

### 2. Analyze Citations
Visualize citation networks, explore relationships between papers, and identify influential research in your field. Our network graphs help you understand the connections between different research works.

### 3. Get AI Insights
Leverage AI-driven analytics powered by Claude 3.5 Sonnet to:
- Convert natural language queries into effective search terms
- Discover trends and research gaps
- Identify emerging topics in the literature
- Get objective paper evaluations

### 4. Export & Share
Save your analysis, generate reports, and share insights with your research team or collaborators.

## 🛠️ Core Technologies

### Frontend Stack
- **[Next.js 15](https://nextjs.org/)** - React framework with App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development
- **[HeroUI v2](https://heroui.com/)** - Modern component library
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Framer Motion](https://www.framer.com/motion/)** - Animation library
- **[Chart.js](https://www.chartjs.org/)** - Data visualization
- **[D3.js](https://d3js.org/)** - Advanced graph visualizations
- **[Lucide React](https://lucide.dev/)** - Icon library

### Backend & Database
- **[Supabase](https://supabase.com/)** - Authentication and database
- **[FastAPI Backend](file:///../backend)** - High-performance Python backend for AI and research data
- **[Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)** - Frontend API layer

### AI & Analytics
- **Claude 4.5 Sonnet** - Natural language processing
- **Gemini 3 Flash** - Research analysis and multimodal processing
- **ArXiv API** - Academic paper database
- **Semantic Scholar API** - Research paper metadata
- **OpenAlex API** - Comprehensive scholarly data

## 📚 Core Features Explained

### Paper Discovery & Search
Searches multiple academic databases simultaneously (ArXiv, Semantic Scholar, OpenAlex) to ensure you don't miss important research. No single database has all papers, so combining sources provides comprehensive coverage.

### Natural Language Query Processing
Converts everyday language questions into proper academic search terms using AI. For example, "Show me papers about AI helping doctors" becomes a structured search for "artificial intelligence medical diagnosis clinical decision support."

### AI-Powered Paper Review System
The most sophisticated feature - an automated peer review system that evaluates research papers objectively:

**Scientific Quality Evaluation:**
- **Formal Correctness** (1-4 scale) - Math and reasoning soundness
- **Reproducibility** (1-4 scale) - Can others replicate the results?
- **Impact/Advance** (1-3 scale) - Significance to the field
- **Novelty** (1-5 scale) - Originality of the research

**Communication Quality:**
- **Writing Clarity** (1-4 scale) - Organization and readability
- Additional metrics for comprehensive evaluation

## 👥 Use Cases

### Researchers & PhD Students
- Conduct comprehensive literature reviews
- Identify research gaps
- Discover influential papers
- Save hours on manual research

### Academic Institutions
- Enable faculty and students with powerful research tools
- Track institutional research impact
- Build collaboration networks

### R&D Teams
- Monitor emerging research
- Technology scouting
- Competitive intelligence
- Innovation tracking

### Research Groups
- Team collaboration features
- Shared collections
- Joint analysis capabilities

## 📁 Project Structure

```
├── app/                      # Next.js app directory
│   ├── auth/                # Authentication pages
│   ├── citation/            # Citation search
│   ├── methods/             # Methods documentation
│   ├── research/            # Main research interface
│   ├── review/              # Paper review system
│   └── profile/             # User profile
├── components/              # React components
│   ├── auth/               # Authentication components
│   ├── charts/             # Data visualization
│   ├── feedback/           # User feedback system
│   └── landing/            # Landing page sections
├── lib/                    # Utility libraries
│   ├── auth/              # Auth context
│   ├── supabase/          # Supabase clients
│   └── *Store.ts          # State management stores
├── config/                # Configuration files
├── styles/                # Global styles
└── types/                 # TypeScript type definitions
```

## 🔧 Development

### Code Quality

```bash
# Run linter
pnpm lint
```

### Environment Setup

For pnpm users, ensure your `.npmrc` file includes:
```
public-hoist-pattern[]=*@heroui/*
```

Then run:
```bash
pnpm install
```

## 🤝 Contributing

We welcome contributions! This is an open-source project built for the research community.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Trusted by researchers worldwide
- Built with support from the open-source community
- Powered by academic databases: ArXiv, Semantic Scholar, OpenAlex
- AI capabilities by Anthropic (Claude) and Google (Gemini)

## 📞 Support

For questions, issues, or feature requests, please open an issue on GitHub.

---

**Trusted by researchers • 100% free • Open source**
