import React from "react";

export interface Article {
  id: string;
  title: string;
  authors: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    name?: string;
    orcid?: string;
    affiliation?: string;
  }[];
  year: number;
  journal: string;
  abstract?: string;
  doi: string;
  citationCount?: number;
  referenceCount?: number;
  type?: string;
  source?: string;
  isSeed?: boolean;
  [key: string]: any;
}

export interface Filters {
  category: string;
  source: string;
  minCitations: string;
  yearFrom: string;
  yearTo: string;
}

export interface IconSvgProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  width?: number;
  height?: number;
}
