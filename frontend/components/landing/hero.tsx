"use client";

import { motion } from "framer-motion";
import { Button } from "@heroui/button";
import Link from "next/link";
import { ArrowRightIcon, SparklesIcon } from "@heroicons/react/24/outline";

export default function Hero() {
  return (
    <div className="relative flex items-center justify-center overflow-hidden">
      <section className="mx-auto flex w-full max-w-screen-xl flex-col items-center justify-center gap-12 px-4 py-28 text-center md:px-8">
        <motion.div
          animate={{ y: 0, opacity: 1 }}
          className="mx-auto flex max-w-4xl flex-col items-center justify-center space-y-5"
          initial={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.6, type: "spring", bounce: 0 }}
        >
          <span className="flex h-full w-fit items-center gap-2 rounded-full border border-foreground/20 bg-content1/70 px-3 py-1 text-sm text-foreground/85">
            <SparklesIcon className="h-4 w-4" />
            Gain Valuable Insights for your research
          </span>

          <h1 className="text-pretty mx-auto text-4xl font-semibold tracking-tight text-foreground md:text-6xl">
            Explore 2.3M+ Scientific Papers with Advanced Analytics
          </h1>

          <p className="mx-auto max-w-2xl text-balance text-lg text-foreground/75">
            Unlock the power of AI-driven research discovery. Analyze citation
            networks, discover trends, and accelerate your scientific research.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-4 flex flex-col gap-4 sm:flex-row"
          >
            <Button
              as={Link}
              href="/research?tab=search"
              size="lg"
              className="border border-foreground/80 bg-[#E4D344] font-semibold text-[#1D1D1B]"
              endContent={<ArrowRightIcon className="h-5 w-5" />}
            >
              Get Started Free
            </Button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-sm text-foreground/60"
          >
            Trusted by researchers • 100% free • Open source
          </motion.p>
        </motion.div>
      </section>

      <motion.div
        animate={{ opacity: 1 }}
        className="pointer-events-none absolute -top-32 flex h-full w-full items-center justify-end"
        initial={{ opacity: 0 }}
        transition={{ duration: 2, delay: 0.5, type: "spring", bounce: 0 }}
      >
        <div className="flex w-3/4 items-center justify-center">
          <div className="h-[600px] w-14 rounded-3xl bg-[#E4D344]/60 blur-[70px] [will-change:transform] max-sm:rotate-[15deg] sm:rotate-[35deg]" />
        </div>
      </motion.div>
    </div>
  );
}
