"use client";

import React from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import {
  Eye,
  Shield,
  Database,
  Brain,
  Users,
  TriangleAlert,
  CheckCircle,
  FileText,
  GitBranch,
  Lock,
  Network,
  TrendingUp,
  Share2,
  GraduationCap,
  Building2,
  FlaskConical,
  LayoutGrid,
} from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

import { Navbar } from "@/components/navbar";
import { FeedbackButton } from "@/components/feedback/FeedbackButton";

export default function MethodsPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900/50">
        <Navbar />

        <div className="container mx-auto px-6 py-24 max-w-6xl">
          {/* What This System Does */}
          <div className="mb-12">
            <Card className="border border-divider/50">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <Shield className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-semibold text-foreground">
                    What This System Does
                  </h2>
                </div>
              </CardHeader>
              <CardBody>
                <p className="text-foreground/80 leading-relaxed">
                  This is an open-source research analysis platform that helps
                  academics, researchers, and curious individuals understand
                  scientific literature in a more comprehensive way. With access
                  to over <strong>2.3 million scientific papers</strong>, the
                  system acts as a research assistant that can read, analyze,
                  and help you discover patterns in academic literature through
                  AI-driven insights.
                </p>
              </CardBody>
            </Card>
          </div>

          {/* Core Functions */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
              Core Functions
            </h2>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Paper Discovery & Search */}
              <Card className="border border-divider/50">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <Database className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">
                      Paper Discovery & Search
                    </h3>
                  </div>
                </CardHeader>
                <CardBody className="space-y-3">
                  <div>
                    <Chip
                      className="mb-2"
                      color="primary"
                      size="sm"
                      variant="flat"
                    >
                      What it does
                    </Chip>
                    <p className="text-sm text-foreground/70">
                      Searches multiple academic databases simultaneously
                      (ArXiv, Semantic Scholar, OpenAlex) to find research
                      papers
                    </p>
                  </div>
                  <div>
                    <Chip
                      className="mb-2"
                      color="secondary"
                      size="sm"
                      variant="flat"
                    >
                      How it works
                    </Chip>
                    <p className="text-sm text-foreground/70">
                      When you search for a topic, the system queries all major
                      academic databases and combines the results, giving you a
                      more complete picture than searching just one database
                    </p>
                  </div>
                  <div>
                    <Chip
                      className="mb-2"
                      color="success"
                      size="sm"
                      variant="flat"
                    >
                      Why this matters
                    </Chip>
                    <p className="text-sm text-foreground/70">
                      No single database has all papers, so combining sources
                      helps ensure you don&apos;t miss important research
                    </p>
                  </div>
                </CardBody>
              </Card>

              {/* Natural Language Query Processing */}
              <Card className="border border-divider/50">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <Brain className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">
                      Natural Language Query Processing
                    </h3>
                  </div>
                </CardHeader>
                <CardBody className="space-y-3">
                  <div>
                    <Chip
                      className="mb-2"
                      color="primary"
                      size="sm"
                      variant="flat"
                    >
                      What it does
                    </Chip>
                    <p className="text-sm text-foreground/70">
                      Converts your everyday language questions into proper
                      academic search terms
                    </p>
                  </div>
                  <div>
                    <Chip
                      className="mb-2"
                      color="secondary"
                      size="sm"
                      variant="flat"
                    >
                      How it works
                    </Chip>
                    <p className="text-sm text-foreground/70">
                      Uses AI (Claude 4.5 Sonnet) to understand what you&apos;re
                      really asking for and translates it into effective search
                      queries across multiple disciplines
                    </p>
                  </div>
                  <div>
                    <Chip
                      className="mb-2"
                      color="warning"
                      size="sm"
                      variant="flat"
                    >
                      Example
                    </Chip>
                    <p className="text-sm text-foreground/70">
                      &quot;Show me papers about AI helping doctors&quot;
                      becomes a structured search for &quot;artificial
                      intelligence medical diagnosis clinical decision
                      support&quot;
                    </p>
                  </div>
                </CardBody>
              </Card>

              {/* Citation Network Analysis */}
              <Card className="border border-divider/50">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <Network className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">
                      Citation Network Analysis
                    </h3>
                  </div>
                </CardHeader>
                <CardBody className="space-y-3">
                  <div>
                    <Chip
                      className="mb-2"
                      color="primary"
                      size="sm"
                      variant="flat"
                    >
                      What it does
                    </Chip>
                    <p className="text-sm text-foreground/70">
                      Visualizes relationships between papers to identify
                      influential research and citation clusters
                    </p>
                  </div>
                  <div>
                    <Chip
                      className="mb-2"
                      color="secondary"
                      size="sm"
                      variant="flat"
                    >
                      How it works
                    </Chip>
                    <p className="text-sm text-foreground/70">
                      Builds complex graphs using data from Semantic Scholar and
                      OpenAlex to show how papers cite and reference each other
                    </p>
                  </div>
                </CardBody>
              </Card>

              {/* Trend Discovery & Analytics */}
              <Card className="border border-divider/50">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">
                      Trend Discovery & Analytics
                    </h3>
                  </div>
                </CardHeader>
                <CardBody className="space-y-3">
                  <div>
                    <Chip
                      className="mb-2"
                      color="primary"
                      size="sm"
                      variant="flat"
                    >
                      What it does
                    </Chip>
                    <p className="text-sm text-foreground/70">
                      Spot emerging research topics, identify research gaps, and
                      analyze temporal publication patterns
                    </p>
                  </div>
                  <div>
                    <Chip
                      className="mb-2"
                      color="secondary"
                      size="sm"
                      variant="flat"
                    >
                      How it works
                    </Chip>
                    <p className="text-sm text-foreground/70">
                      Combines statistical analysis with Claude 4.5 Sonnet to
                      provide contextual insights into how fields are evolving
                    </p>
                  </div>
                </CardBody>
              </Card>

              {/* AI-Powered Paper Assessment */}
              <Card className="border border-divider/50">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold text-foreground">
                        AI-Powered Paper Assessment
                      </h3>
                    </div>
                    <Chip color="primary" size="sm" variant="flat">
                      New feature
                    </Chip>
                  </div>
                </CardHeader>
                <CardBody>
                  <p className="text-sm text-foreground/70 mb-4">
                    An automated peer review system that evaluates research
                    papers objectively.
                  </p>
                  <div className="space-y-2 text-xs text-foreground/60">
                    <div>• Paper Upload (PDF, LaTeX, Word, text files)</div>
                    <div>• AI Analysis using Gemini 3 Flash Preview</div>
                    <div>
                      • Structured Evaluation with human reviewer criteria
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Export & Reporting */}
              <Card className="border border-divider/50">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <Share2 className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">
                      Export & Reporting
                    </h3>
                  </div>
                </CardHeader>
                <CardBody className="space-y-3">
                  <div>
                    <Chip
                      className="mb-2"
                      color="primary"
                      size="sm"
                      variant="flat"
                    >
                      Features
                    </Chip>
                    <p className="text-sm text-foreground/70">
                      Save your analysis, generate comprehensive PDF reports,
                      and share insights with your research team
                    </p>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>

          {/* Review System Details */}
          <div className="mb-12">
            <Card className="border border-divider/50">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-success" />
                  <h2 className="text-2xl font-semibold text-foreground">
                    Review System Evaluation Criteria
                  </h2>
                </div>
              </CardHeader>
              <CardBody>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Brain className="h-5 w-5 text-primary" />
                      Scientific Quality
                    </h3>
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-default-100/50">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm text-foreground">
                            Formal Correctness
                          </span>
                          <Chip color="primary" size="sm" variant="flat">
                            1-4 scale
                          </Chip>
                        </div>
                        <p className="text-xs text-foreground/70">
                          Are the math and reasoning sound? Are there logical
                          errors?
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-default-100/50">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm text-foreground">
                            Reproducibility
                          </span>
                          <Chip color="secondary" size="sm" variant="flat">
                            1-4 scale
                          </Chip>
                        </div>
                        <p className="text-xs text-foreground/70">
                          Can other researchers repeat this work and get the
                          same results?
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-default-100/50">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm text-foreground">
                            Impact/Advance
                          </span>
                          <Chip color="success" size="sm" variant="flat">
                            1-3 scale
                          </Chip>
                        </div>
                        <p className="text-xs text-foreground/70">
                          How significant is this contribution to the field?
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-default-100/50">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm text-foreground">
                            Novelty
                          </span>
                          <Chip color="warning" size="sm" variant="flat">
                            1-5 scale
                          </Chip>
                        </div>
                        <p className="text-xs text-foreground/70">
                          How original and new is this research?
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-secondary" />
                      Communication Quality
                    </h3>
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-default-100/50">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm text-foreground">
                            Writing Clarity
                          </span>
                          <Chip color="primary" size="sm" variant="flat">
                            1-4 scale
                          </Chip>
                        </div>
                        <p className="text-xs text-foreground/70">
                          Is the paper easy to understand and well-organized?
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-default-100/50">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm text-foreground">
                            Grammar/Syntax
                          </span>
                          <Chip color="secondary" size="sm" variant="flat">
                            1-3 scale
                          </Chip>
                        </div>
                        <p className="text-xs text-foreground/70">
                          Are there writing errors or typos?
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-default-100/50">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm text-foreground">
                            Fairness
                          </span>
                          <Chip color="success" size="sm" variant="flat">
                            1-3 scale
                          </Chip>
                        </div>
                        <p className="text-xs text-foreground/70">
                          Do the authors make appropriate claims or do they
                          oversell their results?
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-default-100/50">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm text-foreground">
                            Interdisciplinarity
                          </span>
                          <Chip color="warning" size="sm" variant="flat">
                            1-4 scale
                          </Chip>
                        </div>
                        <p className="text-xs text-foreground/70">
                          Does the work connect multiple fields of study?
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Data Sources */}
          <div className="mb-12">
            <Card className="border border-divider/50">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <Database className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-semibold text-foreground">
                    Data Sources
                  </h2>
                </div>
              </CardHeader>
              <CardBody>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-foreground mb-2">
                      ArXiv
                    </h4>
                    <p className="text-xs text-foreground/70">
                      Preprint server for physics, math, computer science, and
                      more
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-foreground mb-2">
                      Semantic Scholar
                    </h4>
                    <p className="text-xs text-foreground/70">
                      AI-powered academic search engine by the Allen Institute
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-foreground mb-2">
                      OpenAlex
                    </h4>
                    <p className="text-xs text-foreground/70">
                      Open catalog of scholarly papers and authors
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-foreground mb-2">
                      OpenCitations
                    </h4>
                    <p className="text-xs text-foreground/70">
                      Open database of citation data
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* AI Systems Used */}
          <div className="mb-12">
            <Card className="border border-divider/50">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <Brain className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-semibold text-foreground">
                    AI Systems Used
                  </h2>
                </div>
              </CardHeader>
              <CardBody>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <div className="p-4 rounded-lg bg-default-100/50">
                      <Chip
                        className="mb-1"
                        color="primary"
                        size="sm"
                        variant="flat"
                      >
                        Gemini 3 Flash Preview
                      </Chip>
                      <p className="text-sm text-foreground/70">
                        Reads and analyzes uploaded papers
                      </p>
                      <Divider className="my-2" />
                      <p className="text-xs text-foreground/60">
                        <strong>Why this choice:</strong> Gemini can process
                        multiple file formats and has strong reasoning
                        capabilities for academic content
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="p-4 rounded-lg bg-default-100/50">
                      <Chip
                        className="mb-1"
                        color="secondary"
                        size="sm"
                        variant="flat"
                      >
                        Claude 4.5 Sonnet
                      </Chip>
                      <p className="text-sm text-foreground/70">
                        Converts natural language to search queries and analyzes
                        research trends
                      </p>
                      <Divider className="my-2" />
                      <p className="text-xs text-foreground/60">
                        <strong>Why this choice:</strong> Claude excels at
                        understanding context and producing structured analysis
                      </p>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* How We Ensure Fairness and Accuracy */}
          <div className="mb-12">
            <Card className="border border-divider/50">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-success" />
                  <h2 className="text-2xl font-semibold text-foreground">
                    How We Ensure Fairness and Accuracy
                  </h2>
                </div>
              </CardHeader>
              <CardBody>
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Objective Review Process
                </h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="p-3 rounded-lg bg-default-100/50">
                    <div className="font-medium text-sm text-foreground">
                      Standardized Criteria
                    </div>
                    <div className="text-xs text-foreground/70">
                      All papers are evaluated using the same scientific
                      standards used in traditional peer review
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-default-100/50">
                    <div className="font-medium text-sm text-foreground">
                      No Identity Information
                    </div>
                    <div className="text-xs text-foreground/70">
                      The AI doesn&apos;t see author names, institutions, or
                      other identifying information during review
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-default-100/50">
                    <div className="font-medium text-sm text-foreground">
                      Multiple Perspectives
                    </div>
                    <div className="text-xs text-foreground/70">
                      The system doesn&apos;t rely on a single metric but
                      evaluates multiple dimensions of quality
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-default-100/50">
                    <div className="font-medium text-sm text-foreground">
                      Transparent Scoring
                    </div>
                    <div className="text-xs text-foreground/70">
                      Each score includes specific justifications with
                      references to paper sections
                    </div>
                  </div>
                </div>

                <Divider className="my-6" />

                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Quality Controls
                </h3>
                <div className="space-y-4">
                  <div className="text-sm text-foreground/80">
                    <strong className="block text-foreground mb-1">
                      Error Handling:
                    </strong>
                    The system validates file uploads and handles processing
                    errors gracefully
                  </div>
                  <div className="text-sm text-foreground/80">
                    <strong className="block text-foreground mb-1">
                      Rate Limiting:
                    </strong>
                    API calls are carefully managed to respect service limits
                    and ensure reliable access
                  </div>
                  <div className="text-sm text-foreground/80">
                    <strong className="block text-foreground mb-1">
                      Fallback Systems:
                    </strong>
                    If one data source fails, others can still provide
                    information
                  </div>
                </div>

                <Divider className="my-6" />

                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Transparency Measures
                </h3>
                <div className="space-y-4">
                  <div className="text-sm text-foreground/80">
                    <strong className="block text-foreground mb-1">
                      Code Transparency:
                    </strong>
                    All algorithms and processes are visible in this open-source
                    codebase
                  </div>
                  <div className="text-sm text-foreground/80">
                    <strong className="block text-foreground mb-1">
                      Configuration Access:
                    </strong>
                    The exact prompts and instructions given to AI systems are
                    publicly available
                  </div>
                  <div className="text-sm text-foreground/80">
                    <strong className="block text-foreground mb-1">
                      No Hidden Processes:
                    </strong>
                    Every step of analysis is logged and can be audited
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Data Privacy and Storage */}
          <div className="mb-12">
            <Card className="border border-divider/50">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <Lock className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-semibold text-foreground">
                    Data Privacy and Storage
                  </h2>
                </div>
              </CardHeader>
              <CardBody>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                  <div className="p-3 rounded-lg bg-default-100/50">
                    <div className="font-medium text-sm text-foreground">
                      No Personal Data
                    </div>
                    <div className="text-xs text-foreground/70">
                      The system only processes publicly available academic
                      papers and metadata
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-default-100/50">
                    <div className="font-medium text-sm text-foreground">
                      Temporary Processing
                    </div>
                    <div className="text-xs text-foreground/70">
                      Uploaded files are processed and analyzed but not
                      permanently stored
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-default-100/50">
                    <div className="font-medium text-sm text-foreground">
                      In-Memory Storage
                    </div>
                    <div className="text-xs text-foreground/70">
                      Currently uses temporary in-memory storage (designed to be
                      replaced with proper database)
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-default-100/50">
                    <div className="font-medium text-sm text-foreground">
                      No Tracking
                    </div>
                    <div className="text-xs text-foreground/70">
                      The system doesn&apos;t track individual users or create
                      profiles
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Limitations and Biases */}
          <div className="mb-12">
            <Card className="border border-divider/50">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <TriangleAlert className="h-6 w-6 text-warning" />
                  <h2 className="text-2xl font-semibold text-foreground">
                    Limitations and Biases
                  </h2>
                </div>
              </CardHeader>
              <CardBody>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h3 className="text-lg font-semibold text-warning mb-4">
                      Current Limitations
                    </h3>
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-default-100/50">
                        <div className="font-medium text-sm text-foreground">
                          Language
                        </div>
                        <div className="text-xs text-foreground/70">
                          Primarily designed for English-language papers
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-default-100/50">
                        <div className="font-medium text-sm text-foreground">
                          Scope
                        </div>
                        <div className="text-xs text-foreground/70">
                          Best suited for STEM fields (science, technology,
                          engineering, mathematics)
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-default-100/50">
                        <div className="font-medium text-sm text-foreground">
                          AI Limitations
                        </div>
                        <div className="text-xs text-foreground/70">
                          AI analysis, while sophisticated, may miss nuances
                          that human experts would catch
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-default-100/50">
                        <div className="font-medium text-sm text-foreground">
                          Data Coverage
                        </div>
                        <div className="text-xs text-foreground/70">
                          Limited to papers available in public databases
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-danger mb-4">
                      Potential Biases
                    </h3>
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-default-100/50">
                        <div className="font-medium text-sm text-foreground">
                          Database Bias
                        </div>
                        <div className="text-xs text-foreground/70">
                          Results depend on what&apos;s available in the source
                          databases
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-default-100/50">
                        <div className="font-medium text-sm text-foreground">
                          Language Model Bias
                        </div>
                        <div className="text-xs text-foreground/70">
                          AI systems may reflect biases present in their
                          training data
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-default-100/50">
                        <div className="font-medium text-sm text-foreground">
                          Recency Bias
                        </div>
                        <div className="text-xs text-foreground/70">
                          Newer papers may be better represented in databases
                          than older ones
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* How to Interpret Results */}
          <div className="mb-12">
            <Card className="border border-divider/50">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <Eye className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-semibold text-foreground">
                    How to Interpret Results
                  </h2>
                </div>
              </CardHeader>
              <CardBody>
                <h3 className="mb-3 text-lg font-semibold text-foreground">
                  Review Scores
                </h3>
                <div className="space-y-2 mb-6">
                  <div>
                    • <strong>Scores are relative:</strong> A score of 3/4 means
                    &quot;good&quot; in the context of academic standards, not
                    perfect
                  </div>
                  <div>
                    • <strong>Multiple dimensions matter:</strong> A paper might
                    score high on novelty but lower on reproducibility - both
                    are important
                  </div>
                  <div>
                    • <strong>Context is key:</strong> Different fields have
                    different standards and expectations
                  </div>
                </div>

                <h3 className="mb-3 text-lg font-semibold text-foreground">
                  Citation Analysis
                </h3>
                <div className="space-y-2">
                  <div>
                    • <strong>Citation count isn&apos;t everything:</strong>{" "}
                    High citations don&apos;t always mean high quality, and low
                    citations don&apos;t mean poor quality
                  </div>
                  <div>
                    • <strong>Time matters:</strong> Newer papers haven&apos;t
                    had time to accumulate citations
                  </div>
                  <div>
                    • <strong>Field differences:</strong> Some fields cite more
                    heavily than others
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
          {/* Who Is This For? */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
              Who Is This For?
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-primary/5 border-none shadow-none">
                <CardBody className="flex flex-col items-center text-center p-6">
                  <GraduationCap className="h-10 w-10 text-primary mb-4" />
                  <h4 className="font-semibold text-foreground mb-2">
                    PhD Students
                  </h4>
                  <p className="text-xs text-foreground/70">
                    Conduct deep literature reviews and find gaps in your thesis
                    field
                  </p>
                </CardBody>
              </Card>

              <Card className="bg-secondary/5 border-none shadow-none">
                <CardBody className="flex flex-col items-center text-center p-6">
                  <Building2 className="h-10 w-10 text-secondary mb-4" />
                  <h4 className="font-semibold text-foreground mb-2">
                    Institutions
                  </h4>
                  <p className="text-xs text-foreground/70">
                    Track faculty impact and build collaboration networks across
                    departments
                  </p>
                </CardBody>
              </Card>

              <Card className="bg-success/5 border-none shadow-none">
                <CardBody className="flex flex-col items-center text-center p-6">
                  <FlaskConical className="h-10 w-10 text-success mb-4" />
                  <h4 className="font-semibold text-foreground mb-2">
                    R&D Teams
                  </h4>
                  <p className="text-xs text-foreground/70">
                    Monitor emerging technology trends and perform competitive
                    intelligence
                  </p>
                </CardBody>
              </Card>

              <Card className="bg-warning/5 border-none shadow-none">
                <CardBody className="flex flex-col items-center text-center p-6">
                  <LayoutGrid className="h-10 w-10 text-warning mb-4" />
                  <h4 className="font-semibold text-foreground mb-2">
                    Research Groups
                  </h4>
                  <p className="text-xs text-foreground/70">
                    Collaborate on project collections and share unified
                    analysis insights
                  </p>
                </CardBody>
              </Card>
            </div>
          </div>

          {/* Our Commitment to Transparency */}
          <div className="mb-12">
            <Card className="border border-divider/50">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <GitBranch className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-semibold text-foreground">
                    Our Commitment to Transparency
                  </h2>
                </div>
              </CardHeader>
              <CardBody>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                  <div className="space-y-2">
                    <div className="font-medium text-sm text-foreground">
                      Open Source
                    </div>
                    <div className="text-xs text-foreground/70">
                      All code is publicly available for inspection and
                      improvement
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="font-medium text-sm text-foreground">
                      Clear Methodology
                    </div>
                    <div className="text-xs text-foreground/70">
                      Every analysis method is documented and explained
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="font-medium text-sm text-foreground">
                      No Hidden Algorithms
                    </div>
                    <div className="text-xs text-foreground/70">
                      All AI prompts and evaluation criteria are public
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="font-medium text-sm text-foreground">
                      Community Input
                    </div>
                    <div className="text-xs text-foreground/70">
                      We welcome feedback and contributions to improve the
                      system
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="font-medium text-sm text-foreground">
                      Continuous Improvement
                    </div>
                    <div className="text-xs text-foreground/70">
                      The system is designed to evolve and improve based on user
                      feedback
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Contact and Contributions */}
          <div>
            <Card className="border border-divider/50">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <Users className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-semibold text-foreground">
                    Contact and Contributions
                  </h2>
                </div>
              </CardHeader>
              <CardBody>
                <p className="text-foreground/80 leading-relaxed mb-4">
                  This system is designed to be a public good for the research
                  community. If you find issues, have suggestions, or want to
                  contribute improvements, please engage with our open-source
                  repository.
                </p>

                <p className="text-sm text-foreground/60 italic">
                  <strong>Disclaimer:</strong> This system is provided as-is for
                  research and educational purposes. While we strive for
                  accuracy and fairness, all AI-generated analyses should be
                  considered as one perspective among many in the research
                  evaluation process.
                </p>
              </CardBody>
            </Card>
          </div>

          {/* Floating Feedback Button */}
          <FeedbackButton tabName="methods" />
        </div>
      </div>
    </ProtectedRoute>
  );
}
