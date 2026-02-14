import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

function Feature() {
  return (
    <div className="w-full py-20 lg:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start gap-4 py-8 lg:py-12">
          <div>
            <Badge>How It Works</Badge>
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl tracking-tighter md:text-5xl lg:max-w-xl">
              Analyze Research With Confidence
            </h2>
            <p className="max-w-xl text-lg leading-relaxed tracking-tight text-muted-foreground lg:max-w-xl">
              Go from paper discovery to insight generation in a clear,
              repeatable workflow.
            </p>
          </div>
          <div className="flex w-full flex-col gap-10 pt-8">
            <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex w-full flex-row items-start gap-4">
                <Check className="mt-1 h-4 w-4 text-primary" />
                <div className="flex flex-col gap-1">
                  <p>Search and discover papers</p>
                  <p className="text-sm text-muted-foreground">
                    Find relevant literature by DOI, keyword, or topic across a
                    large scholarly index.
                  </p>
                </div>
              </div>
              <div className="flex flex-row items-start gap-4">
                <Check className="mt-1 h-4 w-4 text-primary" />
                <div className="flex flex-col gap-1">
                  <p>Map citation networks</p>
                  <p className="text-sm text-muted-foreground">
                    Explore relationships, identify key nodes, and understand
                    influence patterns.
                  </p>
                </div>
              </div>
              <div className="flex flex-row items-start gap-4">
                <Check className="mt-1 h-4 w-4 text-primary" />
                <div className="flex flex-col gap-1">
                  <p>Generate AI insights</p>
                  <p className="text-sm text-muted-foreground">
                    Surface trends, blind spots, and emerging signals in your
                    field.
                  </p>
                </div>
              </div>
              <div className="flex w-full flex-row items-start gap-4">
                <Check className="mt-1 h-4 w-4 text-primary" />
                <div className="flex flex-col gap-1">
                  <p>Review source evidence</p>
                  <p className="text-sm text-muted-foreground">
                    Keep conclusions grounded with direct links back to the
                    primary literature.
                  </p>
                </div>
              </div>
              <div className="flex flex-row items-start gap-4">
                <Check className="mt-1 h-4 w-4 text-primary" />
                <div className="flex flex-col gap-1">
                  <p>Export and share outputs</p>
                  <p className="text-sm text-muted-foreground">
                    Save findings and distribute reports to collaborators in
                    minutes.
                  </p>
                </div>
              </div>
              <div className="flex flex-row items-start gap-4">
                <Check className="mt-1 h-4 w-4 text-primary" />
                <div className="flex flex-col gap-1">
                  <p>Scale your research process</p>
                  <p className="text-sm text-muted-foreground">
                    Reuse a consistent workflow from quick checks to deep
                    metascience analysis.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { Feature };
