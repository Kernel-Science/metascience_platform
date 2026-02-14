"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Navbar } from "@/components/navbar";
import { Message } from "@/components/research/Message";
import { FeedbackButton } from "@/components/feedback/FeedbackButton";
import { HistoryTab } from "@/components/research/HistoryTab";
import { HistoryItem } from "@/lib/historyStore";
import { useSearchStore } from "@/lib/searchStore";
import { useCitationStore } from "@/lib/citationStore";
import { useAnalysisStore } from "@/lib/analysisStore";
import { useReviewStore } from "@/lib/reviewStore";
import { Filters } from "@/types";

export default function HistoryPage() {
  const router = useRouter();
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const {
    setQuery,
    setPapers,
    setFilters: setSearchFilters,
  } = useSearchStore();
  const { setCitationPapers, setPaperId, setPaperTitle, setCitationGraph } =
    useCitationStore();
  const {
    setAnalysisType,
    setQuery: setAnalysisQuery,
    setCitationAnalysis,
    setTrendAnalysis,
  } = useAnalysisStore();
  const { setFileName, setMimeType, setReviewResult } = useReviewStore();

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

  const handleHistoryItemLoad = (item: HistoryItem) => {
    try {
      switch (item.type) {
        case "search":
          setQuery(item.data.query);
          setPapers(item.data.papers || []);
          if (item.data.filters) {
            setSearchFilters(item.data.filters as Filters);
          }
          showSuccessMessage(`Loaded search: ${item.title}`);
          router.push("/research/search");
          break;

        case "analysis":
          if (item.data.type === "trend" && item.data.trend_analysis) {
            setTrendAnalysis(item.data.trend_analysis);
            setAnalysisType("trend");
          } else if (
            item.data.type === "citation" &&
            item.data.citation_analysis
          ) {
            setCitationAnalysis(item.data.citation_analysis);
            setAnalysisType("citation");
          }
          if (item.data.query) {
            setAnalysisQuery(item.data.query);
          }
          showSuccessMessage(`Loaded ${item.data.type} analysis`);
          router.push("/research/analysis");
          break;

        case "citation":
          setPaperId(item.data.paper_id);
          setPaperTitle(item.data.paper_title || "");
          if (item.data.citation_papers) {
            setCitationPapers(item.data.citation_papers);
          }
          if (item.data.citation_graph) {
            setCitationGraph(item.data.citation_graph);
          }
          router.push("/citation");
          break;

        case "review":
          setFileName(item.data.file_name);
          setMimeType(item.data.mime_type || "");
          setReviewResult(item.data.review_result);
          router.push("/review");
          break;

        default:
          showErrorMessage("Unknown history item type");
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error loading history item:", error);
      showErrorMessage("Failed to load history item");
    }
  };

  return (
    <ProtectedRoute>
      <div className="brand-app-shell">
        <Navbar />

        <Message
          error={error}
          success={success}
          onClearMessagesAction={clearMessages}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <HistoryTab onItemLoad={handleHistoryItemLoad} />

          <FeedbackButton tabName="search" />
        </main>
      </div>
    </ProtectedRoute>
  );
}
