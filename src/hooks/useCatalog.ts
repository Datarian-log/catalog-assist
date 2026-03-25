"use client";

import { useState } from "react";
import {
  MarcRecord,
  CatalogResponse,
  SubjectCandidateGroup,
  LcshCandidate,
  MarcDataField,
  AiProvider,
  FieldSource,
} from "@/lib/marc/types";

interface UseCatalogReturn {
  record: MarcRecord | null;
  warnings: string[];
  subjectCandidates: SubjectCandidateGroup[];
  fieldSources: Record<string, FieldSource>;
  isLoading: boolean;
  error: string | null;
  subjectsApplied: boolean;
  generate: (titlePageText: string, versoText: string, provider: AiProvider) => Promise<void>;
  applySubjects: (selected: LcshCandidate[]) => void;
  reset: () => void;
}

export function useCatalog(): UseCatalogReturn {
  const [record, setRecord] = useState<MarcRecord | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [subjectCandidates, setSubjectCandidates] = useState<
    SubjectCandidateGroup[]
  >([]);
  const [fieldSources, setFieldSources] = useState<Record<string, FieldSource>>(
    {}
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subjectsApplied, setSubjectsApplied] = useState(false);

  const generate = async (titlePageText: string, versoText: string, provider: AiProvider) => {
    setIsLoading(true);
    setError(null);
    setRecord(null);
    setWarnings([]);
    setSubjectCandidates([]);
    setFieldSources({});
    setSubjectsApplied(false);

    try {
      const response = await fetch("/api/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titlePageText, versoText, provider }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate MARC record.");
      }

      const catalogResponse = data as CatalogResponse;
      setRecord(catalogResponse.record);
      setWarnings(catalogResponse.warnings);
      setSubjectCandidates(catalogResponse.subjectCandidates || []);
      setFieldSources(catalogResponse.fieldSources || {});
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const applySubjects = (selected: LcshCandidate[]) => {
    if (!record) return;

    // Convert selected candidates to 650 data fields
    const subjectFields: MarcDataField[] = selected.map((candidate) => ({
      tag: "650",
      ind1: " ",
      ind2: "0",
      subfields: candidate.subfields,
    }));

    // Insert 650 fields in proper tag order
    const allFields = [...record.dataFields, ...subjectFields].sort((a, b) =>
      a.tag.localeCompare(b.tag)
    );

    setRecord({
      ...record,
      dataFields: allFields,
    });
    setSubjectsApplied(true);
  };

  const reset = () => {
    setRecord(null);
    setWarnings([]);
    setSubjectCandidates([]);
    setFieldSources({});
    setError(null);
    setSubjectsApplied(false);
  };

  return {
    record,
    warnings,
    subjectCandidates,
    fieldSources,
    isLoading,
    error,
    subjectsApplied,
    generate,
    applySubjects,
    reset,
  };
}
