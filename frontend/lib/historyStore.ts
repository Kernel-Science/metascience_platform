import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";

export interface HistoryItem {
  id: number;
  type: "search" | "analysis" | "citation" | "review";
  title: string;
  subtitle?: string;
  data: any;
  created_at: string;
}

interface HistoryState {
  historyItems: HistoryItem[];
  setHistoryItems: (items: HistoryItem[]) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  loadAllHistory: () => Promise<void>;
  deleteHistoryItem: (id: number, type: string) => Promise<boolean>;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  historyItems: [],
  setHistoryItems: (items) => set({ historyItems: items }),
  loading: false,
  setLoading: (loading) => set({ loading }),

  loadAllHistory: async () => {
    set({ loading: true });
    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        set({ historyItems: [], loading: false });
        return;
      }

      // Load all history types in parallel
      const [searchData, analysisData, citationData, reviewData] =
        await Promise.all([
          supabase
            .from("search_history")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("analysis_history")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("citation_history")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("review_history")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
        ]);

      const allItems: HistoryItem[] = [];

      // Process search history
      if (searchData.data) {
        searchData.data.forEach((item) => {
          allItems.push({
            id: item.id,
            type: "search",
            title: item.query,
            subtitle: `${item.results_count} results`,
            data: item,
            created_at: item.created_at,
          });
        });
      }

      // Process analysis history
      if (analysisData.data) {
        analysisData.data.forEach((item) => {
          allItems.push({
            id: item.id,
            type: "analysis",
            title: `${item.type} Analysis`,
            subtitle: item.query || "Analysis",
            data: item,
            created_at: item.created_at,
          });
        });
      }

      // Process citation history
      if (citationData.data) {
        citationData.data.forEach((item) => {
          allItems.push({
            id: item.id,
            type: "citation",
            title: item.paper_title || "Citation Analysis",
            subtitle: `Paper ID: ${item.paper_id}`,
            data: item,
            created_at: item.created_at,
          });
        });
      }

      // Process review history
      if (reviewData.data) {
        reviewData.data.forEach((item) => {
          allItems.push({
            id: item.id,
            type: "review",
            title: item.file_name,
            subtitle: item.mime_type,
            data: item,
            created_at: item.created_at,
          });
        });
      }

      // Sort all items by creation date
      allItems.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

      set({ historyItems: allItems });
    } catch {
      set({ historyItems: [] });
    } finally {
      set({ loading: false });
    }
  },

  deleteHistoryItem: async (id: number, type: string) => {
    try {
      const supabase = createClient();

      const tableName = `${type}_history`;
      const { error } = await supabase.from(tableName).delete().eq("id", id);

      if (error) {
        return false;
      }

      // Remove from local state
      const { historyItems } = get();
      const updatedItems = historyItems.filter(
        (item) => !(item.id === id && item.type === type),
      );
      set({ historyItems: updatedItems });

      return true;
    } catch {
      return false;
    }
  },
}));
