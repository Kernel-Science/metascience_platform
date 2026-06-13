"use client";

import React, {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { ArrowDown, ArrowUp, Sparkles, SquarePen, Square } from "lucide-react";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { AppShell } from "@/components/app-shell";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { useChatHistoryStore } from "@/lib/chat/chatHistoryStore";

const SUGGESTIONS = [
  "Find the seminal papers on quantum error correction with surface codes",
  "What are the research trends in loop quantum gravity since 2020? Chart the publications per year",
  "Map the citation network around black hole information paradox papers from the last 5 years",
  "Write a literature review on Bell tests since 2015 that I can export as PDF",
];

const deriveTitle = (messages: any[]): string => {
  const firstUser = messages.find((m) => m.role === "user");
  const text =
    (firstUser?.parts || [])
      .filter((p: any) => p.type === "text")
      .map((p: any) => p.text)
      .join(" ") || "New conversation";

  return text.length > 64 ? `${text.slice(0, 64)}…` : text;
};

// The composer: auto-growing textarea inside a floating FQxI surface.
const Composer: React.FC<{
  busy: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
}> = ({ busy, onSend, onStop }) => {
  const [input, setInput] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);

  const resize = () => {
    const ta = taRef.current;

    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  };

  const send = () => {
    const text = input.trim();

    if (!text || busy) return;
    onSend(text);
    setInput("");
    requestAnimationFrame(resize);
  };

  return (
    <div className="chat-composer px-4 pb-3 pt-3.5">
      <textarea
        ref={taRef}
        aria-label="Message the research assistant"
        placeholder="Ask about the literature — search, trends, citation maps, charts, reviews, reports…"
        rows={1}
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          resize();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
          }
        }}
      />
      <div className="mt-1.5 flex items-center">
        <span className="text-[11px] text-[var(--fqxi-ink-muted)]">
          Enter to send · Shift+Enter for a new line
        </span>
        {busy ? (
          <button
            aria-label="Stop generating"
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-[var(--fqxi-ink)] text-[var(--fqxi-paper)] transition-opacity hover:opacity-80"
            type="button"
            onClick={onStop}
          >
            <Square className="h-3.5 w-3.5 fill-current" />
          </button>
        ) : (
          <button
            aria-label="Send message"
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-[var(--fqxi-yellow)] text-[#1d1d1b] transition-all enabled:hover:scale-105 disabled:opacity-35"
            disabled={!input.trim()}
            type="button"
            onClick={send}
          >
            <ArrowUp className="h-4.5 w-4.5" strokeWidth={2.5} />
          </button>
        )}
      </div>
    </div>
  );
};

function ChatPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlChatId = searchParams.get("id");

  const { messages, sendMessage, status, error, stop, setMessages } = useChat();
  const { saveChat, loadChat, setActiveChatId } = useChatHistoryStore();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);

  // The persisted thread backing this conversation (null = not saved yet) and
  // the last URL id we acted on (so router.replace after save doesn't reload).
  const chatIdRef = useRef<string | null>(null);
  const prevStatusRef = useRef(status);

  const busy = status === "submitted" || status === "streaming";
  const empty = messages.length === 0;

  // React to the ?id= in the URL: load that thread, or reset for a new chat.
  useEffect(() => {
    if (!urlChatId) {
      if (chatIdRef.current) {
        chatIdRef.current = null;
        setActiveChatId(null);
        stop();
        setMessages([]);
      }

      return;
    }
    if (urlChatId === chatIdRef.current) return;

    chatIdRef.current = urlChatId;
    setActiveChatId(urlChatId);
    stop();
    loadChat(urlChatId).then((data) => {
      if (data && chatIdRef.current === urlChatId) {
        setMessages(data.messages);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlChatId]);

  // Persist the thread after every completed assistant turn.
  useEffect(() => {
    const prev = prevStatusRef.current;

    prevStatusRef.current = status;
    if (prev !== "streaming" || status !== "ready" || messages.length === 0) {
      return;
    }

    saveChat(chatIdRef.current, deriveTitle(messages), messages).then((id) => {
      if (id && !chatIdRef.current) {
        chatIdRef.current = id;
        setActiveChatId(id);
        router.replace(`/research/chat?id=${id}`, { scroll: false });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const scrollToBottom = useCallback((smooth = true) => {
    const el = scrollRef.current;

    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
    }
  }, []);

  const handleScroll = () => {
    const el = scrollRef.current;

    if (!el) return;
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 80);
  };

  // Follow the conversation while the user is at the bottom.
  useEffect(() => {
    if (atBottom) scrollToBottom(false);
  }, [messages, atBottom, scrollToBottom]);

  const send = (text: string) => {
    sendMessage({ text });
    requestAnimationFrame(() => scrollToBottom());
  };

  const newConversation = () => {
    stop();
    chatIdRef.current = null;
    setActiveChatId(null);
    setMessages([]);
    router.replace("/research/chat", { scroll: false });
  };

  return (
    <>
      {empty ? (
        /* ---- Empty state: centered greeting with the composer in flow ---- */
        <div className="flex flex-1 items-center justify-center px-4">
          <div className="w-full max-w-2xl">
            <h1 className="mb-2 text-center text-3xl font-bold text-[var(--fqxi-ink)]">
              What are we researching?
            </h1>
            <p className="mb-8 text-center text-[var(--fqxi-ink-muted)]">
              Search the literature, map citations, chart trends, review
              papers, draft exportable reports — in one conversation.
            </p>

            <Composer busy={busy} onSend={send} onStop={stop} />

            <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  className="rounded-xl border border-[var(--fqxi-border)] bg-[var(--fqxi-surface)] px-4 py-3 text-left text-sm text-[var(--fqxi-ink-muted)] transition-colors hover:border-[var(--fqxi-yellow)] hover:text-[var(--fqxi-ink)]"
                  type="button"
                  onClick={() => send(s)}
                >
                  <Sparkles className="mb-1.5 h-4 w-4 text-[var(--fqxi-yellow)]" />
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* ---- Conversation: one scroller, floating composer ---- */
        <div className="relative flex min-h-0 flex-1 flex-col">
          <div
            ref={scrollRef}
            className="chat-scroll flex-1 overflow-y-auto overflow-x-hidden pb-48 pt-8"
            onScroll={handleScroll}
          >
            <div className="flex flex-col gap-5">
              {messages.map((m) => (
                <ChatMessage key={m.id} message={m} />
              ))}

              {status === "submitted" && (
                <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
                  <div className="flex items-center gap-2 text-sm text-[var(--fqxi-ink-muted)]">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--fqxi-yellow)] opacity-75" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--fqxi-yellow)]" />
                    </span>
                    Thinking…
                  </div>
                </div>
              )}
              {error && (
                <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
                  <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-2.5 text-sm text-danger">
                    Something went wrong: {error.message}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Floating composer over the scroller, with a fade above it */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0">
            <div className="h-12 bg-gradient-to-t from-[var(--fqxi-paper-soft)] to-transparent" />
            <div className="bg-[var(--fqxi-paper-soft)]/80 px-4 pb-4 backdrop-blur-sm sm:px-6">
              <div className="pointer-events-auto relative mx-auto max-w-3xl">
                {!atBottom && (
                  <button
                    aria-label="Scroll to bottom"
                    className="absolute -top-12 left-1/2 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border border-[var(--fqxi-border)] bg-[var(--fqxi-surface)] text-[var(--fqxi-ink)] shadow-lg transition-transform hover:scale-105"
                    type="button"
                    onClick={() => scrollToBottom()}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                )}
                <Composer busy={busy} onSend={send} onStop={stop} />
                <div className="mt-2 flex justify-center">
                  <button
                    className="flex items-center gap-1.5 text-xs text-[var(--fqxi-ink-muted)] transition-colors hover:text-[var(--fqxi-ink)]"
                    type="button"
                    onClick={newConversation}
                  >
                    <SquarePen className="h-3.5 w-3.5" /> New conversation
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <AppShell scroll={false}>
        <Suspense fallback={null}>
          <ChatPageInner />
        </Suspense>
      </AppShell>
    </ProtectedRoute>
  );
}
