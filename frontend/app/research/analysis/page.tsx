"use client";

import React from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Navbar } from "@/components/navbar";
import { FeedbackButton } from "@/components/feedback/FeedbackButton";
import { AnalysisTab } from "@/components/research/AnalysisTab";
import { useAnalysisStore } from "@/lib/analysisStore";

export default function AnalysisPage() {
  const { trendAnalysis, citationAnalysis } = useAnalysisStore();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900/50">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
