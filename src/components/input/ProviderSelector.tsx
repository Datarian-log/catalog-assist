"use client";

import { AiProvider } from "@/lib/marc/types";

interface ProviderSelectorProps {
  provider: AiProvider;
  onProviderChange: (provider: AiProvider) => void;
}

export default function ProviderSelector({
  provider,
  onProviderChange,
}: ProviderSelectorProps) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm font-medium text-gray-700">AI Model:</span>
      <label className="flex items-center gap-1.5 cursor-pointer">
        <input
          type="radio"
          name="ai-provider"
          value="claude"
          checked={provider === "claude"}
          onChange={() => onProviderChange("claude")}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-800">Claude</span>
      </label>
      <label className="flex items-center gap-1.5 cursor-pointer">
        <input
          type="radio"
          name="ai-provider"
          value="gemini"
          checked={provider === "gemini"}
          onChange={() => onProviderChange("gemini")}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-800">Gemini</span>
      </label>
    </div>
  );
}
