"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Avatar } from "@heroui/avatar";
import { Tooltip } from "@heroui/tooltip";
import {
  BookOpen,
  BookText,
  ChevronDown,
  ChevronUp,
  Code2,
  FileCheck,
  History,
  Menu,
  MessageCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  SquarePen,
  Trash2,
  TrendingUp,
  User,
  X,
} from "lucide-react";

import { useAuth } from "@/lib/auth/context";
import { useChatHistoryStore } from "@/lib/chat/chatHistoryStore";

const NAV_ITEMS = [
  { id: "chat", label: "Assistant", icon: MessageCircle, href: "/research/chat" },
  { id: "search", label: "Search", icon: Search, href: "/research/search" },
  { id: "analysis", label: "Analysis", icon: TrendingUp, href: "/research/analysis" },
  { id: "history", label: "History", icon: History, href: "/research/history" },
  { id: "citation", label: "Citation", icon: BookText, href: "/citation" },
  { id: "review", label: "Paper Assessment", icon: FileCheck, href: "/review" },
  { id: "developer", label: "Developer", icon: Code2, href: "/developer" },
  { id: "docs", label: "Docs", icon: BookOpen, href: "/docs" },
];

const COLLAPSE_KEY = "fqxi-sidebar-collapsed";
const RECENT_PREVIEW = 5;

const timeAgo = (iso: string): string => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;

  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;

  return `${Math.floor(s / 86400)}d`;
};

const getInitials = (email: string) =>
  email
    .split("@")[0]
    .split(".")
    .map((p) => p.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2);

// The app sidebar: navigation + persistent recent chats + user section.
// Desktop: fixed column, collapsible to an icon rail. Mobile: off-canvas
// drawer behind a floating hamburger.
export const AppSidebar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const {
    chats,
    loaded,
    expanded,
    activeChatId,
    setExpanded,
    fetchChats,
    deleteChat,
  } = useChatHistoryStore();

  useEffect(() => {
    setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
  }, []);

  useEffect(() => {
    if (user) fetchChats();
  }, [user, fetchChats]);

  const toggleCollapsed = () => {
    const next = !collapsed;

    setCollapsed(next);
    localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
  };

  const go = (href: string) => {
    router.push(href);
    setMobileOpen(false);
  };

  const openChat = (id: string) => {
    go(`/research/chat?id=${id}`);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const wasActive = activeChatId === id;

    await deleteChat(id);
    if (wasActive) router.push("/research/chat");
  };

  const visibleChats = expanded ? chats : chats.slice(0, RECENT_PREVIEW);

  const content = (
    <div className="flex h-full min-h-0 flex-col">
      {/* Logo + collapse toggle */}
      <div
        className={`flex items-center gap-2 px-3 pb-2 pt-4 ${collapsed ? "justify-center" : ""}`}
      >
        {!collapsed && (
          <button
            aria-label="FQxI Metascience home"
            className="flex items-center gap-2"
            type="button"
            onClick={() => go("/")}
          >
            <Image alt="FQxI" height={34} src="/FQXILogo.svg" width={66} />
          </button>
        )}
        <button
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="ml-auto hidden rounded-lg p-1.5 text-[var(--fqxi-ink-muted)] transition-colors hover:bg-[var(--fqxi-paper-soft)] hover:text-[var(--fqxi-ink)] lg:block"
          type="button"
          onClick={toggleCollapsed}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4.5 w-4.5" />
          ) : (
            <PanelLeftClose className="h-4.5 w-4.5" />
          )}
        </button>
        <button
          aria-label="Close menu"
          className="ml-auto rounded-lg p-1.5 text-[var(--fqxi-ink-muted)] lg:hidden"
          type="button"
          onClick={() => setMobileOpen(false)}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* New chat */}
      <div className="px-3 pb-1 pt-2">
        <Tooltip content="New chat" isDisabled={!collapsed} placement="right">
          <button
            className={`flex w-full items-center gap-2.5 rounded-xl border border-[var(--fqxi-border)] bg-[var(--fqxi-yellow)]/90 px-3 py-2.5 text-sm font-semibold text-[#1d1d1b] transition-all hover:bg-[var(--fqxi-yellow)] ${collapsed ? "justify-center px-0" : ""}`}
            type="button"
            onClick={() => go("/research/chat")}
          >
            <SquarePen className="h-4 w-4 shrink-0" />
            {!collapsed && "New chat"}
          </button>
        </Tooltip>
      </div>

      {/* Nav */}
      <nav className="px-3 pt-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/research/chat"
              ? pathname.startsWith("/research/chat")
              : pathname.startsWith(item.href);

          return (
            <Tooltip
              key={item.id}
              content={item.label}
              isDisabled={!collapsed}
              placement="right"
            >
              <button
                className={`mb-0.5 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${collapsed ? "justify-center px-0" : ""} ${
                  active
                    ? "bg-[var(--fqxi-ink)] text-[var(--fqxi-paper)]"
                    : "text-[var(--fqxi-ink-muted)] hover:bg-[var(--fqxi-paper-soft)] hover:text-[var(--fqxi-ink)]"
                }`}
                type="button"
                onClick={() => go(item.href)}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            </Tooltip>
          );
        })}
      </nav>

      {/* Recent chats */}
      {!collapsed && user && (
        <div className="mt-4 flex min-h-0 flex-1 flex-col px-3">
          <div className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--fqxi-ink-muted)]">
            Recent chats
          </div>
          <div className={`min-h-0 ${expanded ? "flex-1 overflow-y-auto chat-scroll" : ""}`}>
            {loaded && chats.length === 0 && (
              <p className="px-3 py-1 text-xs text-[var(--fqxi-ink-muted)]">
                No conversations yet.
              </p>
            )}
            {visibleChats.map((c) => (
              <div
                key={c.id}
                className={`group mb-0.5 flex w-full cursor-pointer items-center gap-1 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  activeChatId === c.id
                    ? "bg-[var(--fqxi-yellow)]/35 text-[var(--fqxi-ink)]"
                    : "text-[var(--fqxi-ink-muted)] hover:bg-[var(--fqxi-paper-soft)] hover:text-[var(--fqxi-ink)]"
                }`}
                role="button"
                tabIndex={0}
                onClick={() => openChat(c.id)}
                onKeyDown={(e) => e.key === "Enter" && openChat(c.id)}
              >
                <span className="min-w-0 flex-1 truncate">{c.title}</span>
                <span className="shrink-0 text-[10px] opacity-60 group-hover:hidden">
                  {timeAgo(c.updated_at)}
                </span>
                <button
                  aria-label={`Delete chat: ${c.title}`}
                  className="hidden shrink-0 rounded p-0.5 text-[var(--fqxi-ink-muted)] hover:text-danger group-hover:block"
                  type="button"
                  onClick={(e) => handleDelete(e, c.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {chats.length > RECENT_PREVIEW && !expanded && (
              <button
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[var(--fqxi-ink-muted)] transition-colors hover:text-[var(--fqxi-ink)]"
                type="button"
                onClick={() => setExpanded(true)}
              >
                <ChevronDown className="h-3.5 w-3.5" /> Show older chats
              </button>
            )}
            {expanded && (
              <button
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[var(--fqxi-ink-muted)] transition-colors hover:text-[var(--fqxi-ink)]"
                type="button"
                onClick={() => setExpanded(false)}
              >
                <ChevronUp className="h-3.5 w-3.5" /> Show fewer
              </button>
            )}
          </div>
        </div>
      )}

      {/* User */}
      <div className="mt-auto border-t border-[var(--fqxi-border)] p-3">
        {!loading &&
          (user ? (
            <button
              className={`flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors hover:bg-[var(--fqxi-paper-soft)] ${collapsed ? "justify-center px-0" : ""}`}
              type="button"
              onClick={() => go("/profile")}
            >
              <Avatar
                className="h-7 w-7 shrink-0"
                name={getInitials(user.email || "")}
                size="sm"
                src={
                  user.user_metadata?.avatar_url || user.user_metadata?.picture
                }
              />
              {!collapsed && (
                <span className="min-w-0 truncate text-sm text-[var(--fqxi-ink-muted)]">
                  {user.email}
                </span>
              )}
            </button>
          ) : (
            <button
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-[var(--fqxi-ink-muted)] transition-colors hover:bg-[var(--fqxi-paper-soft)] hover:text-[var(--fqxi-ink)] ${collapsed ? "justify-center px-0" : ""}`}
              type="button"
              onClick={() => go("/auth/login")}
            >
              <User className="h-4 w-4 shrink-0" />
              {!collapsed && "Sign in"}
            </button>
          ))}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        aria-label="Open menu"
        className="fixed left-3 top-3 z-40 rounded-xl border border-[var(--fqxi-border)] bg-[var(--fqxi-surface)] p-2 text-[var(--fqxi-ink)] shadow-md backdrop-blur-sm lg:hidden"
        type="button"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-black/30"
            type="button"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 border-r border-[var(--fqxi-border)] bg-[var(--fqxi-paper)] shadow-2xl">
            {content}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className={`hidden shrink-0 border-r border-[var(--fqxi-border)] bg-[color-mix(in_srgb,var(--fqxi-paper)_75%,transparent)] backdrop-blur-sm transition-[width] duration-200 lg:block ${collapsed ? "w-[68px]" : "w-[264px]"}`}
      >
        {content}
      </aside>
    </>
  );
};
