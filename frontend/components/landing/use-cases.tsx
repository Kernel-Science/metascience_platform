"use client";

import { Card, CardBody } from "@heroui/card";
import { motion } from "framer-motion";
import {
  AcademicCapIcon,
  UserGroupIcon,
  BeakerIcon,
  BuildingLibraryIcon,
} from "@heroicons/react/24/outline";

export default function UseCases() {
  const useCases = [
    {
      icon: AcademicCapIcon,
      title: "Researchers & PhD Students",
      description:
        "Conduct comprehensive literature reviews, identify research gaps, and discover influential papers in your field.",
      benefits: [
        "Save hours on literature reviews",
        "Find hidden connections",
        "Track research trends",
      ],
    },
    {
      icon: BuildingLibraryIcon,
      title: "Academic Institutions",
      description:
        "Enable your faculty and students with powerful tools for research discovery and collaboration.",
      benefits: [
        "Institutional analytics",
        "Research impact tracking",
        "Collaboration networks",
      ],
    },
    {
      icon: BeakerIcon,
      title: "R&D Teams",
      description:
        "Stay ahead of the curve by monitoring emerging research and identifying potential innovations.",
      benefits: [
        "Technology scouting",
        "Competitive intelligence",
        "Innovation tracking",
      ],
    },
    {
      icon: UserGroupIcon,
      title: "Research Groups",
      description:
        "Collaborate effectively with shared analysis, team workspaces, and collective insights.",
      benefits: ["Team collaboration", "Shared collections", "Joint analysis"],
    },
  ];

  return (
    <section className="w-full py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Built for Everyone in Research
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Whether you&apos;re a solo researcher or part of a large
            institution, our platform adapts to your needs
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {useCases.map((useCase, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                <CardBody className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                      <useCase.icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">
                        {useCase.title}
                      </h3>
                      <p className="text-default-600 mb-4">
                        {useCase.description}
                      </p>
                      <ul className="space-y-2">
                        {useCase.benefits.map((benefit, idx) => (
                          <li
                            key={idx}
                            className="flex items-center text-sm text-default-500"
                          >
                            <svg
                              className="w-4 h-4 text-success mr-2 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
