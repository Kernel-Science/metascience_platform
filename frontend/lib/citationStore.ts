import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import { notifyError } from "@/lib/utils";

interface CitationState {
  paperId: string;
  setPaperId: (id: string) => void;
  paperTitle: string;
  setPaperTitle: (title: string) => void;
  citationPapers: any[];
  setCitationPapers: (papers: any[]) => void;
  citationGraph: any;
  setCitationGraph: (graph: any, isSaved?: boolean) => void;
  isSaved: boolean; // Track if current graph is saved
  isGeneratingNetwork: boolean;
  setIsGeneratingNetwork: (isGenerating: boolean) => void;
  networkGenerationError: string | null;
  setNetworkGenerationError: (error: string | null) => void;
  clearCitation: () => void;
  saveCitationToSupabase: () => Promise<void>;
  loadCitationHistory: () => Promise<any[]>;
}

export const useCitationStore = create<CitationState>((set, get) => ({
  paperId: "",
  setPaperId: (id) => set({ paperId: id, isSaved: false }), // Reset saved status on new paper
  paperTitle: "",
  setPaperTitle: (title) => set({ paperTitle: title, isSaved: false }),
  citationPapers: [],
  setCitationPapers: (papers) => set({ citationPapers: papers }),
  citationGraph: null,
  setCitationGraph: (graph, isSaved = false) => set({ citationGraph: graph, isSaved }), // Allow setting saved status
  isSaved: false,
  isGeneratingNetwork: false,
  setIsGeneratingNetwork: (isGenerating) =>
    set({ isGeneratingNetwork: isGenerating }),
  networkGenerationError: null,
  setNetworkGenerationError: (error) => set({ networkGenerationError: error }),
  clearCitation: () =>
    set({
      paperId: "",
      paperTitle: "",
      citationPapers: [],
      citationGraph: null,
      isSaved: false,
      isGeneratingNetwork: false,
      networkGenerationError: null,
    }),

  saveCitationToSupabase: async () => {
    const { paperId, paperTitle, citationPapers, citationGraph, isSaved } = get();

    if (!paperId || isSaved) return; // Don't save if already saved

    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { error } = await supabase.from("citation_history").insert([
        {
          user_id: user.id,
          paper_id: paperId,
          paper_title: paperTitle,
          citation_papers: citationPapers,
          citation_graph: citationGraph,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        notifyError(
          "Error saving citation to Supabase. Please try again later.",
        );
        return;
      }

      set({ isSaved: true }); // Mark as saved
      // Optionally, show a success notification here if desired
    } catch {
      notifyError(
        "Unexpected error occurred while saving citation. Please try again later.",
      );
    }
  },

  loadCitationHistory: async () => {
    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return [];

      const { data, error } = await supabase
        .from("citation_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        notifyError("Error loading citation history. Please try again later.");
        return [];
      }

      return data || [];
    } catch {
      notifyError(
        "Unexpected error occurred while loading citation history. Please try again later.",
      );
      return [];
    }
  },
}));
