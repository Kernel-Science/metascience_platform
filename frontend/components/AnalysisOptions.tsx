"use client";
import React from "react";
import { RadioGroup, Radio } from "@heroui/radio";
import { Button } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";
import { InfoIcon } from "lucide-react";

export interface AnalysisOptions {
  retrieveCited: string;
  retrieveCiting: string;
  dataSource: string; // Added to fix TS2339 error
}

interface AnalysisOptionsProps {
  options: AnalysisOptions;
  onChange: (options: AnalysisOptions) => void;
  onExport?: () => void;
}

const AnalysisOptionsComponent: React.FC<AnalysisOptionsProps> = ({
  options,
  onChange,
  onExport,
}) => {
  const handleChange = (key: keyof AnalysisOptions, value: string) => {
    onChange({
      ...options,
      [key]: value,
    });
  };

  const retrievalOptions = [
    {
      key: "none",
      label: "None",
      description: "Don't retrieve these papers",
    },
    {
      key: "top",
      label: "Top 20",
      description: "Show the 20 most relevant papers (recommended)",
    },
    {
      key: "all",
      label: "All",
      description:
        "Show all available papers (may be slow for highly cited papers)",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Cited Papers Options */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <label
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
            htmlFor="retrieve-cited-group"
          >
            Retrieve Cited Papers
          </label>
          <Tooltip content="Papers that your seed papers reference. These show what literature your papers build upon.">
            <InfoIcon className="w-4 h-4 text-gray-400" />
          </Tooltip>
        </div>
        <RadioGroup
          className="gap-4"
          id="retrieve-cited-group"
          orientation="horizontal"
          value={options.retrieveCited}
          onValueChange={(value) => handleChange("retrieveCited", value)}
        >
          {retrievalOptions.map((option) => (
            <div key={option.key} className="flex flex-col">
              <Radio
                className="data-[selected=true]:text-teal-600"
                value={option.key}
              >
                {option.label}
              </Radio>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-6 mt-1">
                {option.description}
              </span>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Citing Papers Options */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <label
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
            htmlFor="retrieve-citing-group"
          >
            Retrieve Citing Papers
          </label>
          <Tooltip content="Papers that cite your seed papers. These show the impact and follow-up work of your papers.">
            <InfoIcon className="w-4 h-4 text-gray-400" />
          </Tooltip>
        </div>
        <RadioGroup
          className="gap-4"
          id="retrieve-citing-group"
          orientation="horizontal"
          value={options.retrieveCiting}
          onValueChange={(value) => handleChange("retrieveCiting", value)}
        >
          {retrievalOptions.map((option) => (
            <div key={option.key} className="flex flex-col">
              <Radio
                className="data-[selected=true]:text-blue-600"
                value={option.key}
              >
                {option.label}
              </Radio>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-6 mt-1">
                {option.description}
              </span>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Export Options */}
      {onExport && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            className="w-full"
            size="sm"
            variant="bordered"
            onPress={onExport}
          >
            Export Network Data
          </Button>
        </div>
      )}

      {/* Tips */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-sm">
        <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
          💡 Tips:
        </h4>
        <ul className="space-y-1 text-gray-600 dark:text-gray-400">
          <li>
            • Start with &#34;Top 20&#34; for both cited and citing papers
          </li>
          <li>
            • Use &ldquo;All&ldquo; mode for comprehensive analysis of
            less-cited papers
          </li>
          <li>• Semantic Scholar works best for CS/biomedical papers</li>
          <li>• OpenAlex has broader coverage across all disciplines</li>
          <li>• Try different data sources if some papers are missing</li>
        </ul>
      </div>
    </div>
  );
};

export default AnalysisOptionsComponent;
