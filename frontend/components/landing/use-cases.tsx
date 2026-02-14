"use client";

import { motion } from "framer-motion";
import { FeaturesSectionWithCardGradient } from "@/components/ui/feature-section-with-card-gradient";

export default function UseCases() {
  return (
    <section className="w-full py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16 text-center"
        >
          <h2 className="text-3xl font-bold text-foreground md:text-5xl">
            Built for Everyone in Research
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-foreground/70">
            Whether you&apos;re a solo researcher or part of a large
            institution, our platform adapts to your needs
          </p>
        </motion.div>
        <FeaturesSectionWithCardGradient />
      </div>
    </section>
  );
}
