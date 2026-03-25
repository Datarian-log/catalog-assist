export interface MarcSubfield {
  code: string;
  value: string;
}

export interface MarcDataField {
  tag: string;
  ind1: string;
  ind2: string;
  subfields: MarcSubfield[];
}

export interface MarcControlField {
  tag: string;
  value: string;
}

export interface MarcRecord {
  leader: string;
  controlFields: MarcControlField[];
  dataFields: MarcDataField[];
}

export interface LcshCandidate {
  subfields: MarcSubfield[];
  verified?: boolean;
  lcUri?: string;
}

export interface SubjectCandidateGroup {
  candidates: LcshCandidate[];
}

export type AiProvider = "claude" | "gemini";

export type FieldSource = "ai" | "google" | "openlibrary" | "lc" | "computed";

export interface CatalogRequest {
  titlePageText: string;
  versoText: string;
  provider: AiProvider;
}

export interface CatalogResponse {
  record: MarcRecord;
  warnings: string[];
  subjectCandidates: SubjectCandidateGroup[];
  fieldSources?: Record<string, FieldSource>;
}
