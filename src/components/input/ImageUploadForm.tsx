"use client";

import { useRef, useState } from "react";
import { useOcr } from "@/hooks/useOcr";
import { AiProvider } from "@/lib/marc/types";
import ProviderSelector from "./ProviderSelector";

interface ImageUploadFormProps {
  onTextExtracted: (titlePage: string, verso: string) => void;
  onSubmit: () => void;
  titlePageText: string;
  versoText: string;
  onTitlePageChange: (value: string) => void;
  onVersoChange: (value: string) => void;
  isLoading: boolean;
  provider: AiProvider;
  onProviderChange: (provider: AiProvider) => void;
}

function DropZone({
  label,
  onFileSelected,
  isProcessing,
  progress,
}: {
  label: string;
  onFileSelected: (file: File) => void;
  isProcessing: boolean;
  progress: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = (file: File) => {
    if (file.type.startsWith("image/")) {
      setFileName(file.name);
      onFileSelected(file);
    }
  };

  return (
    <div
      className={`relative rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
        isDragging
          ? "border-blue-400 bg-blue-50"
          : "border-gray-300 hover:border-gray-400"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
      }}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <p className="text-sm font-medium text-gray-700 mb-1">{label}</p>
      {isProcessing ? (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">Processing OCR... {progress}%</p>
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : fileName ? (
        <p className="text-xs text-green-600">Processed: {fileName}</p>
      ) : (
        <p className="text-xs text-gray-400">
          Drop image here or click to browse
        </p>
      )}
    </div>
  );
}

export default function ImageUploadForm({
  onTextExtracted,
  onSubmit,
  titlePageText,
  versoText,
  onTitlePageChange,
  onVersoChange,
  isLoading,
  provider,
  onProviderChange,
}: ImageUploadFormProps) {
  const titleOcr = useOcr();
  const versoOcr = useOcr();

  const handleTitleImage = async (file: File) => {
    const text = await titleOcr.processImage(file);
    if (text) {
      onTitlePageChange(text);
      onTextExtracted(text, versoText);
    }
  };

  const handleVersoImage = async (file: File) => {
    const text = await versoOcr.processImage(file);
    if (text) {
      onVersoChange(text);
      onTextExtracted(titlePageText, text);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <DropZone
            label="Title Page Image"
            onFileSelected={handleTitleImage}
            isProcessing={titleOcr.isProcessing}
            progress={titleOcr.progress}
          />
          {titleOcr.error && (
            <p className="text-xs text-red-500">{titleOcr.error}</p>
          )}
          <textarea
            rows={6}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            placeholder="Extracted title page text (editable)..."
            value={titlePageText}
            onChange={(e) => onTitlePageChange(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <DropZone
            label="Verso (Copyright Page) Image"
            onFileSelected={handleVersoImage}
            isProcessing={versoOcr.isProcessing}
            progress={versoOcr.progress}
          />
          {versoOcr.error && (
            <p className="text-xs text-red-500">{versoOcr.error}</p>
          )}
          <textarea
            rows={6}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            placeholder="Extracted verso text (editable)..."
            value={versoText}
            onChange={(e) => onVersoChange(e.target.value)}
          />
        </div>
      </div>
      <ProviderSelector provider={provider} onProviderChange={onProviderChange} />
      <button
        onClick={onSubmit}
        disabled={
          isLoading ||
          !titlePageText.trim() ||
          titleOcr.isProcessing ||
          versoOcr.isProcessing
        }
        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? "Generating MARC Record..." : "Generate MARC Record"}
      </button>
    </div>
  );
}
