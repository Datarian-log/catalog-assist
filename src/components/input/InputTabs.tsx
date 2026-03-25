"use client";

interface InputTabsProps {
  activeTab: "text" | "image";
  onTabChange: (tab: "text" | "image") => void;
}

export default function InputTabs({ activeTab, onTabChange }: InputTabsProps) {
  return (
    <div className="flex border-b border-gray-200">
      <button
        onClick={() => onTabChange("text")}
        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
          activeTab === "text"
            ? "border-blue-600 text-blue-600"
            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
        }`}
      >
        Text Input
      </button>
      <button
        onClick={() => onTabChange("image")}
        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
          activeTab === "image"
            ? "border-blue-600 text-blue-600"
            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
        }`}
      >
        Image Upload (OCR)
      </button>
    </div>
  );
}
