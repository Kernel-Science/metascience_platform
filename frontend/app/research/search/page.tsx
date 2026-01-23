"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Navbar } from "@/components/navbar";
import { Message } from "@/components/research/Message";
import { FeedbackButton } from "@/components/feedback/FeedbackButton";
import { SearchTab } from "@/components/research/SearchTab";
import { Filters } from "@/types";
import { useSearchStore } from "@/lib/searchStore";
import { useCitationStore } from "@/lib/citationStore";
import { useAnalysisStore } from "@/lib/analysisStore";

const API_BASE_URL = "";

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
  const { setCitationPapers, setPaperId, setPaperTitle } = useCitationStore();
  const {
    setAnalysisType,
    setQuery: setAnalysisQuery,
    setCitationAnalysis,
    setTrendAnalysis,
    saveAnalysisToSupabase,
  } = useAnalysisStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [analysisLoadingState, setAnalysisLoadingState] = useState<{
    trends: boolean;
    citations: boolean;
  }>({ trends: false, citations: false });

  const [showFilters, setShowFilters] = useState(false);

  const [categories, setCategories] = useState<Record<string, any>>({});

  const [filters, setFilters] = useState<Filters>({
    category: "",
    source: "all",
    minCitations: "",
    yearFrom: "",
    yearTo: "",
  });



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

  const searchPapers = async (customQuery?: string) => {
    const searchQuery = customQuery || query;

    if (!searchQuery.trim()) {
      showErrorMessage("Please enter a search query");
      return;
    }

    setLoading(true);
    clearMessages();
    setPapers([]);
    setCitationAnalysis(null);
    setTrendAnalysis(null);

    try {
      const params = new URLSearchParams({
        query: searchQuery.trim(),
      });

      if (filters.source !== "all") params.append("source", filters.source);
      if (filters.category) params.append("category", filters.category);
      if (filters.minCitations)
        params.append("min_citations", filters.minCitations);
      if (filters.yearFrom) params.append("year_from", filters.yearFrom);
      if (filters.yearTo) params.append("year_to", filters.yearTo);

      const response = await fetch(`${API_BASE_URL}/api/search?${params}`);

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


        try {
          await saveSearchToSupabase();
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error("Failed to save search to Supabase:", error);
        }

        showSuccessMessage(
          `Found ${data.papers.length} papers from ${data.sources_used?.join(", ") || "multiple sources"
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

  const analyzeData = async (type: "trends" | "citations") => {
    if (papers.length === 0) {
      showErrorMessage("No papers to analyze. Please search first.");
      return;
    }

    setAnalysisLoadingState((prev) => ({ ...prev, [type]: true }));
    const analysisType = type === "trends" ? "trend" : "citation";
    setAnalysisType(analysisType);
    setAnalysisQuery(query);
    clearMessages();

    try {
      let endpoint = type === "trends" ? "trends" : "citations";

      let requestBody;
      if (type === "citations") {
        const dois = papers
          .filter((paper) => paper.doi)
          .map((paper) => paper.doi);

        if (dois.length === 0) {
          showErrorMessage(
            "No papers with DOIs found. Cannot perform citation analysis.",
          );
          setAnalysisLoadingState((prev) => ({ ...prev, [type]: false }));
          return;
        }

        requestBody = {
          dois: dois,
          max_references: 50,
          max_citations: 50,
          data_source: "s2",
        };
      } else {
        requestBody = { papers };
      }

      const response = await fetch(`${API_BASE_URL}/api/analyze/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        showErrorMessage(
          `Analysis failed: ${response.status} ${response.statusText}`,
        );
        return;
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

        showSuccessMessage("Trend analysis completed successfully!");
        router.push("/research/analysis");
      } else {
        setCitationPapers(papers);

        if (papers.length > 0) {
          setPaperId(papers[0].id);
          setPaperTitle(papers[0].title);
        }

        showSuccessMessage(
          "Citation analysis completed successfully! Redirecting to citation network...",
        );

        router.push("/citation");
      }
    } catch (err: any) {
      showErrorMessage(
        `${type.charAt(0).toUpperCase() + type.slice(1)} analysis failed: ${err.message}`,
      );
    } finally {
      setAnalysisLoadingState((prev) => ({ ...prev, [type]: false }));
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900/50">
        <Navbar />

        <Message
          error={error}
          success={success}
          onClearMessagesAction={clearMessages}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <SearchTab
            analysisLoading={analysisLoadingState}
            categories={categories}
            filters={filters}
            loading={loading}
            papers={papers}
            query={query}
            setQueryAction={setQuery}
            setShowFiltersAction={setShowFilters}
            showFilters={showFilters}
            onAnalyzeAction={analyzeData}
            onClearFiltersAction={clearFilters}
            onFilterChangeAction={handleFilterChange}
            onSearchAction={searchPapers}
          />

          <FeedbackButton tabName="search" />
        </main>
      </div>
    </ProtectedRoute>
  );
}
