import { MarcRecord, SubjectCandidateGroup } from "./types";

interface ParseResult {
  record: MarcRecord;
  warnings: string[];
  subjectCandidates: SubjectCandidateGroup[];
}

export function parseMarcResponse(raw: string): ParseResult {
  const warnings: string[] = [];

  // Strip markdown code fences if present
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("Failed to parse MARC record JSON from AI response.");
  }

  // Validate leader
  if (!parsed.leader || typeof parsed.leader !== "string") {
    parsed.leader = "00000nam a2200000 i 4500";
    warnings.push("Leader was missing or invalid; using default leader.");
  } else if (parsed.leader.length !== 24) {
    warnings.push(
      `Leader length is ${parsed.leader.length} (expected 24). It will be adjusted during export.`
    );
  }

  // Validate controlFields
  if (!Array.isArray(parsed.controlFields)) {
    parsed.controlFields = [];
    warnings.push("Control fields were missing.");
  }
  for (const cf of parsed.controlFields) {
    if (cf.tag === "008" && cf.value.length !== 40) {
      warnings.push(
        `008 field length is ${cf.value.length} (expected 40).`
      );
    }
  }

  // Validate dataFields
  if (!Array.isArray(parsed.dataFields)) {
    parsed.dataFields = [];
    warnings.push("Data fields were missing.");
  }

  // Extract any 650 fields that ended up in dataFields and move to candidates
  const stray650s = parsed.dataFields.filter(
    (f: { tag: string }) => f.tag === "650"
  );
  parsed.dataFields = parsed.dataFields.filter(
    (f: { tag: string }) => f.tag !== "650"
  );

  const requiredTags = ["245", "264"];
  for (const tag of requiredTags) {
    const found = parsed.dataFields.some((f: { tag: string }) => f.tag === tag);
    if (!found) {
      warnings.push(`Required field ${tag} is missing from the record.`);
    }
  }

  for (const field of parsed.dataFields) {
    if (!field.tag || field.tag.length !== 3) {
      warnings.push(`Invalid tag: "${field.tag}".`);
    }
    if (typeof field.ind1 !== "string") field.ind1 = " ";
    if (typeof field.ind2 !== "string") field.ind2 = " ";
    if (field.ind1.length !== 1) {
      warnings.push(`Tag ${field.tag}: indicator 1 "${field.ind1}" is not a single character.`);
      field.ind1 = field.ind1.charAt(0) || " ";
    }
    if (field.ind2.length !== 1) {
      warnings.push(`Tag ${field.tag}: indicator 2 "${field.ind2}" is not a single character.`);
      field.ind2 = field.ind2.charAt(0) || " ";
    }
    if (!Array.isArray(field.subfields) || field.subfields.length === 0) {
      warnings.push(`Tag ${field.tag}: no subfields found.`);
      field.subfields = field.subfields || [];
    }
    for (const sf of field.subfields) {
      if (!sf.code || sf.code.length !== 1) {
        warnings.push(
          `Tag ${field.tag}: invalid subfield code "${sf.code}".`
        );
      }
    }
  }

  // Parse subjectCandidates
  let subjectCandidates: SubjectCandidateGroup[] = [];

  if (Array.isArray(parsed.subjectCandidates) && parsed.subjectCandidates.length > 0) {
    subjectCandidates = parsed.subjectCandidates.map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (group: any) => ({
        candidates: Array.isArray(group.candidates)
          ? group.candidates.map(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (c: any) => ({
                subfields: Array.isArray(c.subfields) ? c.subfields : [],
              })
            )
          : [],
      })
    );
  } else if (stray650s.length > 0) {
    // Fallback: if Claude put 650s in dataFields and no subjectCandidates,
    // convert each 650 into a group with 1 candidate
    warnings.push("Subject headings were in dataFields instead of subjectCandidates. Converted automatically.");
    subjectCandidates = stray650s.map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (field: any) => ({
        candidates: [{ subfields: field.subfields || [] }],
      })
    );
  }

  if (subjectCandidates.length === 0) {
    warnings.push("No subject heading candidates were provided.");
  }

  const record: MarcRecord = {
    leader: parsed.leader,
    controlFields: parsed.controlFields,
    dataFields: parsed.dataFields,
  };

  return { record, warnings, subjectCandidates };
}
