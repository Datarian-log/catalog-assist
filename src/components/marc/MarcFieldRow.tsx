"use client";

import { MarcDataField, MarcControlField, FieldSource } from "@/lib/marc/types";

interface MarcFieldRowProps {
  field: MarcDataField | MarcControlField;
  source?: FieldSource;
}

const SOURCE_BADGES: Record<string, { label: string; className: string; title: string }> = {
  google: {
    label: "GB",
    className: "bg-blue-100 text-blue-700 border-blue-200",
    title: "Verified via Google Books",
  },
  openlibrary: {
    label: "OL",
    className: "bg-orange-100 text-orange-700 border-orange-200",
    title: "Verified via Open Library",
  },
  lc: {
    label: "LC",
    className: "bg-green-100 text-green-700 border-green-200",
    title: "Verified via LC Authorities",
  },
  computed: {
    label: "auto",
    className: "bg-purple-100 text-purple-700 border-purple-200",
    title: "Auto-corrected by system rules",
  },
};

function isDataField(
  field: MarcDataField | MarcControlField
): field is MarcDataField {
  return "subfields" in field;
}

const TAG_LABELS: Record<string, string> = {
  "001": "Control Number",
  "003": "Control Number ID",
  "005": "Date/Time Modified",
  "008": "Fixed-Length Data",
  "020": "ISBN",
  "050": "LC Call Number",
  "082": "Dewey Decimal",
  "100": "Main Entry - Personal Name",
  "110": "Main Entry - Corporate Name",
  "245": "Title Statement",
  "246": "Varying Form of Title",
  "250": "Edition Statement",
  "264": "Publication Info",
  "300": "Physical Description",
  "336": "Content Type",
  "337": "Media Type",
  "338": "Carrier Type",
  "490": "Series Statement",
  "500": "General Note",
  "504": "Bibliography Note",
  "505": "Contents Note",
  "520": "Summary",
  "600": "Subject - Personal Name",
  "610": "Subject - Corporate Name",
  "650": "Subject - Topical",
  "651": "Subject - Geographic",
  "655": "Genre/Form",
  "700": "Added Entry - Personal",
  "710": "Added Entry - Corporate",
  "776": "Additional Form",
  "830": "Series Added Entry",
};

function SourceBadge({ source }: { source?: FieldSource }) {
  if (!source || source === "ai") return null;
  const badge = SOURCE_BADGES[source];
  if (!badge) return null;

  return (
    <span
      className={`inline-flex items-center rounded px-1 py-px text-[10px] font-medium border leading-tight ${badge.className}`}
      title={badge.title}
    >
      {badge.label}
    </span>
  );
}

export default function MarcFieldRow({ field, source }: MarcFieldRowProps) {
  const label = TAG_LABELS[field.tag] || "";

  if (!isDataField(field)) {
    return (
      <div className="flex items-start gap-2 font-mono text-sm leading-relaxed hover:bg-gray-50 px-2 py-0.5 rounded">
        <span className="font-bold text-blue-700 w-8 shrink-0">
          {field.tag}
        </span>
        <span className="text-gray-400 w-5 shrink-0">{"  "}</span>
        <span className="text-gray-800 break-all">{field.value}</span>
        <span className="ml-auto shrink-0 hidden sm:flex items-center gap-1.5">
          <SourceBadge source={source} />
          {label && (
            <span className="text-gray-400 text-xs">
              {label}
            </span>
          )}
        </span>
      </div>
    );
  }

  const ind1Display = field.ind1 === " " ? "_" : field.ind1;
  const ind2Display = field.ind2 === " " ? "_" : field.ind2;

  return (
    <div className="flex items-start gap-2 font-mono text-sm leading-relaxed hover:bg-gray-50 px-2 py-0.5 rounded">
      <span className="font-bold text-blue-700 w-8 shrink-0">{field.tag}</span>
      <span className="text-orange-600 w-5 shrink-0">
        {ind1Display}
        {ind2Display}
      </span>
      <span className="text-gray-800 break-all">
        {field.subfields.map((sf, i) => (
          <span key={i}>
            <span className="text-green-700 font-bold">${sf.code}</span>
            <span>{sf.value}</span>
            {i < field.subfields.length - 1 && " "}
          </span>
        ))}
      </span>
      <span className="ml-auto shrink-0 hidden sm:flex items-center gap-1.5">
        <SourceBadge source={source} />
        {label && (
          <span className="text-gray-400 text-xs">
            {label}
          </span>
        )}
      </span>
    </div>
  );
}
