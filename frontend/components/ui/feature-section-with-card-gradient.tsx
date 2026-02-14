"use client";

import { useId } from "react";
import type { SVGProps } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Building2,
  FlaskConical,
  GraduationCap,
  Handshake,
  Library,
  Lightbulb,
  Search,
  Users,
} from "lucide-react";

type FeatureCard = {
  title: string;
  description: string;
  icon: LucideIcon;
  pattern?: number[][];
};

const defaultFeatures: FeatureCard[] = [
  {
    title: "Researchers & PhD Students",
    description:
      "Run focused literature reviews, identify gaps, and find seminal papers faster.",
    icon: GraduationCap,
    pattern: [
      [7, 1],
      [8, 2],
      [9, 4],
      [8, 5],
      [7, 3],
    ],
  },
  {
    title: "Academic Institutions",
    description:
      "Support faculty and students with a shared research workflow and measurable outcomes.",
    icon: Building2,
    pattern: [
      [9, 1],
      [10, 2],
      [8, 3],
      [9, 5],
      [10, 4],
    ],
  },
  {
    title: "R&D Teams",
    description:
      "Track emerging work and translate new findings into practical innovation signals.",
    icon: FlaskConical,
    pattern: [
      [8, 1],
      [7, 2],
      [9, 3],
      [10, 4],
      [8, 5],
    ],
  },
  {
    title: "Research Groups",
    description:
      "Coordinate analysis, share paper sets, and keep team interpretation aligned.",
    icon: Users,
    pattern: [
      [10, 1],
      [9, 2],
      [8, 3],
      [7, 4],
      [10, 5],
    ],
  },
  {
    title: "Library & Knowledge Teams",
    description:
      "Curate high-value references and improve discoverability across research domains.",
    icon: Library,
    pattern: [
      [7, 1],
      [9, 2],
      [10, 3],
      [8, 4],
      [7, 5],
    ],
  },
  {
    title: "Strategic Scouting",
    description:
      "Monitor fast-moving fields to detect promising opportunities and potential disruptions.",
    icon: Search,
    pattern: [
      [9, 1],
      [7, 2],
      [8, 3],
      [10, 4],
      [9, 5],
    ],
  },
  {
    title: "Innovation Programs",
    description:
      "Turn evidence into action with reusable templates for assessment and prioritization.",
    icon: Lightbulb,
    pattern: [
      [8, 1],
      [10, 2],
      [9, 3],
      [7, 4],
      [8, 5],
    ],
  },
  {
    title: "Cross-Functional Collaboration",
    description:
      "Bridge technical and non-technical stakeholders with clearer context and shared outputs.",
    icon: Handshake,
    pattern: [
      [10, 1],
      [8, 2],
      [7, 3],
      [9, 4],
      [10, 5],
    ],
  },
];

export function FeaturesSectionWithCardGradient({
  features = defaultFeatures,
}: {
  features?: FeatureCard[];
}) {
  return (
    <div className="py-2 lg:py-4">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
        {features.map((feature) => (
          <article
            key={feature.title}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-neutral-100 to-white p-6 dark:from-neutral-900 dark:to-neutral-950"
          >
            <Grid pattern={feature.pattern} size={20} />
            <feature.icon className="relative z-20 mb-4 h-5 w-5 text-neutral-700 dark:text-neutral-200" />
            <p className="relative z-20 text-base font-bold text-neutral-800 dark:text-white">
              {feature.title}
            </p>
            <p className="relative z-20 mt-4 text-base font-normal text-neutral-600 dark:text-neutral-400">
              {feature.description}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}

export function Grid({
  pattern,
  size,
}: {
  pattern?: number[][];
  size?: number;
}) {
  const squares =
    pattern ??
    ([
      [7, 1],
      [8, 2],
      [9, 3],
      [8, 4],
      [7, 5],
    ] as number[][]);

  return (
    <div className="pointer-events-none absolute left-1/2 top-0 -ml-20 -mt-2 h-full w-full [mask-image:linear-gradient(white,transparent)]">
      <div className="absolute inset-0 bg-gradient-to-r opacity-100 [mask-image:radial-gradient(farthest-side_at_top,white,transparent)] from-zinc-100/30 to-zinc-300/30 dark:from-zinc-900/30 dark:to-zinc-900/30">
        <GridPattern
          width={size ?? 20}
          height={size ?? 20}
          x="-12"
          y="4"
          squares={squares}
          className="absolute inset-0 h-full w-full fill-black/10 stroke-black/10 mix-blend-overlay dark:fill-white/10 dark:stroke-white/10"
        />
      </div>
    </div>
  );
}

type GridPatternProps = SVGProps<SVGSVGElement> & {
  width: number;
  height: number;
  x: string | number;
  y: string | number;
  squares?: number[][];
};

export function GridPattern({
  width,
  height,
  x,
  y,
  squares,
  ...props
}: GridPatternProps) {
  const patternId = useId();

  return (
    <svg aria-hidden="true" {...props}>
      <defs>
        <pattern
          id={patternId}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          x={x}
          y={y}
        >
          <path d={`M.5 ${height}V.5H${width}`} fill="none" />
        </pattern>
      </defs>
      <rect
        width="100%"
        height="100%"
        strokeWidth={0}
        fill={`url(#${patternId})`}
      />
      {squares ? (
        <svg x={x} y={y} className="overflow-visible">
          {squares.map(([squareX, squareY]) => (
            <rect
              key={`${squareX}-${squareY}`}
              strokeWidth="0"
              width={width + 1}
              height={height + 1}
              x={squareX * width}
              y={squareY * height}
            />
          ))}
        </svg>
      ) : null}
    </svg>
  );
}
