"use client";

import { useState } from "react";
import {
  SubjectCandidateGroup,
  LcshCandidate,
  MarcSubfield,
} from "@/lib/marc/types";

interface SubjectSelectorProps {
  candidateGroups: SubjectCandidateGroup[];
  onConfirm: (selectedCandidates: LcshCandidate[]) => void;
}

function formatHeading(subfields: MarcSubfield[]): string {
  return subfields
    .map((sf) => {
      if (sf.code === "a") return sf.value;
      return `-- ${sf.value}`;
    })
    .join(" ");
}

function formatSubfieldsDisplay(subfields: MarcSubfield[]): React.ReactNode {
  return (
    <span className="font-mono text-sm">
      {subfields.map((sf, i) => (
        <span key={i}>
          <span className="text-green-700 font-bold">${sf.code}</span>
          <span>{sf.value}</span>
          {i < subfields.length - 1 && " "}
        </span>
      ))}
    </span>
  );
}

export default function SubjectSelector({
  candidateGroups,
  onConfirm,
}: SubjectSelectorProps) {
  // Track selected candidate index for each group
  const [selections, setSelections] = useState<(number | null)[]>(
    candidateGroups.map(() => null)
  );
  const [confirmed, setConfirmed] = useState(false);

  const handleSelect = (groupIdx: number, candidateIdx: number) => {
    if (confirmed) return;
    setSelections((prev) => {
      const next = [...prev];
      // Toggle: if already selected, deselect
      next[groupIdx] = next[groupIdx] === candidateIdx ? null : candidateIdx;
      return next;
    });
  };

  const handleConfirm = () => {
    const selected: LcshCandidate[] = [];
    selections.forEach((candidateIdx, groupIdx) => {
      if (candidateIdx !== null) {
        selected.push(candidateGroups[groupIdx].candidates[candidateIdx]);
      }
    });
    if (selected.length === 0) return;
    setConfirmed(true);
    onConfirm(selected);
  };

  const hasSelection = selections.some((s) => s !== null);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">
        650 Subject Headings — Select from Candidates
      </h2>
      <p className="text-sm text-gray-500">
        Each group represents a subject concept. Select one heading per group.
        Verified headings are confirmed against LC Authorities.
      </p>

      {candidateGroups.map((group, groupIdx) => (
        <div
          key={groupIdx}
          className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-1"
        >
          <p className="text-xs font-medium text-gray-500 mb-2">
            Subject {groupIdx + 1}
          </p>
          {group.candidates.map((candidate, candidateIdx) => {
            const isSelected = selections[groupIdx] === candidateIdx;
            return (
              <button
                key={candidateIdx}
                onClick={() => handleSelect(groupIdx, candidateIdx)}
                disabled={confirmed}
                className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  isSelected
                    ? "bg-blue-50 border border-blue-300"
                    : "bg-white border border-gray-200 hover:border-gray-300"
                } ${confirmed ? "opacity-60 cursor-default" : "cursor-pointer"}`}
              >
                {/* Radio indicator */}
                <span
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    isSelected
                      ? "border-blue-600"
                      : "border-gray-300"
                  }`}
                >
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                  )}
                </span>

                {/* Heading content */}
                <span className="flex-1 text-sm text-gray-800">
                  {formatSubfieldsDisplay(candidate.subfields)}
                </span>

                {/* Verification badge */}
                <span className="shrink-0 text-xs">
                  {candidate.verified ? (
                    <span className="flex items-center gap-1">
                      <span className="text-green-600 font-medium">LC Verified</span>
                      {candidate.lcUri && (
                        <a
                          href={candidate.lcUri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          view
                        </a>
                      )}
                    </span>
                  ) : (
                    <span className="text-yellow-600 font-medium">
                      Unverified
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      ))}

      {!confirmed && (
        <button
          onClick={handleConfirm}
          disabled={!hasSelection}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Apply Selected Subject Headings
        </button>
      )}

      {confirmed && (
        <p className="text-sm text-green-600 font-medium">
          Subject headings applied to MARC record.
        </p>
      )}
    </div>
  );
}
