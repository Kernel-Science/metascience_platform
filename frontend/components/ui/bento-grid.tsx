"use client";

import { cn } from "@/lib/utils";

export interface BentoItem {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  colSpan?: number;
}

interface BentoGridProps {
  items?: BentoItem[];
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
];

function BentoGrid({ items = itemsSample }: BentoGridProps) {
  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-3 p-4 md:grid-cols-3">
      {items.map((item, index) => (
        <div
          key={`${item.title}-${index}`}
          className={cn(
            "group relative h-[300px] overflow-hidden rounded-xl border border-[#1D1D1B]/15 shadow-lg transition-all duration-300 hover:-translate-y-0.5",
            item.colSpan === 2 ? "md:col-span-2" : "md:col-span-1",
          )}
        >
          <img
            src={item.image}
            alt={item.description}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1D1D1B]/80 via-[#1D1D1B]/30 to-transparent" />

          <div className="absolute inset-0 flex flex-col justify-between p-4">
            <div>
              <p className="text-tiny brand-heading text-[#E4D344]">{item.eyebrow}</p>
            </div>
            <div>
              <h3 className="text-large font-medium text-white">{item.title}</h3>
              <p className="mt-1 text-sm text-white/80">{item.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export { BentoGrid };
