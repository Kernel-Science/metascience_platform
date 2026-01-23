import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";

interface ReviewData {
  paper: string | number;
  reviewer: string | number;
  status: string;
  formal_correctness: number;
  reproducibility: number;
  impact: number;
  novelty: number;
  writing_clarity: number;
  writing_grammar: number;
  writing_fairness: number;
  interdisciplinarity: number;
  review_text: string;
  review_date?: string;
  confidence?: number; // AI self-assessed confidence in the review
}

interface DjangoModelResponse {
  model: string;
  pk: number;
  fields: ReviewData;
}

interface ReviewResult {
  success: boolean;
  raw_response?: string;
  structured_data: DjangoModelResponse | ReviewData | null;
  file_name: string;
  mime_type: string;
  [key: string]: any;
}

interface ReviewState {
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  pdfUrl: string | null;
  setPdfUrl: (url: string | null) => void;
  fileName: string;
  setFileName: (fileName: string) => void;
  mimeType: string;
  setMimeType: (mimeType: string) => void;
  paperTitle: string;
  setPaperTitle: (title: string) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  error: string;
  setError: (error: string) => void;
  success: string;
  setSuccess: (success: string) => void;
  reviewResult: ReviewResult | null;
  setReviewResult: (result: ReviewResult | null) => void;
  clearReview: () => void;
  saveReviewToSupabase: () => Promise<void>;
}

export const useReviewStore = create<ReviewState>((set, get) => ({
  selectedFile: null,
  setSelectedFile: (file) => set({ selectedFile: file }),
  pdfUrl: null,
  setPdfUrl: (url) => set({ pdfUrl: url }),
  fileName: "",
  setFileName: (fileName) => set({ fileName }),
  mimeType: "",
  setMimeType: (mimeType) => set({ mimeType }),
  paperTitle: "",
  setPaperTitle: (title) => set({ paperTitle: title }),
  loading: false,
  setLoading: (loading) => set({ loading }),
  error: "",
  setError: (error) => set({ error }),
  success: "",
  setSuccess: (success) => set({ success }),
  reviewResult: null,
  setReviewResult: (result) => set({ reviewResult: result }),
  clearReview: () =>
    set({
      selectedFile: null,
      pdfUrl: null,
      fileName: "",
      mimeType: "",
      paperTitle: "",
      loading: false,
      error: "",
      success: "",
      reviewResult: null,
    }),
  saveReviewToSupabase: async () => {
    try {
      const { reviewResult } = get();
      if (reviewResult) {
        const supabase = createClient();

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const { error } = await supabase.from("review_history").insert([
          {
            user_id: user.id,
            file_name: reviewResult.file_name,
            mime_type: reviewResult.mime_type,
            review_result: reviewResult,
            created_at: new Date().toISOString(),
          },
        ]);

        if (error) {
          // eslint-disable-next-line no-console
          console.error("Error saving review to Supabase:", error);
          return;
        }


      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error saving review to Supabase:", error);
    }
  },
}));
