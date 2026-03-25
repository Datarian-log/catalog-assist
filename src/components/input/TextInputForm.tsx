"use client";

import { AiProvider } from "@/lib/marc/types";
import ProviderSelector from "./ProviderSelector";

interface TextInputFormProps {
  titlePageText: string;
  versoText: string;
  onTitlePageChange: (value: string) => void;
  onVersoChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  provider: AiProvider;
  onProviderChange: (provider: AiProvider) => void;
}

export default function TextInputForm({
  titlePageText,
  versoText,
  onTitlePageChange,
  onVersoChange,
  onSubmit,
  isLoading,
  provider,
  onProviderChange,
}: TextInputFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label
            htmlFor="titlePage"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Title Page
          </label>
          <textarea
            id="titlePage"
            rows={10}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            placeholder={"Paste the title page text here...\n\nExample:\nPython Fundamentals\nA Practical Guide\nby Sarah Williams"}
            value={titlePageText}
            onChange={(e) => onTitlePageChange(e.target.value)}
          />
        </div>
        <div>
          <label
            htmlFor="verso"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Verso (Copyright Page)
          </label>
          <textarea
            id="verso"
            rows={10}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            placeholder={"Paste the verso (copyright page) text here...\n\nExample:\n© 2023 by Sarah Williams\nPublished by Acme Press, New York\nISBN 978-0-12-345678-9\nFirst edition"}
            value={versoText}
            onChange={(e) => onVersoChange(e.target.value)}
          />
        </div>
      </div>
      <ProviderSelector provider={provider} onProviderChange={onProviderChange} />
      <button
        onClick={onSubmit}
        disabled={isLoading || !titlePageText.trim()}
        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? "Generating MARC Record..." : "Generate MARC Record"}
      </button>
    </div>
  );
}
