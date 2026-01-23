import { create } from "zustand";

import { createClient } from "@/lib/supabase/client";

interface FeedbackData {
  tab_name: "search" | "analysis" | "review" | "citation" | "methods";
  rating: number;
  feedback_type: string;
  message: string;
}

interface FeedbackStore {
  isModalOpen: boolean;
  currentTab: "search" | "analysis" | "review" | "citation" | "methods" | null;
  isSubmitting: boolean;
  openModal: (
    tabName: "search" | "analysis" | "review" | "citation" | "methods",
  ) => void;
  closeModal: () => void;
  submitFeedback: (data: FeedbackData) => Promise<void>;
}

export const useFeedbackStore = create<FeedbackStore>((set) => ({
  isModalOpen: false,
  currentTab: null,
  isSubmitting: false,

  openModal: (tabName) => {
    set({ isModalOpen: true, currentTab: tabName });
  },

  closeModal: () => {
    set({ isModalOpen: false, currentTab: null });
  },

  submitFeedback: async (data) => {
    set({ isSubmitting: true });

    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase.from("user_feedback").insert([
        {
          tab_name: data.tab_name,
          rating: data.rating,
          feedback_type: data.feedback_type,
          message: data.message,
          user_id: user?.id || null,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        throw error;
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error submitting feedback:", error);
      throw error;
    } finally {
      set({ isSubmitting: false });
    }
  },
}));
