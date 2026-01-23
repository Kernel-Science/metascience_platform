"use client";

import React from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Progress } from "@heroui/progress";
import { Input } from "@heroui/input";
import { Tabs, Tab } from "@heroui/tabs";
import { Divider } from "@heroui/divider";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Upload,
  FileText,
  Star,
  CheckCircle,
  AlertCircle,
  Info,
  Download,
  Trash2,
  Link2,
} from "lucide-react";
import jsPDF from "jspdf";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

import { Navbar } from "@/components/navbar";
import { Message } from "@/components/research/Message";
import { FeedbackButton } from "@/components/feedback/FeedbackButton";
import { useReviewStore } from "@/lib/reviewStore";
import { EstimatedTimeIndicator } from "@/components/EstimatedTimeIndicator";
import { AnimatePresence } from "framer-motion";

// Call backend directly to avoid Next.js API route payload limits
const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

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

export default function ReviewPage() {
  // Use Zustand store instead of local state
  const {
    selectedFile,
    setSelectedFile,
    pdfUrl,
    setPdfUrl,
    fileName,
    setFileName,
    mimeType,
    setMimeType,
    paperTitle,
    setPaperTitle,
    loading,
    setLoading,
    error,
    setError,
    success,
    setSuccess,
    reviewResult,
    setReviewResult,
    saveReviewToSupabase,
  } = useReviewStore();

  // Control the "Provide your paper" tabs based on whether a URL is present
  // Use a string-typed state because the Tabs component expects string keys
  const [inputTab, setInputTab] = React.useState<string>("file");
  React.useEffect(() => {
    setInputTab(pdfUrl ? "url" : "file");
  }, [pdfUrl]);

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const showSuccessMessage = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(""), 5000);
  };

  const showErrorMessage = (message: string) => {
    setError(message);
    setTimeout(() => setError(""), 8000);
  };

  // Convert HTTP URLs to HTTPS to prevent mixed content errors
  const ensureHttps = (url: string): string => {
    try {
      const urlObj = new URL(url);
      if (urlObj.protocol === "http:") {
        urlObj.protocol = "https:";
      }
      return urlObj.toString();
    } catch {
      // If URL parsing fails, just return the original
      return url;
    }
  };

  // Derive a human friendly title from a URL (no network requests)
  const deriveTitleFromUrl = (url: string): string => {
    try {
      const u = new URL(url);
      // Use last path segment without query/hash and extension
      let base = decodeURIComponent(
        u.pathname.split("/").filter(Boolean).pop() || "",
      );
      if (!base) return "";
      base = base.replace(/\.[^./?#]+$/, ""); // drop extension
      // Replace separators with spaces and collapse multiple spaces
      base = base
        .replace(/[._-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      // Capitalize words
      base = base
        .split(" ")
        .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
        .join(" ");
      return base;
    } catch {
      return "";
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      const allowedExtensions = ["pdf", "tex", "txt", "docx", "md"];
      const fileExtension = file.name.split(".").pop()?.toLowerCase();

      if (!allowedExtensions.includes(fileExtension || "")) {
        showErrorMessage(
          `File type not supported. Allowed types: ${allowedExtensions.join(", ")}`,
        );
        return;
      }
      // Check file size (100MB limit for Render)
      const maxSizeInBytes = 100 * 1024 * 1024; // 100MB
      if (file.size > maxSizeInBytes) {
        showErrorMessage(
          `File size exceeds the 100MB limit. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`,
        );
        return;
      }

      setSelectedFile(file);
      setPdfUrl(null); // Clear URL when file is selected
      setPaperTitle("");
      setReviewResult(null);
      clearMessages();
    }
  };

  // Helper function to extract review data from different response formats
  const extractReviewData = (data: any): ReviewData | null => {
    // Handle Django model format (array with single object)
    if (
      Array.isArray(data.structured_data) &&
      data.structured_data.length > 0
    ) {
      const djangoModel = data.structured_data[0];

      if (djangoModel.fields) {
        return djangoModel.fields;
      }
    }

    // Handle direct Django model object
    if (data.structured_data && data.structured_data.fields) {
      return data.structured_data.fields;
    }

    // Handle direct review data
    if (data.structured_data && typeof data.structured_data === "object") {
      return data.structured_data;
    }

    return null;
  };

  const handleFileUpload = async () => {
    if (!selectedFile && !pdfUrl) {
      showErrorMessage("Please select a file or provide a PDF URL first");
      return;
    }

    setLoading(true);
    clearMessages();

    try {
      const formData = new FormData();

      if (selectedFile) {
        formData.append("file", selectedFile);
        setFileName(selectedFile.name);
        setMimeType(selectedFile.type || "application/pdf");
      } else if (pdfUrl) {
        // Download the PDF from URL and convert to File
        showSuccessMessage("Downloading PDF from URL...");

        try {
          // Ensure HTTPS to prevent mixed content errors
          const secureUrl = ensureHttps(pdfUrl);

          const response = await fetch(secureUrl, {
            mode: "cors",
            headers: {
              Accept: "application/pdf,*/*",
            },
          });

          if (!response.ok) {
            const errorMessage = `Failed to download PDF: ${response.status} ${response.statusText}`;
            // Instead of throwing, handle error gracefully (e.g., set error state or return)
            setError(errorMessage);
            setLoading(false);
            return;
          }

          const blob = await response.blob();

          // Create a proper filename for the PDF
          let fileNameFromUrl = pdfUrl.split("/").pop() || "paper";

          // Special handling for arXiv URLs and other URLs without .pdf extension
          if (!fileNameFromUrl.toLowerCase().endsWith(".pdf")) {
            fileNameFromUrl = fileNameFromUrl + ".pdf";
          }

          // Additional check to ensure we have a valid filename
          if (fileNameFromUrl === ".pdf" || fileNameFromUrl === "pdf") {
            fileNameFromUrl = "paper.pdf";
          }

          // Create a File object from the blob with proper PDF MIME type
          const file = new File([blob], fileNameFromUrl, {
            type: "application/pdf",
          });

          setFileName(file.name);
          setMimeType("application/pdf");
          formData.append("file", file);
          clearMessages();
        } catch (downloadError) {
          showErrorMessage(
            `Failed to download PDF: ${
              downloadError instanceof Error
                ? downloadError.message
                : "Unknown error"
            }`,
          );
          setLoading(false);
          return;
        }
      }

      const response = await fetch(`${API_BASE_URL}/api/review/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

        try {
          const errorData = await response.json();
          errorMessage = `Review failed: ${errorData.detail || errorData.message || response.statusText}`;
        } catch {
          // If JSON parsing fails, use the default error message
        }

        showErrorMessage(errorMessage);
        return;
      }

      const data = await response.json();

      // Validate the response structure
      if (!data || typeof data !== "object") {
        showErrorMessage("Invalid response format received from server");
        return;
      }

      // Extract review data using the helper function
      const rd = extractReviewData(data);

      if (rd) {
        const result: ReviewResult = {
          success: true,
          raw_response: data.raw_response,
          structured_data: rd,
          file_name:
            data.file_name ||
            fileName ||
            selectedFile?.name ||
            (pdfUrl
              ? new URL(pdfUrl).pathname.split("/").pop() || "PDF from URL"
              : "Unknown"),
          mime_type:
            data.mime_type ||
            mimeType ||
            selectedFile?.type ||
            "application/pdf",
        };

        setReviewResult(result);
        // If server provided a true paper title, persist it
        if (typeof rd.paper === "string" && rd.paper.trim()) {
          setPaperTitle(String(rd.paper));
        }

        // Save review to Supabase
        try {
          await saveReviewToSupabase();
        } catch {
          // Silently handle save errors - review was successful
        }
      } else if (data.success !== false) {
        // Fallback: try to adapt direct data to our expected format
        const adaptedStructured = {
          paper:
            data.paper ||
            (selectedFile?.name
              ? selectedFile.name.replace(/\.[^/.]+$/, "")
              : pdfUrl
                ? deriveTitleFromUrl(pdfUrl) || "Paper from URL"
                : "Unknown Paper"),
          reviewer: data.reviewer || "AI Reviewer",
          status: data.status || "completed",
          formal_correctness: data.formal_correctness || 0,
          reproducibility: data.reproducibility || 0,
          impact: data.impact || 0,
          novelty: data.novelty || 0,
          writing_clarity: data.writing_clarity || 0,
          writing_grammar: data.writing_grammar || 0,
          writing_fairness: data.writing_fairness || 0,
          interdisciplinarity: data.interdisciplinarity || 0,
          review_text:
            data.review_text || data.review || "No review text available",
          confidence: data.confidence,
        } as ReviewData;

        const adaptedData: ReviewResult = {
          success: true,
          structured_data: adaptedStructured,
          file_name:
            data.file_name ||
            fileName ||
            selectedFile?.name ||
            (pdfUrl
              ? new URL(pdfUrl).pathname.split("/").pop() || "PDF from URL"
              : "Unknown"),
          mime_type:
            data.mime_type ||
            mimeType ||
            selectedFile?.type ||
            "application/pdf",
        };

        setReviewResult(adaptedData);
        // Persist title
        if (typeof adaptedStructured.paper === "string") {
          setPaperTitle(adaptedStructured.paper);
        }

        // Save review to Supabase
        try {
          await saveReviewToSupabase();
        } catch {
          // Silently handle save errors - review was successful
        }
      } else {
        showErrorMessage(
          `Assessment failed: ${data.message || data.detail || "Unknown error"}`,
        );
        return;
      }

      showSuccessMessage("Paper assessment completed successfully!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      showErrorMessage(`Error processing request: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number, maxScore: number = 5) => {
    const normalizedScore = score / maxScore;

    if (normalizedScore >= 0.8) return "success";
    if (normalizedScore >= 0.6) return "warning";
    if (normalizedScore >= 0.4) return "secondary";

    return "danger";
  };

  const getScoreIcon = (score: number, maxScore: number = 5) => {
    const normalizedScore = score / maxScore;

    if (normalizedScore >= 0.8) return <CheckCircle className="w-4 h-4" />;
    if (normalizedScore >= 0.6) return <Info className="w-4 h-4" />;

    return <AlertCircle className="w-4 h-4" />;
  };

  // Helper function to check if structured_data is ReviewData
  const isReviewData = (data: any): data is ReviewData => {
    return data && typeof data === "object" && "review_text" in data;
  };

  // Helper function to get review data safely
  const getReviewData = (): ReviewData | null => {
    if (!reviewResult?.structured_data) return null;

    if (isReviewData(reviewResult.structured_data)) {
      return reviewResult.structured_data;
    }

    // Handle DjangoModelResponse
    if ("fields" in reviewResult.structured_data) {
      return (reviewResult.structured_data as DjangoModelResponse).fields;
    }

    return null;
  };

  // Small score card component
  const renderScoreCard = (
    label: string,
    score: number,
    maxScore: number = 5,
  ) => (
    <Card className="h-full">
      <CardBody className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-foreground">{label}</h4>
          <Chip
            color={getScoreColor(score || 0, maxScore)}
            startContent={getScoreIcon(score || 0, maxScore)}
            variant="flat"
          >
            {(score || 0).toFixed(1)}/{maxScore}
          </Chip>
        </div>
        <Progress
          color={getScoreColor(score || 0, maxScore)}
          value={((score || 0) / maxScore) * 100}
        />
      </CardBody>
    </Card>
  );

  // PDF Download functionality
  const generateReviewPDF = () => {
    const reviewData = getReviewData();
    if (!reviewData || !reviewResult) return;

    try {
      // Create new PDF document
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - 2 * margin;
      let currentY = margin;

      // Color palette - modern and professional
      const colors = {
        primary: [59, 130, 246] as [number, number, number], // Blue
        primaryLight: [219, 234, 254] as [number, number, number], // Light blue
        success: [34, 197, 94] as [number, number, number], // Green
        warning: [251, 146, 60] as [number, number, number], // Orange
        danger: [239, 68, 68] as [number, number, number], // Red
        dark: [30, 41, 59] as [number, number, number], // Dark slate
        mediumGray: [100, 116, 139] as [number, number, number], // Medium gray
        lightGray: [241, 245, 249] as [number, number, number], // Light gray
        white: [255, 255, 255] as [number, number, number],
      };

      // Helper function to add text with word wrap
      const addWrappedText = (
        text: string,
        x: number,
        y: number,
        maxWidth: number,
        fontSize: number = 12,
      ) => {
        doc.setFontSize(fontSize);
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, x, y);
        return y + lines.length * fontSize * 0.5;
      };

      // Helper function to check if we need a new page
      const checkNewPage = (requiredSpace: number) => {
        if (currentY + requiredSpace > pageHeight - margin - 15) {
          doc.addPage();
          currentY = margin;
          return true;
        }
        return false;
      };

      // Helper function to add a section header
      const addSectionHeader = (title: string) => {
        checkNewPage(25);

        // Background rectangle for section header
        doc.setFillColor(...colors.primaryLight);
        doc.roundedRect(
          margin - 5,
          currentY - 5,
          contentWidth + 10,
          14,
          2,
          2,
          "F",
        );

        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(...colors.primary);
        doc.text(title, margin, currentY + 5);

        currentY += 20;
      };

      // Helper function to convert image to base64
      const imageToBase64 = (url: string): Promise<string> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);
            resolve(canvas.toDataURL());
          };
          img.onerror = reject;
          img.src = url;
        });
      };

      // Helper function to get score color
      const getScoreColorRGB = (
        score: number,
        maxScore: number,
      ): [number, number, number] => {
        const normalized = score / maxScore;
        if (normalized >= 0.8) return colors.success;
        if (normalized >= 0.6) return colors.warning;
        if (normalized >= 0.4) return colors.primary;
        return colors.danger;
      };

      // Load and add header
      const addHeader = async () => {
        try {
          // Load logos
          const [fqxiLogo, kernelLogo] = await Promise.all([
            imageToBase64("/FQXILogo.svg").catch(() => null),
            imageToBase64("/kernellogo.png").catch(() => null),
          ]);

          // Modern gradient-like header background
          doc.setFillColor(...colors.primary);
          doc.rect(0, 0, pageWidth, 50, "F");

          doc.setFillColor(79, 150, 255); // Lighter shade
          doc.rect(0, 0, pageWidth, 25, "F");

          // Add logos if they loaded successfully
          if (fqxiLogo) {
            const fqxiWidth = 32;
            const fqxiHeight = 16;
            doc.addImage(fqxiLogo, "PNG", margin, 8, fqxiWidth, fqxiHeight);
          }

          if (kernelLogo) {
            const kernelWidth = 22;
            const kernelHeight = 22;
            doc.addImage(
              kernelLogo,
              "PNG",
              pageWidth - margin - kernelWidth,
              7,
              kernelWidth,
              kernelHeight,
            );
          }

          // Title
          doc.setFont("helvetica", "bold");
          doc.setFontSize(20);
          doc.setTextColor(...colors.white);
          doc.text("AI PAPER ASSESSMENT", pageWidth / 2, 20, {
            align: "center",
          });

          // Subtitle
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(230, 240, 255);
          doc.text(
            "Comprehensive Research Analysis Report",
            pageWidth / 2,
            30,
            {
              align: "center",
            },
          );

          // Date and page indicator box
          doc.setFillColor(...colors.white);
          doc.roundedRect(margin, 38, contentWidth, 10, 2, 2, "F");

          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(...colors.mediumGray);
          doc.text(
            `Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
            margin + 2,
            44,
          );
          doc.text(
            `Status: ${reviewData.status.toUpperCase()}`,
            pageWidth - margin - 2,
            44,
            { align: "right" },
          );

          currentY = 56;

          return true;
        } catch {
          // Fallback to simpler header (logo loading failed)

          doc.setFillColor(...colors.primary);
          doc.rect(0, 0, pageWidth, 45, "F");

          doc.setFont("helvetica", "bold");
          doc.setFontSize(22);
          doc.setTextColor(...colors.white);
          doc.text("AI PAPER ASSESSMENT", pageWidth / 2, 25, {
            align: "center",
          });

          currentY = 52;
          return false;
        }
      };

      // Execute header creation and continue with PDF generation
      addHeader().then(() => {
        // Paper Information Section
        addSectionHeader("Paper Information");

        // Paper title in a highlighted box
        doc.setFillColor(...colors.lightGray);
        doc.roundedRect(margin, currentY - 3, contentWidth, 18, 2, 2, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...colors.dark);
        doc.text("Title:", margin + 3, currentY + 3);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        const titleLines = doc.splitTextToSize(
          String(reviewData.paper),
          contentWidth - 30,
        );
        doc.text(titleLines, margin + 3, currentY + 10);
        currentY += Math.max(18, titleLines.length * 5 + 8);

        // Metadata in two columns
        const leftCol = margin;
        const rightCol = pageWidth / 2 + 5;
        const metaY = currentY;

        // Left column
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(...colors.mediumGray);
        doc.text("FILE NAME", leftCol, metaY);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...colors.dark);
        const shortFileName =
          reviewResult.file_name.length > 35
            ? reviewResult.file_name.substring(0, 32) + "..."
            : reviewResult.file_name;
        doc.text(shortFileName, leftCol, metaY + 5);

        doc.setFont("helvetica", "bold");
        doc.setTextColor(...colors.mediumGray);
        doc.text("REVIEWER", leftCol, metaY + 13);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...colors.dark);
        doc.text(String(reviewData.reviewer), leftCol, metaY + 18);

        // Right column
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...colors.mediumGray);
        doc.text("REVIEW DATE", rightCol, metaY);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...colors.dark);
        const reviewDate =
          reviewData.review_date || new Date().toLocaleDateString();
        doc.text(reviewDate, rightCol, metaY + 5);

        if (reviewData.confidence !== undefined) {
          doc.setFont("helvetica", "bold");
          doc.setTextColor(...colors.mediumGray);
          doc.text("AI CONFIDENCE", rightCol, metaY + 13);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(...colors.dark);
          const confidencePct = (reviewData.confidence * 10).toFixed(0);
          doc.text(`${confidencePct}%`, rightCol, metaY + 18);
        }

        currentY = metaY + 30;

        // Overall Score Section with visual emphasis
        checkNewPage(50);

        // Calculate overall score
        const scoreCategories = [
          {
            label: "Formal Correctness",
            score: reviewData.formal_correctness,
            max: 4,
          },
          {
            label: "Reproducibility",
            score: reviewData.reproducibility,
            max: 4,
          },
          { label: "Impact", score: reviewData.impact, max: 3 },
          { label: "Novelty", score: reviewData.novelty, max: 5 },
          {
            label: "Writing Clarity",
            score: reviewData.writing_clarity,
            max: 4,
          },
          {
            label: "Writing Grammar",
            score: reviewData.writing_grammar,
            max: 3,
          },
          {
            label: "Writing Fairness",
            score: reviewData.writing_fairness,
            max: 3,
          },
          {
            label: "Interdisciplinarity",
            score: reviewData.interdisciplinarity,
            max: 4,
          },
        ];

        const totalScore = scoreCategories.reduce(
          (sum, cat) => sum + (cat.score || 0),
          0,
        );
        const maxTotalScore = scoreCategories.reduce(
          (sum, cat) => sum + cat.max,
          0,
        );
        const overallPercentage = (totalScore / maxTotalScore) * 100;
        const overallColor = getScoreColorRGB(overallPercentage, 100);

        // Overall score box - prominent
        doc.setFillColor(...overallColor);
        doc.roundedRect(margin, currentY, contentWidth, 22, 3, 3, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(...colors.white);
        doc.text("OVERALL SCORE", pageWidth / 2, currentY + 8, {
          align: "center",
        });

        doc.setFontSize(24);
        doc.text(
          `${overallPercentage.toFixed(1)}%`,
          pageWidth / 2,
          currentY + 18,
          { align: "center" },
        );

        currentY += 30;

        // Detailed Scores Section
        addSectionHeader("Detailed Evaluation");

        // Score cards in a grid layout
        let pairYPosition = currentY; // Track Y position for card pairs
        scoreCategories.forEach((category, index) => {
          if (index % 2 === 0 && index > 0) {
            currentY += 2; // Add spacing between rows
          }

          checkNewPage(30);

          const isLeft = index % 2 === 0;
          const xPos = isLeft ? margin : pageWidth / 2 + 3;
          const cardWidth = (contentWidth - 6) / 2;
          const normalizedScore = (category.score || 0) / category.max;
          const scoreColor = getScoreColorRGB(
            category.score || 0,
            category.max,
          );

          if (isLeft) {
            // Save Y position for the pair
            pairYPosition = currentY;
          }

          const cardY = isLeft ? currentY : pairYPosition;

          // Card background
          doc.setFillColor(...colors.lightGray);
          doc.roundedRect(xPos, cardY, cardWidth, 24, 2, 2, "F");

          // Category label
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9.5);
          doc.setTextColor(...colors.dark);
          doc.text(category.label, xPos + 3, cardY + 6);

          // Score badge
          doc.setFillColor(...scoreColor);
          doc.roundedRect(xPos + 3, cardY + 9, 20, 8, 1, 1, "F");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(...colors.white);
          doc.text(
            `${(category.score || 0).toFixed(1)}`,
            xPos + 13,
            cardY + 15,
            { align: "center" },
          );

          doc.setFontSize(7);
          doc.setTextColor(...colors.white);
          doc.text(`/${category.max}`, xPos + 19, cardY + 15);

          // Progress bar
          const barWidth = cardWidth - 32;
          const barX = xPos + 26;
          const barY = cardY + 11;
          const barHeight = 4;

          // Background bar
          doc.setFillColor(200, 200, 200);
          doc.roundedRect(barX, barY, barWidth, barHeight, 1, 1, "F");

          // Filled bar
          doc.setFillColor(...scoreColor);
          doc.roundedRect(
            barX,
            barY,
            barWidth * normalizedScore,
            barHeight,
            1,
            1,
            "F",
          );

          // Percentage
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(...colors.mediumGray);
          doc.text(
            `${(normalizedScore * 100).toFixed(0)}%`,
            xPos + cardWidth - 3,
            cardY + 22,
            { align: "right" },
          );

          if (!isLeft) {
            currentY = cardY + 28;
          }
        });

        currentY += 5;

        // Assessment Text Section
        addSectionHeader("Detailed Assessment");

        // Clean the assessment text
        let cleanReviewText =
          reviewData.review_text || "No detailed assessment available.";
        cleanReviewText = cleanReviewText
          .replace(/#{1,6}\s/g, "")
          .replace(/\*\*(.*?)\*\*/g, "$1")
          .replace(/\*(.*?)\*/g, "$1")
          .replace(/`(.*?)`/g, "$1")
          .replace(/^\s*[-*+]\s/gm, "• ")
          .replace(/^\s*\d+\.\s/gm, "• ")
          .trim();

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(...colors.dark);

        // Split into paragraphs
        const paragraphs = cleanReviewText.split("\n\n");

        paragraphs.forEach((paragraph) => {
          if (paragraph.trim()) {
            checkNewPage(20);

            // Alternate background for readability
            if (paragraph.startsWith("• ")) {
              doc.setFillColor(250, 251, 252);
              const lines = doc.splitTextToSize(
                paragraph.trim(),
                contentWidth - 6,
              );
              const blockHeight = lines.length * 5 + 4;
              doc.roundedRect(
                margin,
                currentY - 2,
                contentWidth,
                blockHeight,
                1,
                1,
                "F",
              );
            }

            currentY = addWrappedText(
              paragraph.trim(),
              margin + 3,
              currentY + 2,
              contentWidth - 6,
              10,
            );
            currentY += 6;
          }
        });

        // Footer for all pages
        const totalPages = doc.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          doc.setPage(i);

          // Footer background
          doc.setFillColor(...colors.lightGray);
          doc.rect(0, pageHeight - 15, pageWidth, 15, "F");

          // Footer line
          doc.setDrawColor(...colors.primary);
          doc.setLineWidth(0.5);
          doc.line(
            margin,
            pageHeight - 14,
            pageWidth - margin,
            pageHeight - 14,
          );

          // Footer text
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(...colors.mediumGray);
          doc.text(
            "AI Paper Assessment System - Powered by Advanced Machine Learning",
            pageWidth / 2,
            pageHeight - 7,
            { align: "center" },
          );

          doc.setFontSize(7);
          doc.text(
            `Page ${i} of ${totalPages}`,
            pageWidth - margin,
            pageHeight - 7,
            { align: "right" },
          );
        }

        // Generate filename
        const paperName = String(reviewData.paper)
          .replace(/[^a-zA-Z0-9]/g, "_")
          .substring(0, 30);
        const filename = `Assessment_${paperName}_${new Date().toISOString().split("T")[0]}.pdf`;

        // Save the PDF
        doc.save(filename);

        showSuccessMessage("Enhanced PDF assessment downloaded successfully!");
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error generating PDF:", error);
      // Error generating PDF
    }
  };

  // Helper: clear file/url selection
  const clearSelection = () => {
    setSelectedFile(null);
    setPdfUrl(null);
    setPaperTitle("");
    setFileName("");
    setMimeType("");
    setReviewResult(null);
  };

  // Compute display title for header to avoid nested ternaries in JSX
  const reviewData = getReviewData();
  const displayTitle = reviewData?.paper
    ? String(reviewData.paper)
    : paperTitle
      ? paperTitle
      : selectedFile
        ? selectedFile.name.replace(/\.[^/.]+$/, "")
        : pdfUrl
          ? deriveTitleFromUrl(pdfUrl) || "PDF from URL"
          : "Upload a file or enter a URL to begin.";

  // Derive chip color for AI confidence to keep JSX clean and avoid multiline ternaries
  let confidenceColor: "success" | "warning" | "danger" | undefined = undefined;
  if (reviewData?.confidence !== undefined) {
    const pct = reviewData.confidence * 10;
    if (pct >= 80) confidenceColor = "success";
    else if (pct >= 60) confidenceColor = "warning";
    else confidenceColor = "danger";
  }

  // Estimate time based on file size or URL heuristics
  const [estimatedSeconds, setEstimatedSeconds] = React.useState<number>(60);

  React.useEffect(() => {
    // Default base time
    let base = 45; // seconds

    if (selectedFile) {
      // Add 0.1s per KB as rough estimate
      const kb = Math.max(1, Math.round(selectedFile.size / 1024));
      base = Math.min(300, Math.round(20 + kb * 0.08));
    } else if (pdfUrl) {
      base = 60; // downloading and processing from URL may take longer
    }

    setEstimatedSeconds(base);
  }, [selectedFile, pdfUrl]);

  const _formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  return (
    <ProtectedRoute>
      <main className="flex flex-col min-h-screen bg-background">
        <Navbar />

        <div className="flex-1 container mx-auto px-4 py-10 md:py-16 pt-36 md:pt-44">
          {/* Messages */}
          <Message
            error={error}
            success={success}
            onClearMessagesAction={clearMessages}
          />

          {/* Top Section: Title */}
          <div className="mb-6 md:mb-10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/15 text-primary">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                    Paper Assessment
                  </h1>
                  <Chip
                    color="warning"
                    variant="flat"
                    size="sm"
                    className="font-semibold"
                  >
                    ALPHA
                  </Chip>
                </div>
                <p className="text-sm md:text-base text-muted-foreground">
                  Upload a paper or provide a URL to get a structured AI
                  assessment.
                </p>
              </div>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Input Column */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="h-full">
                <CardHeader className="pb-0">
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">
                      Provide your paper
                    </h3>
                  </div>
                </CardHeader>
                <CardBody className="pt-4">
                  <Tabs
                    aria-label="paper-input"
                    variant="underlined"
                    className="w-full"
                    selectedKey={inputTab}
                    onSelectionChange={(key) => setInputTab(String(key))}
                  >
                    <Tab key="file" title="Upload file">
                      <div className="space-y-4">
                        <label htmlFor="paperFile" className="block">
                          <input
                            id="paperFile"
                            type="file"
                            accept=".pdf,.tex,.txt,.docx,.md"
                            className="hidden"
                            onChange={handleFileSelect}
                          />
                          <Button
                            as={"label"}
                            htmlFor="paperFile"
                            color="primary"
                            variant="solid"
                            fullWidth
                            startContent={<Upload className="w-4 h-4" />}
                          >
                            Choose file
                          </Button>
                        </label>

                        {selectedFile && (
                          <Card className="bg-content2">
                            <CardBody className="py-3 px-4">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="p-2 bg-primary/15 rounded-md">
                                    <FileText className="w-4 h-4 text-primary" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">
                                      {selectedFile.name.replace(
                                        /\.[^/.]+$/,
                                        "",
                                      )}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {(
                                        selectedFile.size /
                                        1024 /
                                        1024
                                      ).toFixed(2)}{" "}
                                      MB
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  color="danger"
                                  variant="flat"
                                  isDisabled={loading}
                                  startContent={<Trash2 className="w-4 h-4" />}
                                  onPress={clearSelection}
                                >
                                  Clear
                                </Button>
                              </div>
                            </CardBody>
                          </Card>
                        )}
                      </div>
                    </Tab>
                    <Tab key="url" title="From URL">
                      <div className="space-y-4">
                        <Input
                          type="url"
                          label="PDF URL"
                          placeholder="https://example.com/paper.pdf"
                          startContent={
                            <Link2 className="w-4 h-4 text-muted-foreground" />
                          }
                          value={pdfUrl ?? ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            setPdfUrl(value);
                            setPaperTitle(
                              value ? deriveTitleFromUrl(value) : "",
                            );
                            if (selectedFile) setSelectedFile(null);
                          }}
                        />
                        {pdfUrl && !selectedFile && (
                          <Card className="bg-content2">
                            <CardBody className="py-3 px-4">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="p-2 bg-primary/15 rounded-md">
                                    <FileText className="w-4 h-4 text-primary" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">
                                      {paperTitle || "PDF from URL"}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      From URL
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  color="danger"
                                  variant="flat"
                                  isDisabled={loading}
                                  startContent={<Trash2 className="w-4 h-4" />}
                                  onPress={clearSelection}
                                >
                                  Clear
                                </Button>
                              </div>
                            </CardBody>
                          </Card>
                        )}
                      </div>
                    </Tab>
                  </Tabs>

                  <Divider className="my-6" />

                  <Button
                    className="w-full"
                    color="primary"
                    size="lg"
                    disabled={(!selectedFile && !pdfUrl) || loading}
                    onPress={handleFileUpload}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Assessing...
                      </>
                    ) : (
                      "Assess Paper"
                    )}
                  </Button>

                  {/* Immediate feedback: estimated time shown under the Assess button */}
                  <AnimatePresence>
                    <div className="mt-4">
                      <EstimatedTimeIndicator
                        analysisType="assessment"
                        estimatedSeconds={estimatedSeconds}
                        isVisible={loading}
                      />
                    </div>
                  </AnimatePresence>

                  <p className="text-xs text-muted-foreground mt-3">
                    Supported: PDF, LaTeX, TXT, DOCX, MD
                  </p>
                </CardBody>
              </Card>
            </div>

            {/* Right: Results Column */}
            <div className="lg:col-span-8 space-y-6">
              {/* Results Header */}
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
                  <div className="w-full py-2">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <h2 className="text-xl md:text-2xl font-bold text-foreground">
                          {reviewData
                            ? "Assessment ready"
                            : "No assessment yet"}
                        </h2>
                        <p className="text-sm text-muted-foreground truncate">
                          {displayTitle}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {reviewData?.status && (
                          <Chip color="primary" variant="flat">
                            {reviewData.status}
                          </Chip>
                        )}
                        {reviewData?.reviewer && (
                          <Chip color="secondary" variant="flat">
                            Assessed by {String(reviewData.reviewer)}
                          </Chip>
                        )}
                        {reviewData?.confidence !== undefined && (
                          <Chip
                            color={confidenceColor}
                            variant="flat"
                            startContent={<Star className="w-4 h-4" />}
                          >
                            AI Confidence{" "}
                            {(reviewData.confidence * 10).toFixed(0)}%
                          </Chip>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardBody>
                  {reviewData ? (
                    <div className="space-y-8">
                      {/* Quick Overall Score */}
                      {(() => {
                        const scores = [
                          { v: reviewData.formal_correctness, m: 4 },
                          { v: reviewData.reproducibility, m: 4 },
                          { v: reviewData.impact, m: 3 },
                          { v: reviewData.novelty, m: 5 },
                          { v: reviewData.writing_clarity, m: 4 },
                          { v: reviewData.writing_grammar, m: 3 },
                          { v: reviewData.writing_fairness, m: 3 },
                          { v: reviewData.interdisciplinarity, m: 4 },
                        ];
                        const total = scores.reduce(
                          (s, x) => s + (x.v || 0),
                          0,
                        );
                        const max = scores.reduce((s, x) => s + x.m, 0);
                        const pct = max > 0 ? (total / max) * 100 : 0;
                        return (
                          <Card className="bg-content2">
                            <CardBody className="py-5 px-6">
                              <div className="flex items-center justify-between gap-4 flex-wrap">
                                <div className="flex items-center gap-3">
                                  <Star className="w-5 h-5 text-primary" />
                                  <h4 className="font-semibold text-foreground">
                                    Overall Score
                                  </h4>
                                </div>
                                <Chip
                                  color={
                                    pct >= 80
                                      ? "success"
                                      : pct >= 60
                                        ? "warning"
                                        : pct >= 40
                                          ? "secondary"
                                          : "danger"
                                  }
                                  variant="flat"
                                >
                                  {pct.toFixed(1)}%
                                </Chip>
                              </div>
                              <Progress
                                className="mt-3"
                                value={pct}
                                color={
                                  pct >= 80
                                    ? "success"
                                    : pct >= 60
                                      ? "warning"
                                      : pct >= 40
                                        ? "secondary"
                                        : "danger"
                                }
                              />
                            </CardBody>
                          </Card>
                        );
                      })()}

                      <Tabs aria-label="results" variant="underlined">
                        <Tab key="overview" title="Overview">
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {renderScoreCard(
                              "Formal Correctness",
                              reviewData.formal_correctness,
                              4,
                            )}
                            {renderScoreCard(
                              "Reproducibility",
                              reviewData.reproducibility,
                              4,
                            )}
                            {renderScoreCard("Impact", reviewData.impact, 3)}
                            {renderScoreCard("Novelty", reviewData.novelty, 5)}
                            {renderScoreCard(
                              "Writing Clarity",
                              reviewData.writing_clarity,
                              4,
                            )}
                            {renderScoreCard(
                              "Writing Grammar",
                              reviewData.writing_grammar,
                              3,
                            )}
                            {renderScoreCard(
                              "Writing Fairness",
                              reviewData.writing_fairness,
                              3,
                            )}
                            {renderScoreCard(
                              "Interdisciplinarity",
                              reviewData.interdisciplinarity,
                              4,
                            )}
                          </div>
                        </Tab>
                        <Tab key="assessment" title="Assessment">
                          <Card>
                            <CardBody className="p-6">
                              <div className="prose prose-gray dark:prose-invert max-w-none">
                                {reviewData.review_text ? (
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {reviewData.review_text}
                                  </ReactMarkdown>
                                ) : (
                                  <p className="mb-6 text-muted-foreground italic">
                                    No detailed assessment text available.
                                  </p>
                                )}
                              </div>
                            </CardBody>
                          </Card>
                        </Tab>
                        <Tab key="export" title="Export">
                          <div className="flex flex-col items-start gap-3">
                            <Button
                              color="secondary"
                              startContent={<Download className="w-5 h-5" />}
                              onPress={generateReviewPDF}
                            >
                              Download PDF Report
                            </Button>
                            <p className="text-xs text-muted-foreground">
                              The report includes scores, metadata, and the full
                              assessment.
                            </p>
                          </div>
                        </Tab>
                      </Tabs>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-muted-foreground">
                      <p className="mb-2 font-medium">No results yet</p>
                      <p className="text-sm">
                        Start by uploading a file or entering a PDF URL, then
                        click Assess Paper.
                      </p>
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>
          </div>
        </div>

        {/* Floating Feedback Button */}
        <FeedbackButton tabName="review" />
      </main>
    </ProtectedRoute>
  );
}
