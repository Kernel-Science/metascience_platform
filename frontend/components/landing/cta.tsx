"use client";

import { Button } from "@heroui/button";
import { motion } from "framer-motion";
import Link from "next/link";

export default function CTA() {
  return (
    <section className="w-full py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="rounded-3xl border border-foreground/18 bg-content1/80 p-12 shadow-2xl">
            <h2 className="text-3xl font-bold text-foreground md:text-5xl">
              Ready to Transform Your Research?
            </h2>
            <p className="mx-auto mb-8 mt-6 max-w-2xl text-lg text-foreground/72">
              Join researchers worldwide who are discovering insights faster
              with AI-powered literature analysis. Start exploring 2.3M+ papers
              today.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                as={Link}
                href="/research/search"
                size="lg"
                className="rounded-full border border-foreground/75 bg-[#E4D344] px-8 text-base font-semibold text-[#1D1D1B]"
              >
                Start Analyzing
              </Button>
              <Button
                as={Link}
                href="/citation"
                size="lg"
                variant="bordered"
                className="rounded-full border-foreground/35 bg-content1/65 px-8 text-base font-semibold text-foreground"
              >
                Explore Citation Networks
              </Button>
            </div>
            <p className="mt-6 text-sm text-foreground/60">
              Free to use • No credit card required • Instant access
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
