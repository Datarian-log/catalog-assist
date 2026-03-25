"use client";

import { MarcRecord } from "@/lib/marc/types";

interface ExportButtonsProps {
  record: MarcRecord;
}

async function downloadFile(record: MarcRecord, format: "mrc" | "xml") {
  const response = await fetch("/api/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ record, format }),
  });

  if (!response.ok) {
    throw new Error("Export failed");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = format === "mrc" ? "record.mrc" : "record.xml";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function ExportButtons({ record }: ExportButtonsProps) {
  const handleExport = async (format: "mrc" | "xml") => {
    try {
      await downloadFile(record, format);
    } catch {
      alert("Failed to export record. Please try again.");
    }
  };

  return (
    <div className="flex gap-3">
      <button
        onClick={() => handleExport("mrc")}
        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
      >
        Download .mrc
      </button>
      <button
        onClick={() => handleExport("xml")}
        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
      >
        Download MARCXML
      </button>
    </div>
  );
}
