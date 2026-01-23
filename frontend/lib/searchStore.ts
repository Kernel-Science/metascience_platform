import { create } from "zustand";

import { Article, Filters } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { safeExecute } from "./error-handler";

interface SearchState {
  query: string;
  setQuery: (query: string) => void;
  papers: Article[];
  setPapers: (papers: Article[]) => void;
  filters: Filters | null;
  setFilters: (filters: Filters | null) => void;
  clearSearch: () => void;
  saveSearchToSupabase: () => Promise<void>;
  loadSearchHistory: () => Promise<any[]>;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  query: "",
  setQuery: (query) => set({ query }),
  papers: [],
  setPapers: (papers) => set({ papers }),
  filters: null,
  setFilters: (filters) => set({ filters }),
  clearSearch: () => set({ query: "", papers: [], filters: null }),

  saveSearchToSupabase: async () => {
    const { query, papers, filters } = get();

    if (!query.trim()) return;

    await safeExecute(
      (async () => {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const { error } = await supabase.from("search_history").insert([
          {
            user_id: user.id,
            query,
            filters,
            results_count: papers.length,
            papers,
            created_at: new Date().toISOString(),
          },
        ]);

        if (error) {
          throw error;
        }


      })(),
      "saving search to history",
    );
  },

  loadSearchHistory: async () => {
    return (
      (await safeExecute(
        (async () => {
          const supabase = createClient();
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (!user) return [];

          const { data, error } = await supabase
            .from("search_history")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          if (error) {
            throw error;
          }

          return data || [];
        })(),
        "loading search history",
        { defaultValue: [] },
      )) || []
    );
  },
}));
