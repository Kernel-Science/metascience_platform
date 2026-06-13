"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { Spinner } from "@heroui/spinner";
import { Chip } from "@heroui/chip";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Check, Copy, KeyRound, Plus, Trash2, TriangleAlert } from "lucide-react";

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  last_used_at: string | null;
  created_at: string;
}

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Never";

export function ApiKeysManager() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // Raw secret shown exactly once, right after creation.
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const copyKey = async (key: string) => {
    await navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadKeys = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/keys");
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to load keys");
      setKeys(data.keys ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load keys");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  const createKey = async () => {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() || "API key" }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to create key");
      setCreatedKey(data.key);
      setNewName("");
      await loadKeys();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create key");
    } finally {
      setCreating(false);
    }
  };

  const revokeKey = async (id: string) => {
    setRevokingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/keys/${id}`, { method: "DELETE" });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));

        throw new Error(data.error || "Failed to revoke key");
      }
      setKeys((prev) => prev.filter((k) => k.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to revoke key");
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <Card className="border border-divider/50">
      <CardHeader className="flex items-center justify-between gap-3 pb-4">
        <div className="flex items-center gap-3">
          <KeyRound className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">API Keys</h2>
        </div>
      </CardHeader>
      <CardBody className="space-y-5">
        <p className="text-sm text-foreground/70">
          Use these keys to authenticate requests to the public API. Treat them
          like passwords — anyone with a key can make requests billed to this
          platform&apos;s quota. You can revoke a key at any time.
        </p>

        {/* Create */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <Input
            className="sm:max-w-xs"
            label="Key name"
            placeholder="e.g. My research script"
            size="sm"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !creating && createKey()}
          />
          <Button
            color="primary"
            isLoading={creating}
            startContent={!creating && <Plus className="h-4 w-4" />}
            onPress={createKey}
          >
            Create key
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
            <TriangleAlert className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner size="sm" />
          </div>
        ) : keys.length === 0 ? (
          <p className="py-6 text-center text-sm text-foreground/50">
            No API keys yet. Create one to get started.
          </p>
        ) : (
          <div className="divide-y divide-divider/50 rounded-lg border border-divider/50">
            {keys.map((k) => (
              <div
                key={k.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-foreground">
                      {k.name}
                    </span>
                    <Chip size="sm" variant="flat">
                      {k.key_prefix}…
                    </Chip>
                  </div>
                  <p className="mt-0.5 text-xs text-foreground/50">
                    Created {fmtDate(k.created_at)} · Last used{" "}
                    {fmtDate(k.last_used_at)}
                  </p>
                </div>
                <Button
                  isIconOnly
                  aria-label={`Revoke ${k.name}`}
                  color="danger"
                  isLoading={revokingId === k.id}
                  size="sm"
                  variant="light"
                  onPress={() => revokeKey(k.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardBody>

      {/* One-time reveal modal */}
      <Modal isOpen={!!createdKey} onClose={() => setCreatedKey(null)}>
        <ModalContent>
          <ModalHeader className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            Your new API key
          </ModalHeader>
          <ModalBody>
            <div className="flex items-start gap-2 rounded-lg bg-warning/10 px-3 py-2 text-sm text-warning-600">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Copy this key now — it won&apos;t be shown again. Store it
                somewhere safe.
              </span>
            </div>
            {createdKey && (
              <div className="flex w-full items-start gap-2 rounded-lg border border-divider bg-content2 p-3">
                <code className="min-w-0 flex-1 break-all font-mono text-xs leading-relaxed text-foreground">
                  {createdKey}
                </code>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  className="shrink-0"
                  onPress={() => copyKey(createdKey)}
                  aria-label="Copy API key"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onPress={() => setCreatedKey(null)}>
              Done
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Card>
  );
}
