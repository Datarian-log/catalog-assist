"use client";

import { MarcRecord, FieldSource } from "@/lib/marc/types";
import MarcFieldRow from "./MarcFieldRow";

interface MarcRecordDisplayProps {
  record: MarcRecord;
  warnings: string[];
  fieldSources?: Record<string, FieldSource>;
}

export default function MarcRecordDisplay({
  record,
  warnings,
  fieldSources,
}: MarcRecordDisplayProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-gray-900">
        Generated MARC Record
      </h2>

      {warnings.length > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
          <p className="text-sm font-medium text-yellow-800 mb-1">Warnings:</p>
          <ul className="list-disc list-inside text-sm text-yellow-700 space-y-0.5">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-3 space-y-0">
        {/* Leader */}
        <div className="flex items-start gap-2 font-mono text-sm leading-relaxed px-2 py-0.5 hover:bg-gray-50 rounded">
          <span className="font-bold text-purple-700 w-8 shrink-0">LDR</span>
          <span className="text-gray-400 w-5 shrink-0">{"  "}</span>
          <span className="text-gray-800">{record.leader}</span>
          <span className="text-gray-400 text-xs ml-auto shrink-0 hidden sm:inline">
            Leader
          </span>
        </div>

        {/* Control Fields */}
        {record.controlFields.map((cf, i) => (
          <MarcFieldRow key={`cf-${i}`} field={cf} source={fieldSources?.[cf.tag]} />
        ))}

        {/* Data Fields */}
        {record.dataFields.map((df, i) => (
          <MarcFieldRow key={`df-${i}`} field={df} source={fieldSources?.[df.tag]} />
        ))}
      </div>
    </div>
  );
}
