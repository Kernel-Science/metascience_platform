"use client";

import React, { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Tabs, Tab } from "@heroui/tabs";
import { Check, Copy, Terminal } from "lucide-react";

// Small copy-enabled code block (HeroUI Snippet is awkward with multi-line).
function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="group relative">
      <button
        aria-label="Copy code"
        className="absolute right-2 top-2 rounded-md border border-divider/60 bg-default-100/80 p-1.5 text-foreground/60 opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
        type="button"
        onClick={copy}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-success" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
      <pre className="overflow-x-auto rounded-lg bg-default-100/60 p-4 text-xs leading-relaxed text-foreground/80">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function Endpoint({
  method,
  path,
  children,
}: {
  method: "GET" | "POST";
  path: string;
  children: React.ReactNode;
}) {
  const color = method === "GET" ? "success" : "primary";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Chip color={color} size="sm" variant="flat">
          {method}
        </Chip>
        <code className="text-sm font-medium text-foreground">{path}</code>
      </div>
      {children}
    </div>
  );
}

export function ApiDocs() {
  const [baseUrl, setBaseUrl] = useState("https://your-domain.com/api/v1");

  useEffect(() => {
    setBaseUrl(`${window.location.origin}/api/v1`);
  }, []);

  const curlSearch = `curl "${baseUrl}/search?query=quantum%20gravity&limit=10" \\
  -H "Authorization: Bearer YOUR_API_KEY"`;

  const jsSearch = `const res = await fetch(
  "${baseUrl}/search?query=quantum%20gravity&limit=10",
  { headers: { Authorization: "Bearer YOUR_API_KEY" } }
);
const data = await res.json();
console.log(data.papers);`;

  const pySearch = `import requests

res = requests.get(
    "${baseUrl}/search",
    params={"query": "quantum gravity", "limit": 10},
    headers={"Authorization": "Bearer YOUR_API_KEY"},
)
print(res.json()["papers"])`;

  return (
    <div className="space-y-8">
      {/* Overview */}
      <Card className="border border-divider/50">
        <CardHeader className="flex items-center gap-3 pb-4">
          <Terminal className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">
            API Reference
          </h2>
        </CardHeader>
        <CardBody className="space-y-4">
          <div>
            <h3 className="mb-1 text-sm font-semibold text-foreground">
              Base URL
            </h3>
            <CodeBlock code={baseUrl} />
          </div>
          <div>
            <h3 className="mb-1 text-sm font-semibold text-foreground">
              Authentication
            </h3>
            <p className="mb-2 text-sm text-foreground/70">
              Send your key in the <code>Authorization</code> header as a bearer
              token (or the <code>x-api-key</code> header). Requests without a
              valid key return <code>401</code>.
            </p>
            <CodeBlock code={`Authorization: Bearer YOUR_API_KEY`} />
          </div>
        </CardBody>
      </Card>

      {/* Quick start */}
      <Card className="border border-divider/50">
        <CardHeader className="pb-4">
          <h2 className="text-xl font-semibold text-foreground">Quick start</h2>
        </CardHeader>
        <CardBody>
          <Tabs aria-label="Quick start language">
            <Tab key="curl" title="cURL">
              <CodeBlock code={curlSearch} />
            </Tab>
            <Tab key="js" title="JavaScript">
              <CodeBlock code={jsSearch} />
            </Tab>
            <Tab key="python" title="Python">
              <CodeBlock code={pySearch} />
            </Tab>
          </Tabs>
        </CardBody>
      </Card>

      {/* Endpoints */}
      <Card className="border border-divider/50">
        <CardHeader className="pb-4">
          <h2 className="text-xl font-semibold text-foreground">Endpoints</h2>
        </CardHeader>
        <CardBody className="space-y-8">
          {/* Search */}
          <Endpoint method="GET" path="/search">
            <p className="text-sm text-foreground/70">
              Multi-source paper search across ArXiv, OpenAlex, INSPIRE-HEP, and
              NASA ADS, merged and reranked for relevance.
            </p>
            <div className="text-sm text-foreground/70">
              <span className="font-semibold text-foreground">
                Query params:
              </span>{" "}
              <code>query</code> (required), <code>limit</code>,{" "}
              <code>offset</code>, <code>source</code> (
              <code>all|arxiv|openalex|inspire|ads</code>),{" "}
              <code>year_from</code>, <code>year_to</code>,{" "}
              <code>min_citations</code>.
            </div>
            <CodeBlock
              code={`{
  "papers": [ { "title": "...", "authors": [...], "year": 2023,
                "doi": "...", "citation_count": 42, "abstract": "..." } ],
  "total_found": 128,
  "returned": 10,
  "sources_used": ["arxiv", "openalex"],
  "reranked": true
}`}
            />
          </Endpoint>

          <Divider />

          {/* Citation network */}
          <Endpoint method="POST" path="/citation-network">
            <p className="text-sm text-foreground/70">
              Build a citation graph (nodes, edges, clusters) seeded on a DOI.
            </p>
            <div className="text-sm text-foreground/70">
              <span className="font-semibold text-foreground">
                Body (JSON):
              </span>{" "}
              <code>doi</code> (required), <code>max_references</code>,{" "}
              <code>max_citations</code>, <code>data_source</code> (
              <code>s2|oa</code>).
            </div>
            <CodeBlock
              code={`curl -X POST "${baseUrl}/citation-network" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"doi": "10.1103/PhysRevLett.116.061102", "max_references": 30}'`}
            />
          </Endpoint>

          <Divider />

          {/* Trends */}
          <Endpoint method="POST" path="/trends">
            <p className="text-sm text-foreground/70">
              Topic clustering plus an AI-written synthesis of how a research
              area is evolving. Pass a <code>query</code> and the API searches
              first, then analyses the results.
            </p>
            <div className="text-sm text-foreground/70">
              <span className="font-semibold text-foreground">
                Body (JSON):
              </span>{" "}
              <code>query</code> (required) and optional <code>limit</code> — or
              pass a <code>papers</code> array to analyse your own set.
            </div>
            <CodeBlock
              code={`curl -X POST "${baseUrl}/trends" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"query": "topological quantum computing", "limit": 100}'`}
            />
          </Endpoint>

          <Divider />

          {/* Review */}
          <Endpoint method="POST" path="/review">
            <p className="text-sm text-foreground/70">
              AI peer-review assessment of an uploaded paper (PDF, LaTeX, TXT,
              DOCX, MD). Returns structured scores and justifications. Send as{" "}
              <code>multipart/form-data</code> with a <code>file</code> field.
            </p>
            <CodeBlock
              code={`curl -X POST "${baseUrl}/review" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@paper.pdf"`}
            />
          </Endpoint>
        </CardBody>
      </Card>

      {/* Errors + limits */}
      <Card className="border border-divider/50">
        <CardHeader className="pb-4">
          <h2 className="text-xl font-semibold text-foreground">
            Errors &amp; rate limits
          </h2>
        </CardHeader>
        <CardBody className="space-y-3 text-sm text-foreground/70">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg bg-default-100/50 p-3">
              <code className="font-semibold text-foreground">400</code> —
              missing or invalid parameters
            </div>
            <div className="rounded-lg bg-default-100/50 p-3">
              <code className="font-semibold text-foreground">401</code> —
              invalid or missing API key
            </div>
            <div className="rounded-lg bg-default-100/50 p-3">
              <code className="font-semibold text-foreground">404</code> — no
              results for the request
            </div>
            <div className="rounded-lg bg-default-100/50 p-3">
              <code className="font-semibold text-foreground">502</code> —
              upstream research engine unavailable
            </div>
          </div>
          <p>
            Errors return a JSON body of the shape{" "}
            <code>{`{ "error": "message" }`}</code>. There is no hard rate limit
            on the hosted instance today, but please be considerate — the
            underlying data sources and AI models are themselves rate-limited.
            Self-hosters should add their own quota enforcement.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
