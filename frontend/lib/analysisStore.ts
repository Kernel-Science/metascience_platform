import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";

interface AnalysisState {
  analysisType: "trend" | "citation" | null;
  setAnalysisType: (type: "trend" | "citation" | null) => void;
  query: string;
  setQuery: (query: string) => void;
  citationAnalysis: any;
  setCitationAnalysis: (analysis: any) => void;
  trendAnalysis: any;
  setTrendAnalysis: (analysis: any) => void;
  clearAnalysis: () => void;
  saveAnalysisToSupabase: () => Promise<void>;
  loadAnalysisHistory: () => Promise<any[]>;
}

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  analysisType: null,
  setAnalysisType: (type) => set({ analysisType: type }),
  query: "",
  setQuery: (query) => set({ query }),
  citationAnalysis: null,
  setCitationAnalysis: (analysis) => set({ citationAnalysis: analysis }),
  trendAnalysis: null,
  setTrendAnalysis: (analysis) => set({ trendAnalysis: analysis }),
  clearAnalysis: () =>
    set({
      analysisType: null,
      query: "",
      citationAnalysis: null,
      trendAnalysis: null,
    }),

  saveAnalysisToSupabase: async () => {
    const { analysisType, query, citationAnalysis, trendAnalysis } = get();

    if (!analysisType) return;

    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { error } = await supabase.from("analysis_history").insert([
        {
          user_id: user.id,
          type: analysisType,
          query,
          citation_analysis: citationAnalysis,
          trend_analysis: trendAnalysis,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        // Error saving analysis to Supabase. Handle appropriately.
        return;
      }

      // Analysis saved to Supabase successfully.
    } catch {
      // Error saving analysis to Supabase. Handle appropriately.
    }
  },

  loadAnalysisHistory: async () => {
    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return [];

      const { data, error } = await supabase
        .from("analysis_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        // Error loading analysis history. Handle appropriately.
        return [];
      }

      return data || [];
    } catch {
      // Error loading analysis history. Handle appropriately.
      return [];
    }
  },
}));
