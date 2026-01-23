"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Settings, BookOpen, HelpCircle, Eye, List, X } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

import { Navbar } from "@/components/navbar";
import CitationSearch from "@/components/CitationSearch";
import NetworkGraph from "@/components/NetworkGraph";
import AnalysisOptions from "@/components/AnalysisOptions";
import ArticleDetails from "@/components/ArticleDetails";
import ArticleList from "@/components/ArticleList";
import { Article } from "@/types";
import { AnalysisOptions as AnalysisOptionsType } from "@/components/AnalysisOptions";
import FAQ from "@/components/FAQ";
import { useCitationStore } from "@/lib/citationStore";
import { FeedbackButton } from "@/components/feedback/FeedbackButton";

function CitationPageContent() {
  const searchParams = useSearchParams();
  const [seedDois, setSeedDois] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNode, setSelectedNode] = useState<Article | undefined>(
    undefined,
  );
  const [allNodes, setAllNodes] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [analysisOptions, setAnalysisOptions] = useState<AnalysisOptionsType>({
    retrieveCited: "top",
    retrieveCiting: "top",
    dataSource: "default",
  });
  const [showImportedBanner, setShowImportedBanner] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [viewMode, setViewMode] = useState<"network" | "papers">("network");

  // Use Zustand store for citation papers and graph
  const {
    citationPapers: importedPapers,
    setCitationPapers: setImportedPapers,
    citationGraph,
    paperId,
    setPaperId,
    setPaperTitle,
    saveCitationToSupabase,
  } = useCitationStore();

  // On mount, check for sessionStorage and migrate to Zustand if needed
  useEffect(() => {
    const storedPapers = sessionStorage.getItem("citationAnalysisPapers");

    if (storedPapers) {
      try {
        const papersData = JSON.parse(storedPapers);

        setImportedPapers(papersData);
        setShowImportedBanner(true);
        sessionStorage.removeItem("citationAnalysisPapers"); // Clean up
        // Extract DOIs and set as query
        const dois = papersData
          .filter((paper: Article) => paper.doi && paper.doi.trim())
          .map((paper: Article) => paper.doi.trim());

        if (dois.length > 0) {
          setSeedDois(dois);
        }
      } catch {
        // Ignore error
      }
    }
  }, [setImportedPapers]);

  // Watch for papers imported from research page via Zustand store
  useEffect(() => {
    if (importedPapers.length > 0) {
      setShowImportedBanner(true);
      // Extract DOIs and set as seed DOIs for the citation search
      const dois = importedPapers
        .filter((paper: Article) => paper.doi && paper.doi.trim())
        .map((paper: Article) => paper.doi.trim());

      if (dois.length > 0) {
        setSeedDois(dois);
      }
    }
  }, [importedPapers]);

  useEffect(() => {
    const doisFromQuery = searchParams.get("dois");

    if (doisFromQuery) {
      const decodedDois = decodeURIComponent(doisFromQuery).split("\n");
      setSeedDois(decodedDois);
    }
  }, [searchParams]);

  // Save citation data when graph or papers are updated
  useEffect(() => {
    if (citationGraph && allNodes.length > 0 && paperId) {
      (async () => {
        try {
          await saveCitationToSupabase();
        } catch {
          // Ignore error
        }
      })();
    }
  }, [citationGraph, allNodes, paperId, saveCitationToSupabase]);

  const handleSearch = () => {
    setSearchQuery(seedDois.join("\n"));
    setSelectedNode(undefined);

    // Set current paper for tracking (use first paper if available)
    if (importedPapers.length > 0) {
      setPaperId(importedPapers[0].id);
      setPaperTitle(importedPapers[0].title);
    }
  };

  const handleNodeSelect = (node?: Article) => {
    setSelectedNode(node);
  };

  const handleClearImported = () => {
    setImportedPapers([]);
    setShowImportedBanner(false);
    setSeedDois([]);
    setPaperId("");
    setPaperTitle("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Navbar />

      <main className="container mx-auto px-6 py-24 max-w-7xl">
        {/* Main Content */}
        <div className="grid grid-cols-12 gap-8">
          {/* Sidebar Controls */}
          <div className="col-span-12 lg:col-span-3 space-y-6">
            {/* Search Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3 mb-4">
                <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Find Paper
                </h2>
              </div>
              <CitationSearch
                loading={loading}
                seedDois={seedDois}
                onSearch={handleSearch}
                onSeedDoisChange={setSeedDois}
              />
            </div>

            {/* Analysis Options */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3 mb-4">
                <Settings className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Configuration
                </h2>
              </div>
              <AnalysisOptions
                options={analysisOptions}
                onChange={setAnalysisOptions}
              />
            </div>

            {/* Help Button */}
            <button
              className="w-full bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30 border border-purple-200 dark:border-purple-800 rounded-2xl p-4 flex items-center justify-center space-x-3 transition-all duration-200 transform hover:scale-105"
              onClick={() => setShowFAQ(!showFAQ)}
            >
              <HelpCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span className="font-medium text-purple-700 dark:text-purple-300">
                {showFAQ ? "Hide Help" : "Show Help"}
              </span>
            </button>
          </div>

          {/* Main Visualization Area */}
          <div className="col-span-12 lg:col-span-9 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-8 py-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                      {viewMode === "network"
                        ? "Citation Network"
                        : "Network Papers"}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300">
                      {viewMode === "network"
                        ? "Interactive network visualization. Seed papers are indigo, cited papers are purple, and citing papers are cyan."
                        : `${allNodes.length} papers found in the citation network`}
                    </p>
                  </div>

                  {/* View Toggle Buttons */}
                  {allNodes.length > 0 && (
                    <div className="flex bg-white dark:bg-gray-700 rounded-lg p-1 shadow-sm border border-gray-200 dark:border-gray-600">
                      <button
                        className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                          viewMode === "network"
                            ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 shadow-sm"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                        }`}
                        onClick={() => setViewMode("network")}
                      >
                        <Eye className="w-4 h-4" />
                        <span>Network</span>
                      </button>
                      <button
                        className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                          viewMode === "papers"
                            ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 shadow-sm"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                        }`}
                        onClick={() => setViewMode("papers")}
                      >
                        <List className="w-4 h-4" />
                        <span>Papers</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="relative" style={{ height: "700px" }}>
                {/* Keep both NetworkGraph and ArticleList mounted and toggle visibility
                   so switching views doesn't unmount the network (which triggers a
                   re-generation). */}
                <div
                  className={viewMode === "network" ? "" : "hidden"}
                  style={{ height: "100%" }}
                >
                  <NetworkGraph
                    analysisOptions={analysisOptions}
                    loading={loading}
                    query={searchQuery}
                    setAllNodes={setAllNodes}
                    setLoading={setLoading}
                    onNodeSelect={handleNodeSelect}
                  />
                </div>

                <div
                  className={viewMode === "papers" ? "" : "hidden"}
                  style={{ height: "100%" }}
                >
                  <div className="h-full overflow-y-auto">
                    <ArticleList
                      articles={allNodes}
                      selectedArticle={selectedNode ?? null}
                      onArticleSelect={handleNodeSelect}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Paper Details - Horizontal layout at bottom */}
            {selectedNode && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 px-8 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    Selected Paper Details
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Detailed information about the selected paper from the
                    network
                  </p>
                </div>
                <div className="p-8">
                  <ArticleDetails article={selectedNode} />
                </div>
              </div>
            )}

            {/* Imported Papers Banner */}
            {showImportedBanner && (
              <div className="bg-green-50 dark:bg-green-900/10 border-l-4 border-green-400 dark:border-green-600 rounded-lg p-4 mt-6">
                <div className="flex items-center">
                  <div className="text-green-500 dark:text-green-400">
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M9 12h6m-3-3v6m6.364-9.364A9 9 0 118.636 15.636M15 9l-6 6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      Successfully imported {importedPapers.length} papers from
                      search results.
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Click on a node in the network to view paper details.
                    </p>
                  </div>
                  <div className="ml-auto">
                    <button
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md bg-green-100 dark:bg-green-800 hover:bg-green-200 dark:hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200"
                      onClick={handleClearImported}
                    >
                      <X className="w-4 h-4 mr-2" />
                      <span>Clear Imported Papers</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* FAQ Section - Only show when toggled */}
        {showFAQ && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 px-8 py-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Frequently Asked Questions
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    Everything you need to know about citation network analysis
                  </p>
                </div>
                <button
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => setShowFAQ(false)}
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-8">
              <FAQ />
            </div>
          </div>
        )}

        {/* Floating Feedback Button */}
        <FeedbackButton tabName="citation" />
      </main>
    </div>
  );
}

export default function CitationPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div>Loading...</div>}>
        <CitationPageContent />
      </Suspense>
    </ProtectedRoute>
  );
}
