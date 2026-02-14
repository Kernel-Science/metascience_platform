"use client";

import React from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { motion } from "framer-motion";
import {
  Search,
  TrendingUp,
  Network,
  Brain,
  CheckCircle,
  Sparkles,
} from "lucide-react";

import { PaperCard } from "./PaperCard";
import { EstimatedTimeIndicator } from "@/components/EstimatedTimeIndicator";
import { AnimatePresence } from "framer-motion";

import { Article } from "@/types";

interface Filters {
  category: string;
  source: string;
  minCitations: string;
  yearFrom: string;
  yearTo: string;
}

interface SearchTabProps {
  query: string;
  setQueryAction: (query: string) => void;
  loading: boolean;
  onSearchAction: (customQuery?: string) => void; // Allow passing custom query
  filters: Filters;
  onFilterChangeAction: (name: keyof Filters, value: string) => void;
  onClearFiltersAction: () => void;
  categories: Record<string, any>;
  showFilters: boolean;
  setShowFiltersAction: (show: boolean) => void;
  papers: Article[];
  onAnalyzeAction: (type: "trends" | "citations") => void;
  analysisLoading: { trends: boolean; citations: boolean };
}

export const SearchTab: React.FC<SearchTabProps> = ({
  query,
  setQueryAction,
  loading,
  onSearchAction,
  filters,
  onFilterChangeAction,
  onClearFiltersAction,
  categories,
  showFilters,
  setShowFiltersAction: _setShowFiltersAction,
  papers,
  onAnalyzeAction,
  analysisLoading,
}) => {
  const [naturalLanguageQuery, setNaturalLanguageQuery] = React.useState("");
  const [isConverting, setIsConverting] = React.useState(false);
  const [convertedQuery, setConvertedQuery] = React.useState("");
  const [suggestedFilters, setSuggestedFilters] = React.useState<any>(null);
  const [showConvertedQuery, setShowConvertedQuery] = React.useState(false);

  // Estimated time state
  const [estimatedTime, setEstimatedTime] = React.useState<{
    trends: number;
    citations: number;
  }>({ trends: 45, citations: 30 });
  const [showEstimatedTime, setShowEstimatedTime] = React.useState<{
    trends: boolean;
    citations: boolean;
  }>({ trends: false, citations: false });

  // Clear natural language query when main query is cleared
  React.useEffect(() => {
    if (query === "") {
      setNaturalLanguageQuery("");
      setConvertedQuery("");
      setSuggestedFilters(null);
      setShowConvertedQuery(false);
    }
  }, [query]);

  // Calculate estimated time based on number of papers
  React.useEffect(() => {
    // Base time + time per paper (rough estimate)
    const trendsBaseTime = 30;
    const citationsBaseTime = 20;
    const timePerPaper = 0.5;

    setEstimatedTime({
      trends: Math.ceil(trendsBaseTime + papers.length * timePerPaper),
      citations: Math.ceil(citationsBaseTime + papers.length * timePerPaper),
    });
  }, [papers.length]);

  const filterControlClassName =
    "w-full rounded-lg border border-[var(--fqxi-border)] bg-[var(--fqxi-paper)] px-3 py-2 text-[var(--fqxi-ink)] outline-none transition-colors placeholder:text-[var(--fqxi-ink-muted)] focus:border-[var(--fqxi-yellow)] focus:ring-2 focus:ring-[color:rgba(228,211,68,0.35)]";

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 mt-20"
      initial={{ opacity: 0, y: 20 }}
    >
      <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl shadow-xl shadow-black/10 p-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center">
          Search Research Papers
        </h2>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Natural Language Search Input */}
          <div className="relative">
            <div className="space-y-3">
              <Input
                className="w-full text-lg"
                classNames={{
                  inputWrapper:
                    "border border-[var(--fqxi-border)] bg-[var(--fqxi-paper)] shadow-none transition-colors hover:bg-[var(--fqxi-paper)] focus-within:border-[var(--fqxi-yellow)] focus-within:ring-2 focus-within:ring-[color:rgba(228,211,68,0.35)]",
                  input:
                    "text-[var(--fqxi-ink)] placeholder:text-[var(--fqxi-ink-muted)]",
                }}
                disabled={loading || isConverting}
                placeholder="Describe what you're looking for in natural language - our AI will optimize your search and apply relevant filters automatically"
                size="lg"
                startContent={
                  <Search className="h-5 w-5 text-[var(--fqxi-ink-muted)]" />
                }
                type="text"
                value={naturalLanguageQuery}
                onChange={(e) => setNaturalLanguageQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !isConverting &&
                    naturalLanguageQuery.trim()
                  ) {
                    handleNaturalLanguageSearch();
                  }
                }}
              />
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="inline-flex items-center space-x-1">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--fqxi-yellow)]" />
                  <span>AI-powered search</span>
                </span>
                <span>•</span>
                <span>Natural language to precise queries</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              className="px-8 w-full sm:w-auto"
              color="primary"
              disabled={loading || isConverting || !naturalLanguageQuery.trim()}
              isLoading={isConverting}
              size="lg"
              onPress={handleNaturalLanguageSearch}
            >
              {isConverting ? "Converting..." : "Convert Query"}
            </Button>
          </div>

          {/* Converted Query and Suggestions Display */}
          {showConvertedQuery && convertedQuery && (
            <motion.div
              animate={{ opacity: 1, height: "auto" }}
              initial={{ opacity: 0, height: 0 }}
            >
              <Card className="border-2 border-primary-200 bg-gradient-to-r from-primary-50 to-secondary-50">
                <CardHeader className="pb-2">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full gap-3">
                    <div className="flex items-center space-x-2">
                      <Brain className="w-5 h-5 text-primary-600" />
                      <h3 className="text-lg font-semibold text-primary-900">
                        AI-Generated Query
                      </h3>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                      <Button
                        color="success"
                        size="sm"
                        startContent={<CheckCircle className="w-4 h-4" />}
                        onPress={handleApplySuggestions}
                        className="w-full sm:w-auto"
                      >
                        Apply & Search
                      </Button>
                      <Button
                        color="default"
                        size="sm"
                        variant="light"
                        onPress={() => setShowConvertedQuery(false)}
                        className="w-full sm:w-auto"
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardBody className="space-y-4">
                  {/* Search Query Card */}
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center space-x-2">
                        <Search className="w-4 h-4 text-primary-600" />
                        <span className="text-sm font-medium">
                          Search Query
                        </span>
                      </div>
                    </CardHeader>
                    <CardBody>
                      <code className="text-sm bg-default-100 p-3 rounded-lg block overflow-x-auto">
                        {convertedQuery}
                      </code>
                    </CardBody>
                  </Card>

                  {/* AI Reasoning */}
                  {suggestedFilters?.reasoning && (
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center space-x-2">
                          <Brain className="w-4 h-4 text-secondary-600" />
                          <span className="text-sm font-medium">
                            AI Reasoning
                          </span>
                        </div>
                      </CardHeader>
                      <CardBody>
                        <p className="text-sm text-default-700">
                          {suggestedFilters.reasoning}
                        </p>
                      </CardBody>
                    </Card>
                  )}

                  {/* Suggested Category */}
                  {suggestedFilters?.category && (
                    <Card>
                      <CardHeader className="pb-2">
                        <span className="text-sm font-medium">
                          Suggested Category
                        </span>
                      </CardHeader>
                      <CardBody>
                        <Chip color="primary" variant="flat">
                          {suggestedFilters.category
                            .replace(/_/g, " ")
                            .toUpperCase()}
                        </Chip>
                      </CardBody>
                    </Card>
                  )}

                  {/* Additional Filters */}
                  {suggestedFilters?.suggested_filters && (
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center space-x-2">
                          <Sparkles className="w-4 h-4 text-warning-600" />
                          <span className="text-sm font-medium">
                            Additional Suggestions
                          </span>
                        </div>
                      </CardHeader>
                      <CardBody>
                        <div className="space-y-3">
                          {/* Years */}
                          {suggestedFilters.suggested_filters.years && (
                            <div>
                              <span className="text-xs text-default-500">
                                Years:
                              </span>
                              <Chip
                                color="warning"
                                variant="flat"
                                size="sm"
                                className="ml-2"
                              >
                                {suggestedFilters.suggested_filters.years}
                              </Chip>
                            </div>
                          )}

                          {/* Subject Areas */}
                          {suggestedFilters.suggested_filters.subject_areas &&
                            Array.isArray(
                              suggestedFilters.suggested_filters.subject_areas,
                            ) && (
                              <div>
                                <span className="text-xs text-default-500">
                                  Subject Areas:
                                </span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {suggestedFilters.suggested_filters.subject_areas.map(
                                    (area: string, index: number) => (
                                      <Chip
                                        key={index}
                                        color="secondary"
                                        variant="flat"
                                        size="sm"
                                      >
                                        {area}
                                      </Chip>
                                    ),
                                  )}
                                </div>
                              </div>
                            )}

                          {/* Document Types */}
                          {suggestedFilters.suggested_filters.document_type &&
                            Array.isArray(
                              suggestedFilters.suggested_filters.document_type,
                            ) && (
                              <div>
                                <span className="text-xs text-default-500">
                                  Document Types:
                                </span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {suggestedFilters.suggested_filters.document_type.map(
                                    (type: string, index: number) => (
                                      <Chip
                                        key={index}
                                        color="success"
                                        variant="flat"
                                        size="sm"
                                      >
                                        {type}
                                      </Chip>
                                    ),
                                  )}
                                </div>
                              </div>
                            )}
                        </div>
                      </CardBody>
                    </Card>
                  )}
                </CardBody>
              </Card>
            </motion.div>
          )}

          {/* Advanced Filters */}
          {showFilters && (
            <motion.div
              animate={{ opacity: 1, height: "auto" }}
              className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border-2 border-gray-100 dark:border-gray-700"
              initial={{ opacity: 0, height: 0 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Advanced Filters
                </h3>
                <Button
                  color="primary"
                  size="sm"
                  variant="light"
                  onPress={onClearFiltersAction}
                >
                  Clear All
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    htmlFor="category-select"
                  >
                    Category
                  </label>
                  <select
                    className={filterControlClassName}
                    id="category-select"
                    value={filters.category}
                    onChange={(e) =>
                      onFilterChangeAction("category", e.target.value)
                    }
                  >
                    <option value="">All Categories</option>
                    {Object.keys(categories).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.replace(/_/g, " ").toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    htmlFor="source-select"
                  >
                    Source
                  </label>
                  <select
                    className={filterControlClassName}
                    id="source-select"
                    value={filters.source}
                    onChange={(e) =>
                      onFilterChangeAction("source", e.target.value)
                    }
                  >
                    <option value="all">All Sources</option>
                    <option value="arxiv">ArXiv</option>
                    <option value="openalex">OpenAlex</option>
                    <option value="semantic_scholar">Semantic Scholar</option>
                  </select>
                </div>

                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    htmlFor="min-citations-input"
                  >
                    Min Citations
                  </label>
                  <input
                    className={filterControlClassName}
                    id="min-citations-input"
                    min="0"
                    placeholder="e.g., 10"
                    type="number"
                    value={filters.minCitations}
                    onChange={(e) =>
                      onFilterChangeAction("minCitations", e.target.value)
                    }
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    htmlFor="year-from-input"
                  >
                    Year From
                  </label>
                  <input
                    className={filterControlClassName}
                    id="year-from-input"
                    max="2025"
                    min="1900"
                    placeholder="e.g., 2020"
                    type="number"
                    value={filters.yearFrom}
                    onChange={(e) =>
                      onFilterChangeAction("yearFrom", e.target.value)
                    }
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    htmlFor="year-to-input"
                  >
                    Year To
                  </label>
                  <input
                    className={filterControlClassName}
                    id="year-to-input"
                    max="2025"
                    min="1900"
                    placeholder="e.g., 2024"
                    type="number"
                    value={filters.yearTo}
                    onChange={(e) =>
                      onFilterChangeAction("yearTo", e.target.value)
                    }
                  />
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Results Section */}
      {papers.length > 0 && (
        <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl shadow-xl shadow-black/10 p-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Search Results
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Found {papers.length} papers for {query}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Button
                color="success"
                disabled={analysisLoading.trends}
                isLoading={analysisLoading.trends}
                startContent={
                  !analysisLoading.trends && <TrendingUp className="w-4 h-4" />
                }
                variant="solid"
                onPress={() => {
                  setShowEstimatedTime({ ...showEstimatedTime, trends: true });
                  onAnalyzeAction("trends");
                }}
                className="w-full sm:w-auto"
              >
                {analysisLoading.trends ? "Analyzing..." : "Analyze Trends"}
              </Button>

              <Button
                color="warning"
                disabled={analysisLoading.citations}
                isLoading={analysisLoading.citations}
                startContent={
                  !analysisLoading.citations && <Network className="w-4 h-4" />
                }
                variant="solid"
                onPress={() => {
                  setShowEstimatedTime({
                    ...showEstimatedTime,
                    citations: true,
                  });
                  onAnalyzeAction("citations");
                }}
                className="w-full sm:w-auto"
              >
                {analysisLoading.citations ? "Loading..." : "Citation Network"}
              </Button>
            </div>
          </div>

          {/* Estimated Time Indicators */}
          <AnimatePresence>
            <div className="space-y-3 mb-6">
              <EstimatedTimeIndicator
                analysisType="trends"
                estimatedSeconds={estimatedTime.trends}
                isVisible={showEstimatedTime.trends && analysisLoading.trends}
              />
              <EstimatedTimeIndicator
                analysisType="citations"
                estimatedSeconds={estimatedTime.citations}
                isVisible={
                  showEstimatedTime.citations && analysisLoading.citations
                }
              />
            </div>
          </AnimatePresence>

          {/* Papers Grid */}
          <div className="space-y-4">
            {papers.map((paper, index) => (
              <PaperCard
                key={paper.id || index}
                index={index + 1}
                paper={paper}
              />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );

  async function handleNaturalLanguageSearch() {
    if (!naturalLanguageQuery.trim()) return;

    // Start the conversion process
    setIsConverting(true);

    try {
      const API_BASE_URL = ""; // Use local API routes to avoid CORS issues
      const response = await fetch(`${API_BASE_URL}/api/convert-query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ natural_language: naturalLanguageQuery.trim() }),
      });

      if (!response.ok) {
        // Conversion failed, fallback to original query
        setConvertedQuery(naturalLanguageQuery);
        setSuggestedFilters(null);
        setShowConvertedQuery(true);
        setIsConverting(false);

        return;
      }

      const data = await response.json();
      const conversion = data.conversion;

      // Parse the actual AI response structure
      setConvertedQuery(conversion.query);

      // Store the entire conversion object which includes category, reasoning, and suggested_filters
      setSuggestedFilters(conversion);

      setIsConverting(false);
      setShowConvertedQuery(true);
    } catch {
      // Fallback to original query
      setConvertedQuery(naturalLanguageQuery);
      setSuggestedFilters(null);
      setShowConvertedQuery(true);
      setIsConverting(false);
    }
  }

  function handleApplySuggestions() {
    // Apply the suggested category if available
    if (suggestedFilters?.category) {
      onFilterChangeAction("category", suggestedFilters.category);
    }

    // Parse and apply year range from the "years" field (e.g., "2015-present")
    if (suggestedFilters?.suggested_filters?.years) {
      const yearRange = suggestedFilters.suggested_filters.years;
      if (yearRange.includes("-")) {
        const [yearFrom, yearTo] = yearRange.split("-");
        if (yearFrom && yearFrom !== "present") {
          onFilterChangeAction("yearFrom", yearFrom.trim());
        }
        if (yearTo && yearTo !== "present") {
          onFilterChangeAction("yearTo", yearTo.trim());
        } else if (yearTo === "present") {
          onFilterChangeAction("yearTo", "2025");
        }
      }
    }

    // Set the converted query and trigger search
    setQueryAction(convertedQuery);
    onSearchAction(convertedQuery);

    // Hide the converted query section after applying
    setShowConvertedQuery(false);
  }
};
