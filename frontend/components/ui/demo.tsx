import { Feature } from "@/components/ui/feature-with-advantages";
import { FeaturesSectionWithCardGradient } from "@/components/ui/feature-section-with-card-gradient";
import { BentoGrid, type BentoItem } from "@/components/ui/bento-grid";

function FeatureDemo() {
  return (
    <div className="block">
      <Feature />
    </div>
  );
}

function FeaturesSectionWithCardGradientDemo() {
  return (
    <div className="min-h-screen w-full">
      <div className="absolute left-0 top-0 w-full">
        <FeaturesSectionWithCardGradient />
      </div>
    </div>
  );
}

const itemsSample: BentoItem[] = [
  {
    eyebrow: "Access 2.3M+ scholarly papers",
    title: "Comprehensive Data Coverage",
    description:
      "A large collection of scholarly papers representing comprehensive data coverage",
    image:
      "https://images.unsplash.com/photo-1556033368-8a5d814918f3?q=80&w=1471&auto=format&fit=crop",
  },
  {
    eyebrow: "Advanced Analysis",
    title: "AI-Driven Insights",
    description:
      "Abstract visualization of neural networks representing AI-driven research insights",
    image:
      "https://images.unsplash.com/photo-1675000971728-32e5470fb1c0?q=80&w=1470&auto=format&fit=crop",
  },
  {
    eyebrow: "Visualize citation patterns",
    title: "Citation Network Analysis",
    description:
      "Complex node-based citation network visualization",
    image:
      "https://static.vecteezy.com/system/resources/previews/005/678/621/non_2x/purple-network-plexus-line-background-concept-pattern-with-light-polygon-elements-and-nodes-minimal-space-design-vector.jpg",
  },
  {
    eyebrow: "Spot emerging research topics",
    title: "Trend Discovery",
    description:
      "Data visualization chart showing emerging research trends",
    colSpan: 1,
    image:
      "https://images.unsplash.com/photo-1666875753105-c63a6f3bdc86?q=80&w=1473&auto=format&fit=crop",
  },
  {
    eyebrow: "User-Centric Design",
    title: "Intuitive and Customizable interface",
    description:
      "Experience a seamless research workflow with a modern interface designed for deep scientific exploration and data-driven discovery.",
    colSpan: 2,
    image:
      "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?q=80&w=1470&auto=format&fit=crop",
  },
];

function BentoGridDemo() {
  return <BentoGrid items={itemsSample} />;
}

export { FeatureDemo, FeaturesSectionWithCardGradientDemo, BentoGridDemo };
