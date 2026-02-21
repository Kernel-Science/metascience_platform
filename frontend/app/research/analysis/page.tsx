"use client";

import React, { useState } from "react";
import { Button } from "@heroui/button";
import { RefreshCw } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Navbar } from "@/components/navbar";
import { FeedbackButton } from "@/components/feedback/FeedbackButton";
import { AnalysisTab } from "@/components/research/AnalysisTab";
import { useAnalysisStore } from "@/lib/analysisStore";
import { useSearchStore } from "@/lib/searchStore";

const API_BASE_URL = "";

export default function AnalysisPage() {
  const {
    trendAnalysis,
    citationAnalysis,
    isGeneratingTrend,
    setIsGeneratingTrend,
    setTrendAnalysis,
    saveAnalysisToSupabase,
    setAnalysisType,
    setQuery: setAnalysisQuery,
    setTrendGenerationError,
  } = useAnalysisStore();

  const { papers, query } = useSearchStore();

  const handleRerunAnalysis = async () => {
    if (papers.length === 0) {
      // Handle case where papers are missing (e.g., page refresh)
      alert("No papers found to analyze. Please search again.");
      return;
    }

    setIsGeneratingTrend(true);
    setTrendGenerationError(null);
    setAnalysisType("trend");
    setAnalysisQuery(query);

    try {
      const response = await fetch(`${API_BASE_URL}/api/analyze/trends`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ papers }),
      });

      if (!response.ok) {
        throw new Error(
          `Analysis failed: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();

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
    } catch (err: any) {
      alert(`Trend analysis failed: ${err.message}`);
      setTrendGenerationError(err.message);
    } finally {
      setIsGeneratingTrend(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="brand-app-shell">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Analysis Results
            </h1>
            <Button
              color="primary"
              disabled={isGeneratingTrend || papers.length === 0}
              isLoading={isGeneratingTrend}
              size="sm"
              startContent={!isGeneratingTrend && <RefreshCw className="w-4 h-4" />}
              onPress={handleRerunAnalysis}
            >
              {isGeneratingTrend ? "Analyzing..." : "Rerun Analysis"}
            </Button>
          </div>

          <AnalysisTab
            citationAnalysis={citationAnalysis}
            trendAnalysis={trendAnalysis}
          />

          <FeedbackButton tabName="analysis" />
        </main>
      </div>
    </ProtectedRoute>
  );
}
