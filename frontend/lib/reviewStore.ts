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

export type Reviewer3Status =
  | "idle"
  | "waiting"
  | "processing"
  | "completed"
  | "error";

export interface Reviewer3Comment {
  reviewer_id: string;
  title?: string | null;
  comment: string;
  cited_text?: string | null;
  severity?: number | null;
  severity_label?: string | null;
  rank?: number | null;
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
  // Reviewer3 external peer review (async: submit -> poll session)
  reviewer3Enabled: boolean;
  setReviewer3Enabled: (enabled: boolean) => void;
  reviewer3SessionId: string | null;
  setReviewer3SessionId: (sessionId: string | null) => void;
  reviewer3Status: Reviewer3Status;
  setReviewer3Status: (status: Reviewer3Status) => void;
  reviewer3Comments: Reviewer3Comment[];
  setReviewer3Comments: (comments: Reviewer3Comment[]) => void;
  reviewer3Error: string;
  setReviewer3Error: (error: string) => void;
  reviewer3ShareUrl: string | null;
  setReviewer3ShareUrl: (url: string | null) => void;
  // Object URL of the reviewed PDF so the viewer can render it next to the
  // comments. Session-scoped (lost on refresh; re-attachable from the panel).
  reviewer3PdfUrl: string | null;
  setReviewer3PdfUrl: (url: string | null) => void;
  clearReviewer3: () => void;
  clearReview: () => void;
  saveReviewToSupabase: () => Promise<void>;
  saveReviewer3ToSupabase: () => Promise<void>;
  deleteReviewer3FromSupabase: () => Promise<void>;
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
  reviewer3Enabled: false,
  setReviewer3Enabled: (enabled) => set({ reviewer3Enabled: enabled }),
  reviewer3SessionId: null,
  setReviewer3SessionId: (sessionId) => set({ reviewer3SessionId: sessionId }),
  reviewer3Status: "idle",
  setReviewer3Status: (status) => set({ reviewer3Status: status }),
  reviewer3Comments: [],
  setReviewer3Comments: (comments) => set({ reviewer3Comments: comments }),
  reviewer3Error: "",
  setReviewer3Error: (error) => set({ reviewer3Error: error }),
  reviewer3ShareUrl: null,
  setReviewer3ShareUrl: (url) => set({ reviewer3ShareUrl: url }),
  reviewer3PdfUrl: null,
  setReviewer3PdfUrl: (url) => {
    const prev = get().reviewer3PdfUrl;
    if (prev && prev !== url) URL.revokeObjectURL(prev);
    set({ reviewer3PdfUrl: url });
  },
  clearReviewer3: () => {
    const prev = get().reviewer3PdfUrl;
    if (prev) URL.revokeObjectURL(prev);
    set({
      reviewer3SessionId: null,
      reviewer3Status: "idle",
      reviewer3Comments: [],
      reviewer3Error: "",
      reviewer3ShareUrl: null,
      reviewer3PdfUrl: null,
    });
  },
  clearReview: () => {
    const prev = get().reviewer3PdfUrl;
    if (prev) URL.revokeObjectURL(prev);
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
      reviewer3SessionId: null,
      reviewer3Status: "idle",
      reviewer3Comments: [],
      reviewer3Error: "",
      reviewer3ShareUrl: null,
      reviewer3PdfUrl: null,
    });
  },
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
  saveReviewer3ToSupabase: async () => {
    try {
      const {
        reviewer3SessionId,
        reviewer3Comments,
        reviewer3ShareUrl,
        fileName,
        paperTitle,
      } = get();
      if (!reviewer3SessionId) return;
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { error } = await supabase.from("reviewer3_sessions").upsert(
        [
          {
            user_id: user.id,
            session_id: reviewer3SessionId,
            title: paperTitle || fileName || null,
            file_name: fileName || null,
            status: "completed",
            comments: reviewer3Comments,
            share_url: reviewer3ShareUrl,
          },
        ],
        { onConflict: "session_id" },
      );

      if (error) {
        // eslint-disable-next-line no-console
        console.error("Error saving Reviewer3 session to Supabase:", error);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error saving Reviewer3 session to Supabase:", error);
    }
  },
  deleteReviewer3FromSupabase: async () => {
    try {
      const { reviewer3SessionId } = get();
      if (!reviewer3SessionId) return;
      const supabase = createClient();
      await supabase
        .from("reviewer3_sessions")
        .delete()
        .eq("session_id", reviewer3SessionId);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error deleting Reviewer3 session from Supabase:", error);
    }
  },
}));
