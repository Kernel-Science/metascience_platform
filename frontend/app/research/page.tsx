"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ResearchPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the search page by default
    router.replace("/research/search");
  }, [router]);

  return (
    <div className="brand-app-shell flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-foreground" />
        <p className="mt-4 text-foreground/70">Redirecting...</p>
      </div>
    </div>
  );
}
