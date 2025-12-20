"use client";

import Hero from "@/components/landing/hero";
import Features from "@/components/landing/features";
import HowItWorks from "@/components/landing/how-it-works";
import UseCases from "@/components/landing/use-cases";
import CTA from "@/components/landing/cta";
import { Navbar } from "@/components/navbar";

export default function Home() {
  return (
    <main className="flex flex-col min-h-dvh">
      <Navbar minimal />
      <Hero />
      <div className="flex justify-center">
        <Features />
      </div>
      <HowItWorks />
      <UseCases />
      <CTA />
    </main>
  );
}
