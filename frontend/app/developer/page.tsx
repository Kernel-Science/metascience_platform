"use client";

import React from "react";
import { Code2 } from "lucide-react";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { AppShell } from "@/components/app-shell";
import { ApiKeysManager } from "@/components/developer/ApiKeysManager";
import { ApiDocs } from "@/components/developer/ApiDocs";

export default function DeveloperPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <div className="container mx-auto max-w-5xl px-6 py-10">
          {/* Header */}
          <div className="mb-8">
            <div className="mb-2 flex items-center gap-3">
              <Code2 className="h-7 w-7 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Developer</h1>
            </div>
            <p className="max-w-2xl text-foreground/70">
              Build on the Metascience Platform. Create an API key and call the
              same search, citation-network, trends, and paper-assessment
              engines that power this app — straight from your own projects.
            </p>
          </div>

          <div className="space-y-10">
            <ApiKeysManager />
            <ApiDocs />
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
