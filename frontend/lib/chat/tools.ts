// Chat tools: thin wrappers over the FastAPI services. Each tool returns JSON
// that is both (a) compact enough for the model's context and (b) complete
// enough for the chat UI to render rich components (paper cards, network
// graph, theme clusters, review scorecard) directly from the tool output.
import { tool } from "ai";
import { z } from "zod";

import { saveSearchResults, getSearchResults } from "./resultsStore";

const BACKEND =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

// Over-fetch into the store so trends/network work on a richer set than the
// few papers shown back to the model.
const STORE_LIMIT = 60;

const formatAuthors = (authors: any[]): string => {
  const names = (authors || [])
    .map((a) => (typeof a === "string" ? a : a?.name))
    .filter(Boolean);

  if (names.length === 0) return "Unknown";

  return names.length > 3 ? `${names.slice(0, 3).join(", ")} et al.` : names.join(", ");
};

const compactPaper = (p: any, rank: number) => ({
  i: rank,
  title: p.title,
  authors: formatAuthors(p.authors),
  year: p.year || null,
  citations: p.citationCount ?? 0,
  venue: p.venue || null,
  arxiv_id: p.arxiv_id || null,
  link: p.doi ? `https://doi.org/${p.doi}` : p.url || p.abs_url || null,
  snippet:
    p.abstract && p.abstract !== "No abstract available"
      ? String(p.abstract).slice(0, 300)
      : null,
});

async function postJson(path: string, body: any, timeoutMs = 180_000) {
  const res = await fetch(`${BACKEND}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");

    throw new Error(`Backend ${path} failed (${res.status}): ${detail.slice(0, 300)}`);
  }

  return res.json();
}

export const searchPapers = tool({
  description:
    "Search the physics literature across OpenAlex, arXiv, INSPIRE-HEP and NASA ADS. " +
    "Fill the structured fields precisely from the user's request (you are the intent " +
    "extractor). Returns ranked papers plus a search_id that analyze_trends and " +
    "build_citation_network accept. Cite papers as [i] using the returned index.",
  inputSchema: z.object({
    query: z.string().describe("Concise human-readable summary of the search."),
    topics: z
      .array(z.string())
      .describe("Core concepts/keywords, most important first."),
    phrases: z
      .array(z.string())
      .optional()
      .describe("Multi-word terms to match as exact phrases."),
    must_include: z.array(z.string()).optional().describe("Hard AND terms."),
    should_include: z
      .array(z.string())
      .optional()
      .describe("Synonyms/expansions to broaden recall (OR)."),
    exclude: z.array(z.string()).optional().describe("Terms to exclude (NOT)."),
    authors: z.array(z.string()).optional().describe("Author full names."),
    arxiv_categories: z
      .array(z.string())
      .optional()
      .describe("arXiv categories, e.g. quant-ph, gr-qc, hep-th, astro-ph.CO."),
    date_from: z.string().optional().describe("Earliest date YYYY-MM-DD."),
    date_to: z.string().optional().describe("Latest date YYYY-MM-DD."),
    sort: z
      .enum(["relevance", "hybrid", "citations", "date"])
      .default("relevance")
      .describe(
        "relevance = best topical match; hybrid = on-topic AND influential " +
          "(use for 'seminal/key papers'); citations = pure impact; date = newest.",
      ),
    min_citations: z.number().int().optional(),
    open_access_only: z.boolean().optional(),
    limit: z
      .number()
      .int()
      .min(1)
      .max(30)
      .default(12)
      .describe("How many papers to show (default 12)."),
  }),
  execute: async (input) => {
    const { limit, query, ...intentFields } = input;
    const intent = { ...intentFields, canonical_query: query };
    const data = await postJson("/api/search", {
      intent,
      limit: STORE_LIMIT,
      offset: 0,
    });

    const papers: any[] = data.papers || [];

    if (papers.length === 0) {
      return {
        search_id: null,
        total_found: 0,
        papers: [],
        note: "No papers found — try broader topics or fewer constraints.",
      };
    }

    const searchId = saveSearchResults(query, papers);

    return {
      search_id: searchId,
      total_found: data.total_found,
      stored_for_analysis: papers.length,
      sources_used: data.sources_used,
      reranked: data.reranked,
      sort: input.sort,
      papers: papers.slice(0, limit).map((p, idx) => compactPaper(p, idx + 1)),
    };
  },
});

export const analyzeTrends = tool({
  description:
    "Analyze research trends in the papers from a previous search_papers call: " +
    "data-driven theme clusters, statistics, and a grounded synthesis " +
    "(evolution, emerging trends, notable findings, future directions).",
  inputSchema: z.object({
    search_id: z.string().describe("The search_id returned by search_papers."),
  }),
  execute: async ({ search_id }) => {
    const entry = getSearchResults(search_id);

    if (!entry) {
      return { error: `Unknown or expired search_id '${search_id}'. Run search_papers first.` };
    }

    const data = await postJson("/api/analyze/trends", { papers: entry.papers });
    const analysis = data.analysis || {};
    const stats = analysis.statistics || {};

    return {
      query: entry.query,
      paper_count: data.paper_count,
      statistics: {
        year_range: stats.year_range,
        avg_citations: Math.round((stats.avg_citations || 0) * 10) / 10,
        max_citations: stats.max_citations,
        top_authors: (stats.top_authors || []).slice(0, 5),
        yearly_distribution: stats.yearly_distribution,
      },
      themes: analysis.clusters || [],
      ai_analysis: analysis.ai_analysis || {},
    };
  },
});

export const buildCitationNetwork = tool({
  description:
    "Build a citation network from the papers of a previous search_papers call " +
    "(OpenAlex citation graph: references + citing papers, theme-clustered). " +
    "Renders an interactive graph in the chat. Use to map how a literature " +
    "connects or to find central/bridging papers.",
  inputSchema: z.object({
    search_id: z.string().describe("The search_id returned by search_papers."),
    max_seed_papers: z
      .number()
      .int()
      .min(2)
      .max(20)
      .default(10)
      .describe("How many top papers to use as seeds (default 10)."),
  }),
  execute: async ({ search_id, max_seed_papers }) => {
    const entry = getSearchResults(search_id);

    if (!entry) {
      return { error: `Unknown or expired search_id '${search_id}'. Run search_papers first.` };
    }

    const seeds = entry.papers.slice(0, max_seed_papers);
    const data = await postJson(
      "/api/analyze/citation-network-from-papers",
      { papers: seeds, max_references: 30, max_citations: 30, data_source: "s2" },
      300_000,
    );

    // Backend shape: {success, data: {network: {nodes, edges}, clusters, stats}}
    const payload = data.data || data.network_data || {};
    const network = payload.network || payload;
    const nodes: any[] = network.nodes || [];
    const keep = new Set(nodes.map((n) => n.id));
    const edges = (network.edges || [])
      .filter((e: any) => keep.has(e.from) && keep.has(e.to))
      .slice(0, 500)
      .map((e: any) => ({ from: e.from, to: e.to }));

    return {
      query: entry.query,
      seed_count: seeds.length,
      node_count: nodes.length,
      edge_count: edges.length,
      clusters: payload.clusters || [],
      nodes: nodes.map((n) => ({
        id: n.id,
        label: n.label || n.title,
        title: n.title,
        year: n.year || null,
        citations: n.citationsCount ?? 0,
        cluster: typeof n.cluster === "number" ? n.cluster : -1,
        isSeed: !!n.isSeed,
        type: n.type || "other",
      })),
      edges,
    };
  },
});

const ARXIV_ID_RE = /(\d{4}\.\d{4,5})(v\d+)?|([a-z-]+(?:\.[A-Z]{2})?\/\d{7})/;

export const reviewPaper = tool({
  description:
    "Run a structured AI review of an arXiv paper (scores on correctness, " +
    "reproducibility, impact, novelty, writing; plus a written review). " +
    "Takes an arXiv id or arXiv URL. Slow (~1 min) — only call when the user " +
    "asks for a review/assessment of a specific paper.",
  inputSchema: z.object({
    arxiv_id: z
      .string()
      .describe("arXiv identifier (e.g. 2406.12345) or arxiv.org URL."),
  }),
  execute: async ({ arxiv_id }) => {
    const match = arxiv_id.match(ARXIV_ID_RE);

    if (!match) {
      return { error: `Could not parse an arXiv id from '${arxiv_id}'.` };
    }
    const id = match[0];

    const pdfRes = await fetch(`https://arxiv.org/pdf/${id}`, {
      signal: AbortSignal.timeout(60_000),
    });

    if (!pdfRes.ok) {
      return { error: `Could not download arXiv PDF for '${id}' (${pdfRes.status}).` };
    }
    const pdf = await pdfRes.blob();

    const form = new FormData();

    form.append("file", pdf, `${id.replace("/", "_")}.pdf`);

    const res = await fetch(`${BACKEND}/api/review/upload`, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(300_000),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");

      return { error: `Review failed (${res.status}): ${detail.slice(0, 300)}` };
    }

    const data = await res.json();
    const r = data.structured_data || {};

    return {
      arxiv_id: id,
      paper: r.paper,
      paper_type: r.paper_type,
      scores: {
        formal_correctness: { value: r.formal_correctness, max: 4 },
        reproducibility: { value: r.reproducibility, max: 4 },
        impact: { value: r.impact, max: 3 },
        novelty: { value: r.novelty, max: 5 },
        writing_clarity: { value: r.writing_clarity, max: 4 },
        writing_grammar: { value: r.writing_grammar, max: 3 },
        writing_fairness: { value: r.writing_fairness, max: 3 },
        interdisciplinarity: { value: r.interdisciplinarity, max: 4 },
      },
      confidence: r.confidence,
      justifications: r.justifications || null,
      review_text: String(r.review_text || "").slice(0, 5000),
    };
  },
});

// Visualization + document tools render in the UI directly from the tool
// *input* (the spec the model writes), so execute just acknowledges — no data
// round-trips back through the model's context.
export const createChart = tool({
  description:
    "Render an interactive chart in the chat. Use for numeric comparisons, " +
    "time series (e.g. publications per year), distributions or shares. " +
    "Each data point has an x label and one or more named series values. " +
    "For pie charts only the first series is used (x = slice label).",
  inputSchema: z.object({
    type: z.enum(["bar", "line", "area", "pie", "scatter"]),
    title: z.string(),
    description: z.string().optional(),
    xAxisLabel: z.string().optional(),
    yAxisLabel: z.string().optional(),
    data: z
      .array(
        z.object({
          x: z.string().describe("X-axis label for this point (e.g. a year)."),
          series: z.array(
            z.object({
              name: z.string().describe("Series name (legend entry)."),
              value: z.number(),
            }),
          ),
        }),
      )
      .min(1)
      .describe("Data points, in x order."),
  }),
  execute: async ({ type, data }) => ({
    ok: true,
    rendered: `${type} chart with ${data.length} points`,
  }),
});

export const createDocument = tool({
  description:
    "Create a document the user can read in the chat and export as PDF, DOCX, " +
    "Markdown or LaTeX. Use when asked for a report, summary, literature " +
    "review, notes or any exportable write-up. Prefer format='markdown' (LaTeX " +
    "math is supported inline with $...$ and $$...$$); use format='latex' only " +
    "when the user explicitly wants a .tex source file.",
  inputSchema: z.object({
    title: z.string(),
    format: z.enum(["markdown", "latex"]).default("markdown"),
    content: z
      .string()
      .describe(
        "The full document body. For markdown: GFM + $math$. For latex: a " +
          "complete compilable .tex document.",
      ),
  }),
  execute: async ({ title, format, content }) => ({
    ok: true,
    rendered: `${format} document "${title}" (${content.length} chars)`,
  }),
});

export const chatTools = {
  search_papers: searchPapers,
  analyze_trends: analyzeTrends,
  build_citation_network: buildCitationNetwork,
  review_paper: reviewPaper,
  create_chart: createChart,
  create_document: createDocument,
};
