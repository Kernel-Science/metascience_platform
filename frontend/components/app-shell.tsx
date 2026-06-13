"use client";

import React from "react";

import { AppSidebar } from "./app-sidebar";

// Shared chrome for the app pages: sidebar + content area. Replaces the old
// floating Navbar. `scroll=false` is for viewport-fixed pages (the chat) that
// manage their own scrolling.
export const AppShell: React.FC<{
  children: React.ReactNode;
  scroll?: boolean;
}> = ({ children, scroll = true }) => (
  <div className="brand-app-shell flex h-dvh overflow-hidden">
    <AppSidebar />
    <div
      className={
        scroll
          ? "min-w-0 flex-1 overflow-y-auto"
          : "flex min-w-0 flex-1 flex-col overflow-hidden"
      }
    >
      {children}
    </div>
  </div>
);
