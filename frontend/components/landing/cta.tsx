"use client";

import { Button } from "@heroui/button";
import { motion } from "framer-motion";
import Link from "next/link";

export default function CTA() {
  return (
    <section className="w-full py-20 bg-primary/5">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="bg-background rounded-3xl p-12 shadow-2xl border border-default-200">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Ready to Transform Your Research?
            </h2>
            <p className="text-lg text-default-600 mb-8 max-w-2xl mx-auto">
              Join researchers worldwide who are discovering insights faster
              with AI-powered literature analysis. Start exploring 2.3M+ papers
              today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                as={Link}
                href="/research?tab=search"
                size="lg"
                color="primary"
                className="font-semibold px-8 text-base"
                radius="full"
              >
                Start Analyzing
              </Button>
              <Button
                as={Link}
                href="/citation"
                size="lg"
                variant="bordered"
                className="font-semibold px-8 text-base"
                radius="full"
              >
                Explore Citation Networks
              </Button>
            </div>
            <p className="text-sm text-default-500 mt-6">
              Free to use • No credit card required • Instant access
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
