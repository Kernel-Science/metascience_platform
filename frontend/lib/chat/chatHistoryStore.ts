"use client";

import { create } from "zustand";

import { createClient } from "@/lib/supabase/client";

// Persistent chat threads (Supabase `chat_threads` — see
// supabase_migration_chat.sql). One store shared by the chat page (saving /
// loading turns) and the sidebar (recent-chats list). All operations are
// best-effort: a missing table or signed-out user degrades to a non-persistent
// chat, never a broken one.

export interface ChatMeta {
  id: string;
  title: string;
  updated_at: string;
}

const RECENT_LIMIT = 8;
const ALL_LIMIT = 100;

interface ChatHistoryState {
  chats: ChatMeta[];
  loaded: boolean;
  expanded: boolean;
  /** The thread currently open in the chat page (highlights in the sidebar). */
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  setExpanded: (expanded: boolean) => void;
  fetchChats: () => Promise<void>;
  /** Create or update a thread with the full message array. Returns the id. */
  saveChat: (
    id: string | null,
    title: string,
    messages: any[],
  ) => Promise<string | null>;
  loadChat: (id: string) => Promise<{ title: string; messages: any[] } | null>;
  deleteChat: (id: string) => Promise<void>;
}

export const useChatHistoryStore = create<ChatHistoryState>((set, get) => ({
  chats: [],
  loaded: false,
  expanded: false,
  activeChatId: null,

  setActiveChatId: (id) => set({ activeChatId: id }),
  setExpanded: (expanded) => {
    set({ expanded });
    // Pull the longer list the first time the user expands.
    if (expanded) get().fetchChats();
  },

  fetchChats: async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        set({ chats: [], loaded: true });

        return;
      }

      const { data, error } = await supabase
        .from("chat_threads")
        .select("id, title, updated_at")
        .order("updated_at", { ascending: false })
        .limit(get().expanded ? ALL_LIMIT : RECENT_LIMIT);

      if (error) throw error;
      set({ chats: data || [], loaded: true });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("chat history unavailable:", e);
      set({ loaded: true });
    }
  },

  saveChat: async (id, title, messages) => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return null;

      if (id) {
        const { error } = await supabase
          .from("chat_threads")
          .update({ messages, title })
          .eq("id", id);

        if (error) throw error;
        get().fetchChats();

        return id;
      }

      const { data, error } = await supabase
        .from("chat_threads")
        .insert([{ user_id: user.id, title, messages }])
        .select("id")
        .single();

      if (error) throw error;
      get().fetchChats();

      return data?.id ?? null;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("failed to save chat:", e);

      return id;
    }
  },

  loadChat: async (id) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("chat_threads")
        .select("title, messages")
        .eq("id", id)
        .single();

      if (error) throw error;

      return data ? { title: data.title, messages: data.messages || [] } : null;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("failed to load chat:", e);

      return null;
    }
  },

  deleteChat: async (id) => {
    try {
      const supabase = createClient();

      await supabase.from("chat_threads").delete().eq("id", id);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("failed to delete chat:", e);
    }
    set({ chats: get().chats.filter((c) => c.id !== id) });
    if (get().activeChatId === id) set({ activeChatId: null });
  },
}));
