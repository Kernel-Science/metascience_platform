"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { AppShell } from "@/components/app-shell";
import { Message } from "@/components/research/Message";
import { FeedbackButton } from "@/components/feedback/FeedbackButton";
import { SearchTab } from "@/components/research/SearchTab";
import { Filters } from "@/types";
import { useSearchStore } from "@/lib/searchStore";
import { useCitationStore } from "@/lib/citationStore";
import { useAnalysisStore } from "@/lib/analysisStore";

const API_BASE_URL = "";
const PAGE_SIZE = 100;

export default function SearchPage() {
  const router = useRouter();

  const {
    query,
    setQuery,
    papers,
    setPapers,
    setFilters: setSearchFilters,
    saveSearchToSupabase,
  } = useSearchStore();

  const {
    setAnalysisType,
    setQuery: setAnalysisQuery,
    setCitationAnalysis,
    setTrendAnalysis,
    saveAnalysisToSupabase,
    isGeneratingTrend,
    setIsGeneratingTrend,
    setTrendGenerationError,
    trendAnalysis,
  } = useAnalysisStore();

  const {
    setCitationPapers,
    setPaperId,
    setPaperTitle,
    setCitationGraph,
    saveCitationToSupabase,
    isGeneratingNetwork,
    setIsGeneratingNetwork,
    networkGenerationError, // Add this
    setNetworkGenerationError,
  } = useCitationStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showFilters, setShowFilters] = useState(false);

  const [categories, setCategories] = useState<Record<string, any>>({});

  const [filters, setFilters] = useState<Filters>({
    category: "",
    source: "all",
    minCitations: "",
    yearFrom: "",
    yearTo: "",
  });

  // How the executed search was interpreted (editable intent chips).
  const [activeIntent, setActiveIntent] = useState<any>(null);

  // Pagination ("load more")
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const offsetRef = React.useRef(0);
  const lastSearchRef = React.useRef<{
    query?: string;
    intent?: any;
    filters: Filters;
  } | null>(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      const categoriesRes = await fetch(`${API_BASE_URL}/api/categories`).catch(
        () => null,
      );

      if (categoriesRes?.ok) {
        const data = await categoriesRes.json();
        setCategories(data.categories || {});
      }
    } catch {
      // Ignore error during initialization
    }
  };

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const showSuccessMessage = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(""), 5000);
  };

  const showErrorMessage = (message: string) => {
    setError(message);
    setTimeout(() => setError(""), 8000);
  };

  // Build the fetch for a search descriptor + offset (legacy GET or intent POST).
  const buildSearchRequest = (
    desc: { query?: string; intent?: any; filters: Filters },
    offset: number,
  ): Promise<Response> => {
    if (desc.intent) {
      // Advanced path: full structured intent; manual filters take precedence.
      const merged: Record<string, any> = { ...desc.intent };

      if (desc.filters.category) merged.field = desc.filters.category;
      if (desc.filters.minCitations)
        merged.min_citations =
          parseInt(desc.filters.minCitations, 10) || merged.min_citations;
      if (desc.filters.yearFrom)
        merged.date_from = `${desc.filters.yearFrom}-01-01`;
      if (desc.filters.yearTo) merged.date_to = `${desc.filters.yearTo}-12-31`;

      const sources =
        desc.filters.source && desc.filters.source !== "all"
          ? [desc.filters.source]
          : undefined;

      return fetch(`${API_BASE_URL}/api/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: merged,
          limit: PAGE_SIZE,
          offset,
          sources,
        }),
      });
    }

    const params = new URLSearchParams({
      query: (desc.query || "").trim(),
      limit: String(PAGE_SIZE),
      offset: String(offset),
    });

    if (desc.filters.source !== "all")
      params.append("source", desc.filters.source);
    if (desc.filters.category) params.append("category", desc.filters.category);
    if (desc.filters.minCitations)
      params.append("min_citations", desc.filters.minCitations);
    if (desc.filters.yearFrom) params.append("year_from", desc.filters.yearFrom);
    if (desc.filters.yearTo) params.append("year_to", desc.filters.yearTo);

    return fetch(`${API_BASE_URL}/api/search?${params}`);
  };

  const searchPapers = async (customQuery?: string, intent?: any) => {
    const searchQuery = customQuery || query;

    if (!intent && !searchQuery.trim()) {
      showErrorMessage("Please enter a search query");
      return;
    }

    // Remember this search so "Load more" can repeat it at a higher offset.
    const desc = { query: searchQuery.trim(), intent, filters: { ...filters } };
    lastSearchRef.current = desc;
    offsetRef.current = 0;

    setLoading(true);
    clearMessages();
    setPapers([]);
    setHasMore(false);
    setActiveIntent(null);
    setCitationAnalysis(null);
    setTrendAnalysis(null);

    try {
      const response = await buildSearchRequest(desc, 0);

      if (!response.ok) {
        showErrorMessage(
          `Search failed: ${response.status} ${response.statusText}`,
        );
        return;
      }

      const data = await response.json();

      if (data.papers && data.papers.length > 0) {
        setPapers(data.papers);
        setSearchFilters(filters);
        setHasMore(!!data.has_more);
        setActiveIntent(data.intent || null);

        try {
          await saveSearchToSupabase();
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error("Failed to save search to Supabase:", error);
        }

        showSuccessMessage(
          `Found ${data.total_found ?? data.papers.length} papers from ${data.sources_used?.join(", ") || "multiple sources"
          }`,
        );

        clearFilters();
        setQuery("");
      } else {
        showErrorMessage(
          "No papers found. Try different search terms or adjust filters.",
        );
      }
    } catch (err: any) {
      showErrorMessage(
        err.message ||
        "Search failed. Please check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    const desc = lastSearchRef.current;

    if (loadingMore || !hasMore || !desc) return;

    setLoadingMore(true);
    const nextOffset = offsetRef.current + PAGE_SIZE;

    try {
      const response = await buildSearchRequest(desc, nextOffset);

      if (!response.ok) {
        showErrorMessage("Failed to load more results.");
        return;
      }

      const data = await response.json();

      if (data.papers && data.papers.length > 0) {
        // Read current papers from the store to avoid a stale closure.
        const current = useSearchStore.getState().papers;

        setPapers([...current, ...data.papers]);
        offsetRef.current = nextOffset;
        setHasMore(!!data.has_more);
      } else {
        setHasMore(false);
      }
    } catch {
      showErrorMessage("Failed to load more results.");
    } finally {
      setLoadingMore(false);
    }
  };

  // Re-run the search with an edited intent (from the chips). The chip edits are
  // authoritative, so this drives a fresh search via the structured-intent path.
  const applyIntent = (newIntent: any) => {
    if (loading || loadingMore) return;
    setActiveIntent(newIntent);
    searchPapers(newIntent.canonical_query || "", newIntent);
  };

  // Logic to handle completion and redirection
  // We track previous states to detect completion (transition from true -> false)
  const prevIsGeneratingTrend = React.useRef(isGeneratingTrend);
  const prevIsGeneratingNetwork = React.useRef(isGeneratingNetwork);

  // We also want to know if we initiated both analyses to handle the "both complete" scenario
  // However, with persistent state, "both complete" might happen at different times or across sessions.
  // For simplicity and robustness, specific redirection takes precedence when an analysis finishes.
  // If we want to support "wait for both", we can check if the other is currently generating.

  useEffect(() => {
    // Trend analysis finished
    if (prevIsGeneratingTrend.current && !isGeneratingTrend) {
      if (!isGeneratingNetwork) {
        // Only redirect if citation network is not also running, OR if we prioritize trends view
        // Actually, if both were running and trends finishes first, we might want to wait?
        // Or just go to trends view and let citation finish in background (which is the goal).
        // Let's go to trends view immediately when trends finishes.
        showSuccessMessage("Trend analysis completed!");
        router.push("/research/analysis");
      }
    }
    prevIsGeneratingTrend.current = isGeneratingTrend;
  }, [isGeneratingTrend, isGeneratingNetwork, router]);

  useEffect(() => {
    // Citation network finished
    if (prevIsGeneratingNetwork.current && !isGeneratingNetwork) {
      // Only redirect if there was no error
      if (networkGenerationError) {
        // Error is handled in catch block, prevent redirect
        prevIsGeneratingNetwork.current = isGeneratingNetwork;
        return;
      }

      // If trends is currently running, we might stay here until trends finishes?
      // Or if trends is NOT running, we redirect to citation page.
      if (!isGeneratingTrend) {
        showSuccessMessage("Citation analysis completed!");
        router.push("/citation");
      } else {
        // Trends is still running. We can notify the user but maybe don't redirect yet
        // because the trends view is usually the primary dashboard.
        // Or we can just let the trends completion handler handle the redirect.
        showSuccessMessage("Citation analysis completed! (Trend analysis still in progress)");
      }
    }
    prevIsGeneratingNetwork.current = isGeneratingNetwork;
  }, [isGeneratingNetwork, isGeneratingTrend, router]);


  const analyzeData = async (type: "trends" | "citations") => {
    if (papers.length === 0) {
      showErrorMessage("No papers to analyze. Please search first.");
      return;
    }

    if (type === "trends") {
      setIsGeneratingTrend(true);
      setTrendGenerationError(null);
    } else {
      setIsGeneratingNetwork(true);
      setNetworkGenerationError(null);
    }

    // Only set basic analysis type/query if not already set or completely new
    // But we should set them to ensure the context is correct.
    if (type === "trends") {
      setAnalysisType("trend");
      setAnalysisQuery(query);
    } // For citations, we might not need to set redundant analysisType in analysisStore if it's separate

    try {
      let endpoint = type === "trends" ? "analyze/trends" : "analyze/citation-network-from-papers";
      let requestBody;

      if (type === "citations") {
        // Relaxed validation: check for papers with either DOI or ID
        const validPapers = papers.filter((paper) => paper.doi || paper.id || paper.paperId);

        if (validPapers.length === 0) {
          showErrorMessage(
            "No valid papers with IDs found. Cannot perform citation analysis.",
          );
          setIsGeneratingNetwork(false);
          return;
        }

        // Send papers instead of just DOIs, so backend can use paperId if DOI is missing
        requestBody = {
          papers: papers,
          max_references: 50,
          max_citations: 50,
          data_source: "s2",
        };
      } else {
        requestBody = { papers };
      }

      const response = await fetch(`${API_BASE_URL}/api/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (type === "trends") {
        // Sanitize the data to ensure it's serializable and has the expected structure
        const sanitizedData = {
          analysis_id: data.analysis_id,
          analysis: data.analysis || {},
          visualization_data: data.visualization_data || {},
          paper_count: data.paper_count || 0,
        };
        setTrendAnalysis(sanitizedData);

        try {
          await saveAnalysisToSupabase();
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error("Failed to save trend analysis to Supabase:", error);
        }
      } else {
        // Handle Citation Network data
        // The backend returns { analysis_id, network_data, ... } directly
        // It does NOT wrap it in a 'data' property like the other endpoints might
        const networkData = data.network_data;

        if (networkData) {
          setCitationPapers(data.papers || papers); // backend might not return papers list, use original
          if (networkData) {
            setCitationGraph(networkData, false); // Mark as not saved so it gets saved to history
          }

          if (papers.length > 0) {
            setPaperId(papers[0].id);
            setPaperTitle(papers[0].title);
          }

          // Save to citation history
          // We need to ensure state is updated before saving? 
          // saveCitationToSupabase reads from store (get()). 
          // Zustand updates are synchronous usually, but better to await if possible?
          // Since we called setters, store should be updated.
          try {
            // Ensure we have the data in store before saving
            // We just called setters.
            await saveCitationToSupabase();
          } catch (error) {
            console.error("Failed to save citation to Supabase:", error);
          }
        } else {
          // Fallback if structure is different
          setCitationPapers(papers);
          if (papers.length > 0) {
            setPaperId(papers[0].id);
            setPaperTitle(papers[0].title);
          }
        }
      }

    } catch (err: any) {
      const errorMessage =
        `${type.charAt(0).toUpperCase() + type.slice(1)} analysis failed: ${err.message}`;
      showErrorMessage(errorMessage);
      if (type === "trends") {
        setTrendGenerationError(errorMessage);
      } else {
        setNetworkGenerationError(errorMessage);
      }
    } finally {
      if (type === "trends") {
        setIsGeneratingTrend(false);
      } else {
        setIsGeneratingNetwork(false);
      }
    }
  };

  const handleFilterChange = (name: keyof Filters, value: string) => {
    setFilters((prev: Filters) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      category: "",
      source: "all",
      minCitations: "",
      yearFrom: "",
      yearTo: "",
    });
  };

  return (
    <ProtectedRoute>
      <AppShell>

        <Message
          error={error}
          success={success}
          onClearMessagesAction={clearMessages}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <SearchTab
            analysisLoading={{
              trends: isGeneratingTrend,
              citations: isGeneratingNetwork,
            }}
            trendAnalysis={trendAnalysis}

            categories={categories}
            filters={filters}
            loading={loading}
            papers={papers}
            query={query}
            hasMore={hasMore}
            loadingMore={loadingMore}
            activeIntent={activeIntent}
            onIntentChangeAction={applyIntent}
            setQueryAction={setQuery}
            setShowFiltersAction={setShowFilters}
            showFilters={showFilters}
            onAnalyzeAction={analyzeData}
            onClearFiltersAction={clearFilters}
            onFilterChangeAction={handleFilterChange}
            onSearchAction={searchPapers}
            onLoadMoreAction={loadMore}
          />

          <FeedbackButton tabName="search" />
        </main>
      </AppShell>
    </ProtectedRoute>
  );
}
