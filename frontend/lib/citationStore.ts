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
  setCitationGraph: (graph: any) => void;
  clearCitation: () => void;
  saveCitationToSupabase: () => Promise<void>;
  loadCitationHistory: () => Promise<any[]>;
}

export const useCitationStore = create<CitationState>((set, get) => ({
  paperId: "",
  setPaperId: (id) => set({ paperId: id }),
  paperTitle: "",
  setPaperTitle: (title) => set({ paperTitle: title }),
  citationPapers: [],
  setCitationPapers: (papers) => set({ citationPapers: papers }),
  citationGraph: null,
  setCitationGraph: (graph) => set({ citationGraph: graph }),
  clearCitation: () =>
    set({
      paperId: "",
      paperTitle: "",
      citationPapers: [],
      citationGraph: null,
    }),

  saveCitationToSupabase: async () => {
    const { paperId, paperTitle, citationPapers, citationGraph } = get();

    if (!paperId) return;

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
