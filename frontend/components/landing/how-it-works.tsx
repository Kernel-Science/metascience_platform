"use client";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { motion } from "framer-motion";
import {
  MagnifyingGlassIcon,
  ChartBarIcon,
  LightBulbIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

export default function HowItWorks() {
  const steps = [
    {
      icon: MagnifyingGlassIcon,
      title: "Search & Discover",
      description:
        "Enter DOIs or search by keywords to find papers from our database of 2.3M+ scholarly articles across all disciplines.",
      step: "1",
    },
    {
      icon: ChartBarIcon,
      title: "Analyze Citations",
      description:
        "Visualize citation networks, explore relationships between papers, and identify influential research in your field.",
      step: "2",
    },
    {
      icon: LightBulbIcon,
      title: "Get AI Insights",
      description:
        "Leverage AI-driven analytics to discover trends, research gaps, and emerging topics in the literature.",
      step: "3",
    },
    {
      icon: DocumentTextIcon,
      title: "Export & Share",
      description:
        "Save your analysis, generate reports, and share insights with your research team or collaborators.",
      step: "4",
    },
  ];

  return (
    <section className="w-full py-20 bg-gradient-to-b from-background to-default-100/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">How It Works</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get started in minutes and unlock the power of scientific literature
            analysis
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="flex flex-col items-center pb-0 pt-6">
                  <div className="relative mb-4">
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {step.step}
                    </div>
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                      <step.icon className="w-8 h-8 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-center">
                    {step.title}
                  </h3>
                </CardHeader>
                <CardBody className="text-center">
                  <p className="text-default-600">{step.description}</p>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
