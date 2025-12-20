"use client";

import { motion } from "framer-motion";
import { Button } from "@heroui/button";
import Link from "next/link";
import { ArrowRightIcon, SparklesIcon } from "@heroicons/react/24/outline";

export default function Hero() {
  return (
    <div className="relative justify-center items-center">
      <section className="max-w-screen-xl mx-auto px-4 py-28 gap-12 md:px-8 flex flex-col justify-center items-center">
        <motion.div
          animate={{
            y: 0,
            opacity: 1,
          }}
          className="flex flex-col justify-center items-center space-y-5 max-w-4xl mx-auto text-center"
          initial={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.6, type: "spring", bounce: 0 }}
        >
          <span className="w-fit h-full text-sm bg-card px-2 py-1 border border-border rounded-full flex items-center gap-2">
            <SparklesIcon className="w-4 h-4" />
            Gain Valuable Insights for your research
          </span>
          <h1 className="text-4xl font-medium tracking-tighter mx-auto md:text-6xl text-pretty">
            Explore 2.3M+ Scientific Papers with Advanced Analytics
          </h1>
          <p className="max-w-2xl text-lg mx-auto text-muted-foreground text-balance">
            Unlock the power of AI-driven research discovery. Analyze citation
            networks, discover trends, and accelerate your scientific research.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 mt-4"
          >
            <Button
              as={Link}
              href="/research?tab=search"
              size="lg"
              color="primary"
              className="font-semibold"
              endContent={<ArrowRightIcon className="w-5 h-5" />}
            >
              Get Started Free
            </Button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-sm text-muted-foreground"
          >
            Trusted by researchers • 100% free • Open source
          </motion.p>
        </motion.div>
      </section>
      <motion.div
        animate={{ opacity: 1 }}
        className="w-full h-full absolute -top-32 flex justify-end items-center pointer-events-none "
        initial={{ opacity: 0 }}
        transition={{ duration: 2, delay: 0.5, type: "spring", bounce: 0 }}
      >
        <div className="w-3/4 flex justify-center items-center">
          <div className="w-12 h-[600px] bg-light blur-[70px] rounded-3xl max-sm:rotate-[15deg] sm:rotate-[35deg] [will-change:transform]" />
        </div>
      </motion.div>
    </div>
  );
}
