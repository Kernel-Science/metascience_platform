"use client";
import React, { useState } from "react";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { X } from "lucide-react";

interface CitationSearchProps {
  seedDois: string[];
  onSeedDoisChange: (dois: string[]) => void;
  onSearch: () => void;
  loading: boolean;
}

const CitationSearch: React.FC<CitationSearchProps> = ({
  seedDois,
  onSeedDoisChange,
  onSearch,
  loading,
}) => {
  const [inputValue, setInputValue] = useState("");

  const handleAddDoi = () => {
    const newDois = inputValue
      .split("\n")
      .map((doi) => doi.trim())
      .filter((doi) => doi && !seedDois.includes(doi));

    if (newDois.length > 0) {
      onSeedDoisChange([...seedDois, ...newDois]);
    }
    setInputValue("");
  };

  const handleRemoveDoi = (doiToRemove: string) => {
    onSeedDoisChange(seedDois.filter((doi) => doi !== doiToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddDoi();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <Input
          isClearable
          label="Add Seed DOI(s)"
          placeholder="Enter DOI and press Enter"
          value={inputValue}
          onClear={() => setInputValue("")}
          onKeyDown={handleKeyDown}
          onValueChange={setInputValue}
        />
        <Button className="w-full" size="sm" onClick={handleAddDoi}>
          Add Paper
        </Button>
      </div>

      {seedDois.length > 0 && (
        <div className="space-y-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Seed Papers
          </span>
          <div className="max-h-48 overflow-y-auto space-y-2 rounded-lg border bg-gray-50 dark:bg-gray-800 p-2">
            {seedDois.map((doi) => (
              <div
                key={doi}
                className="flex items-center justify-between gap-2 rounded-md bg-white dark:bg-gray-700 p-2 text-sm"
              >
                <span className="truncate flex-1" title={doi}>
                  {doi}
                </span>
                <button
                  className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                  onClick={() => handleRemoveDoi(doi)}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button
        color="primary"
        disabled={loading || seedDois.length === 0}
        onClick={onSearch}
      >
        {loading ? "Generating..." : "Generate Network"}
      </Button>
    </div>
  );
};

export default CitationSearch;
