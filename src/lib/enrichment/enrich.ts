import {
  MarcRecord,
  MarcDataField,
  MarcSubfield,
  FieldSource,
} from "@/lib/marc/types";
import { lookupByIsbn, lookupByTitle, BookMetadata } from "./bookLookup";
import { validateIsbn } from "@/lib/isbn/validate";
import { lookupCountryCode } from "@/lib/marc/countryCodes";
import { fixIsbdPunctuation } from "@/lib/marc/punctuation";

export interface EnrichResult {
  record: MarcRecord;
  enrichmentWarnings: string[];
  additionalSubjects: string[];
  fieldSources: Record<string, FieldSource>;
}

function extractIsbn(record: MarcRecord, versoText: string): string | null {
  const field020 = record.dataFields.find((f) => f.tag === "020");
  if (field020) {
    const sfA = field020.subfields.find((sf) => sf.code === "a");
    if (sfA) {
      const match = sfA.value.match(/(\d[\d-]{8,}[\dXx])/);
      if (match) return match[1].replace(/-/g, "");
    }
  }

  const isbnMatch = versoText.match(/ISBN[:\s-]*([\d-]{10,17}[\dXx])/i);
  if (isbnMatch) return isbnMatch[1].replace(/-/g, "");

  const bareMatch = versoText.match(/\b(97[89]\d{10}|\d{9}[\dXx])\b/);
  if (bareMatch) return bareMatch[1];

  return null;
}

function extractTitleAuthor(record: MarcRecord): {
  title: string;
  author: string;
} {
  let title = "";
  let author = "";

  const field245 = record.dataFields.find((f) => f.tag === "245");
  if (field245) {
    const sfA = field245.subfields.find((sf) => sf.code === "a");
    if (sfA) title = sfA.value.replace(/[\s/:;,]+$/, "").trim();
  }

  const field100 = record.dataFields.find((f) => f.tag === "100");
  if (field100) {
    const sfA = field100.subfields.find((sf) => sf.code === "a");
    if (sfA) author = sfA.value.replace(/[\s,]+$/, "").trim();
  }

  return { title, author };
}

function insertFieldInOrder(
  fields: MarcDataField[],
  newField: MarcDataField
): MarcDataField[] {
  const updated = [...fields];
  const insertIdx = updated.findIndex(
    (f) => f.tag.localeCompare(newField.tag) > 0
  );
  if (insertIdx >= 0) {
    updated.splice(insertIdx, 0, newField);
  } else {
    updated.push(newField);
  }
  return updated;
}

// --- 300 field: Physical Description ---
function enrich300(
  record: MarcRecord,
  metadata: BookMetadata
): { record: MarcRecord; applied: boolean } {
  if (!metadata.pageCount && !metadata.heightCm) {
    return { record, applied: false };
  }

  const fieldIndex = record.dataFields.findIndex((f) => f.tag === "300");
  const newSubfields: MarcSubfield[] = [];

  if (metadata.pageCount) {
    newSubfields.push({ code: "a", value: `${metadata.pageCount} pages` });
  } else if (fieldIndex >= 0) {
    const existing = record.dataFields[fieldIndex].subfields.find(
      (sf) => sf.code === "a"
    );
    if (existing) newSubfields.push(existing);
  }

  if (fieldIndex >= 0) {
    const existingB = record.dataFields[fieldIndex].subfields.find(
      (sf) => sf.code === "b"
    );
    if (existingB) newSubfields.push(existingB);
  }

  if (metadata.heightCm) {
    newSubfields.push({ code: "c", value: `${metadata.heightCm} cm` });
  }

  if (newSubfields.length === 0) return { record, applied: false };

  const new300: MarcDataField = {
    tag: "300",
    ind1: " ",
    ind2: " ",
    subfields: newSubfields,
  };

  const updatedFields = [...record.dataFields];
  if (fieldIndex >= 0) {
    updatedFields[fieldIndex] = new300;
  } else {
    return {
      record: {
        ...record,
        dataFields: insertFieldInOrder(record.dataFields, new300),
      },
      applied: true,
    };
  }

  return { record: { ...record, dataFields: updatedFields }, applied: true };
}

// --- 264 $a: Publication Place ---
function enrich264(record: MarcRecord, publishPlace: string): MarcRecord {
  const fieldIndex = record.dataFields.findIndex((f) => f.tag === "264");
  if (fieldIndex < 0) return record;

  const field = record.dataFields[fieldIndex];
  const sfAIndex = field.subfields.findIndex((sf) => sf.code === "a");
  if (sfAIndex < 0) return record;

  const updatedSubfields = [...field.subfields];
  updatedSubfields[sfAIndex] = {
    code: "a",
    value: publishPlace + " :",
  };

  const updatedFields = [...record.dataFields];
  updatedFields[fieldIndex] = { ...field, subfields: updatedSubfields };

  return { ...record, dataFields: updatedFields };
}

// --- 520: Summary ---
function enrich520(record: MarcRecord, description: string): MarcRecord {
  const has520 = record.dataFields.some((f) => f.tag === "520");
  if (has520) return record;

  const new520: MarcDataField = {
    tag: "520",
    ind1: " ",
    ind2: " ",
    subfields: [{ code: "a", value: description }],
  };

  return {
    ...record,
    dataFields: insertFieldInOrder(record.dataFields, new520),
  };
}

// --- 050: LCC Call Number (from Open Library) ---
function enrich050(
  record: MarcRecord,
  lcClassification: string
): { record: MarcRecord; corrected: boolean } {
  const cutterMatch = lcClassification.match(/^(.+?)(\.[A-Z]\d*.*)$/);
  const subfields: MarcSubfield[] = cutterMatch
    ? [
        { code: "a", value: cutterMatch[1] },
        { code: "b", value: cutterMatch[2] },
      ]
    : [{ code: "a", value: lcClassification }];

  const new050: MarcDataField = {
    tag: "050",
    ind1: " ",
    ind2: "4",
    subfields,
  };

  const fieldIndex = record.dataFields.findIndex((f) => f.tag === "050");
  const updatedFields = [...record.dataFields];

  if (fieldIndex >= 0) {
    updatedFields[fieldIndex] = new050;
    return {
      record: { ...record, dataFields: updatedFields },
      corrected: true,
    };
  }

  return {
    record: {
      ...record,
      dataFields: insertFieldInOrder(record.dataFields, new050),
    },
    corrected: false,
  };
}

// --- 264 $b: Publisher Name ---
function enrich264Publisher(record: MarcRecord, publisher: string): MarcRecord {
  const fieldIndex = record.dataFields.findIndex((f) => f.tag === "264");
  if (fieldIndex < 0) return record;

  const field = record.dataFields[fieldIndex];
  const sfBIndex = field.subfields.findIndex((sf) => sf.code === "b");
  if (sfBIndex < 0) return record;

  const current = field.subfields[sfBIndex].value
    .replace(/[,\s]+$/, "")
    .toLowerCase();
  const apiVal = publisher.toLowerCase();

  if (current.includes(apiVal) || apiVal.includes(current)) return record;

  const updatedSubfields = [...field.subfields];
  updatedSubfields[sfBIndex] = {
    code: "b",
    value: publisher + ",",
  };

  const updatedFields = [...record.dataFields];
  updatedFields[fieldIndex] = { ...field, subfields: updatedSubfields };

  return { ...record, dataFields: updatedFields };
}

// --- 008 Field Builder: rebuild known positions programmatically ---
function rebuild008(
  record: MarcRecord,
  metadata: BookMetadata,
  warnings: string[]
): MarcRecord {
  const cf008Index = record.controlFields.findIndex((f) => f.tag === "008");
  if (cf008Index < 0) return record;

  let value = record.controlFields[cf008Index].value;

  // Pad to 40 chars if shorter
  if (value.length < 40) {
    value = value.padEnd(40, " ");
  }

  const chars = value.split("");

  // Positions 0-5: Record entry date (YYMMDD) — always server-generated
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const dateStr = yy + mm + dd;
  for (let i = 0; i < 6; i++) {
    chars[i] = dateStr[i];
  }

  // Position 6: Preserve 'm' (multipart) if AI set it, otherwise default 's'
  if (chars[6] !== "m") {
    chars[6] = "s";
  }

  // Positions 7-10: Publication year
  if (metadata.publishedDate) {
    const yearMatch = metadata.publishedDate.match(/^(\d{4})/);
    if (yearMatch) {
      const apiYear = yearMatch[1];
      const currentYear = value.substring(7, 11);
      if (currentYear !== apiYear) {
        if (
          currentYear.trim() &&
          currentYear !== "||||" &&
          currentYear !== "    "
        ) {
          warnings.push(
            `Publication date corrected: "${currentYear}" → "${apiYear}" (verified via external source).`
          );
        }
        for (let i = 0; i < 4; i++) {
          chars[7 + i] = apiYear[i];
        }
      }
    }
  }

  // Positions 11-14: blank for single date type 's'; preserve AI ending date for 'm'
  if (chars[6] === "s") {
    for (let i = 11; i <= 14; i++) {
      chars[i] = " ";
    }
  }

  // Positions 15-17: Country code from publication place
  if (metadata.publishPlace) {
    const countryCode = lookupCountryCode(metadata.publishPlace);
    if (countryCode && countryCode.length === 3) {
      const currentCountry = value.substring(15, 18);
      if (currentCountry !== countryCode) {
        for (let i = 0; i < 3; i++) {
          chars[15 + i] = countryCode[i];
        }
      }
    }
  }

  // Positions 18-34: keep AI-generated values (content-type specific)

  // Positions 35-37: Language code
  if (metadata.language) {
    const currentLang = value.substring(35, 38);
    if (currentLang !== metadata.language) {
      if (currentLang !== "   " && currentLang !== "|||") {
        warnings.push(
          `Language code corrected: "${currentLang}" → "${metadata.language}" (verified via external source).`
        );
      }
      for (let i = 0; i < 3; i++) {
        chars[35 + i] = metadata.language[i];
      }
    }
  }

  // Positions 38-39: keep AI-generated values

  // Ensure exactly 40 chars
  const newValue = chars.slice(0, 40).join("");

  const updatedControlFields = [...record.controlFields];
  updatedControlFields[cf008Index] = {
    ...record.controlFields[cf008Index],
    value: newValue,
  };

  return { ...record, controlFields: updatedControlFields };
}

// --- 245 Indicator 2: Nonfiling character count ---
function fix245Indicator2(
  record: MarcRecord,
  warnings: string[]
): { record: MarcRecord; corrected: boolean } {
  const fieldIndex = record.dataFields.findIndex((f) => f.tag === "245");
  if (fieldIndex < 0) return { record, corrected: false };

  // Check language — only auto-correct for English
  const cf008 = record.controlFields.find((f) => f.tag === "008");
  const langCode = cf008 && cf008.value.length >= 38
    ? cf008.value.substring(35, 38)
    : "";

  if (langCode && langCode !== "eng" && langCode !== "   " && langCode !== "|||") {
    // Non-English: skip auto-correction, warn if potential article detected
    const field = record.dataFields[fieldIndex];
    const sfA = field.subfields.find((sf) => sf.code === "a");
    if (sfA && /^(the|an?|le|la|les|der|die|das|el|los|las)\s/i.test(sfA.value)) {
      warnings.push(
        `245 indicator 2 (nonfiling characters) may need manual review for non-English title.`
      );
    }
    return { record, corrected: false };
  }

  const field = record.dataFields[fieldIndex];
  const sfA = field.subfields.find((sf) => sf.code === "a");
  if (!sfA) return { record, corrected: false };

  const title = sfA.value;
  let correctInd2 = "0";

  // English articles (case-insensitive)
  const articleMap: [RegExp, string][] = [
    [/^the\s/i, "4"],
    [/^an\s/i, "3"],
    [/^a\s/i, "2"],
  ];

  for (const [pattern, ind2Val] of articleMap) {
    if (pattern.test(title)) {
      correctInd2 = ind2Val;
      break;
    }
  }

  if (field.ind2 === correctInd2) return { record, corrected: false };

  const updatedFields = [...record.dataFields];
  updatedFields[fieldIndex] = { ...field, ind2: correctInd2 };

  return {
    record: { ...record, dataFields: updatedFields },
    corrected: true,
  };
}

// --- Main Enrichment ---
export async function enrichRecord(
  record: MarcRecord,
  versoText: string
): Promise<EnrichResult> {
  const warnings: string[] = [];
  let additionalSubjects: string[] = [];
  const fieldSources: Record<string, FieldSource> = {};

  try {
    let metadata: BookMetadata = {};

    // Extract and validate ISBN
    let isbn = extractIsbn(record, versoText);
    if (isbn) {
      const { valid } = validateIsbn(isbn);
      if (!valid) {
        warnings.push(
          `ISBN "${isbn}" failed checksum validation — skipping ISBN-based lookup. Please verify the ISBN.`
        );
        isbn = null;
      }
    }

    if (isbn) {
      metadata = await lookupByIsbn(isbn);
    }

    // Fallback to title+author if ISBN lookup found nothing useful
    if (!metadata.pageCount && !metadata.heightCm && !metadata.description) {
      const { title, author } = extractTitleAuthor(record);
      if (title) {
        metadata = await lookupByTitle(title, author);
      }
    }

    // Page count conflict detection
    if (metadata.pageCountGoogle && metadata.pageCountOpenLib) {
      const diff = Math.abs(
        metadata.pageCountGoogle - metadata.pageCountOpenLib
      );
      const avg =
        (metadata.pageCountGoogle + metadata.pageCountOpenLib) / 2;
      if (diff / avg > 0.05) {
        warnings.push(
          `Page count discrepancy: Google Books reports ${metadata.pageCountGoogle} pages, Open Library reports ${metadata.pageCountOpenLib} pages. Using ${metadata.pageCount}.`
        );
      }
    }

    // 300: Physical Description
    let enriched: MarcRecord;
    const result300 = enrich300(record, metadata);
    enriched = result300.record;
    if (result300.applied) {
      fieldSources["300"] = metadata.pageCountGoogle
        ? "google"
        : "openlibrary";
    } else {
      warnings.push(
        "Physical description (300 field) could not be verified via external sources — please check manually."
      );
    }

    // 264 $a: Publication Place
    if (metadata.publishPlace) {
      enriched = enrich264(enriched, metadata.publishPlace);
      fieldSources["264"] = "openlibrary";
    }

    // 520: Summary
    if (metadata.description) {
      enriched = enrich520(enriched, metadata.description);
      fieldSources["520"] = "google";
    }

    // 050: LCC Call Number
    if (metadata.lcClassification) {
      const result050 = enrich050(enriched, metadata.lcClassification);
      enriched = result050.record;
      fieldSources["050"] = "openlibrary";
      if (result050.corrected) {
        warnings.push(
          `LCC call number verified via Open Library: "${metadata.lcClassification}".`
        );
      }
    }

    // 264 $b: Publisher Name
    if (metadata.publisher) {
      enriched = enrich264Publisher(enriched, metadata.publisher);
    }

    // 008: Rebuild known positions (date entered, pub year, country, language)
    enriched = rebuild008(enriched, metadata, warnings);
    fieldSources["008"] = "computed";

    // 245 indicator 2: Fix nonfiling character count
    const result245 = fix245Indicator2(enriched, warnings);
    enriched = result245.record;
    if (result245.corrected) {
      fieldSources["245"] = "computed";
    }

    // ISBD punctuation correction (245, 264)
    const punctResult = fixIsbdPunctuation(enriched);
    enriched = punctResult.record;
    if (punctResult.corrections.length > 0) {
      warnings.push(...punctResult.corrections);
      for (const correction of punctResult.corrections) {
        if (correction.startsWith("245") && !fieldSources["245"]) {
          fieldSources["245"] = "computed";
        }
        if (correction.startsWith("264") && !fieldSources["264"]) {
          fieldSources["264"] = "computed";
        }
      }
    }

    // Additional subjects from Open Library
    if (metadata.subjects && metadata.subjects.length > 0) {
      additionalSubjects = metadata.subjects;
    }

    return {
      record: enriched,
      enrichmentWarnings: warnings,
      additionalSubjects,
      fieldSources,
    };
  } catch {
    warnings.push(
      "External metadata enrichment failed — please verify record manually."
    );
    return {
      record,
      enrichmentWarnings: warnings,
      additionalSubjects: [],
      fieldSources,
    };
  }
}
