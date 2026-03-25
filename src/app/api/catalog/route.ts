import { NextResponse } from "next/server";
import { generateCatalogRecord } from "@/lib/ai/generate";
import { parseMarcResponse } from "@/lib/marc/parser";
import { CatalogRequest, MarcRecord, FieldSource } from "@/lib/marc/types";
import { verifyAllCandidates } from "@/lib/lcsh/verify";
import { enrichRecord } from "@/lib/enrichment/enrich";
import { verifyAllNames, NacoResult } from "@/lib/naco/verify";

function extractNameFields(record: MarcRecord): string[] {
  return record.dataFields
    .filter((f) => f.tag === "100" || f.tag === "700")
    .map((f) => f.subfields.find((sf) => sf.code === "a")?.value || "")
    .filter((n) => n.length > 0);
}

function applyNameCorrections(
  record: MarcRecord,
  originalNames: string[],
  nacoResults: NacoResult[]
): { record: MarcRecord; warnings: string[]; fieldSources: Record<string, FieldSource> } {
  const warnings: string[] = [];
  const fieldSources: Record<string, FieldSource> = {};
  let updatedFields = [...record.dataFields];

  for (const result of nacoResults) {
    if (!result.verified || !result.authorizedForm) continue;

    // Find the matching field by original name
    const fieldIndex = updatedFields.findIndex(
      (f) =>
        (f.tag === "100" || f.tag === "700") &&
        f.subfields.some((sf) => sf.code === "a" && sf.value === result.originalName)
    );
    if (fieldIndex < 0) continue;

    const field = updatedFields[fieldIndex];
    const currentName = result.originalName.replace(/[.,;:]+$/, "").trim();
    const authorizedName = result.authorizedForm.replace(/[.,;:]+$/, "").trim();

    // Only correct if the authorized form differs
    if (currentName.toLowerCase() !== authorizedName.toLowerCase()) {
      const updatedSubfields = field.subfields.map((sf) =>
        sf.code === "a" ? { ...sf, value: result.authorizedForm! } : sf
      );
      updatedFields = [...updatedFields];
      updatedFields[fieldIndex] = { ...field, subfields: updatedSubfields };
      warnings.push(
        `Author name standardized: "${result.originalName}" → "${result.authorizedForm}" (LC Name Authority File).`
      );
    }

    fieldSources[field.tag] = "lc";
  }

  return {
    record: { ...record, dataFields: updatedFields },
    warnings,
    fieldSources,
  };
}

export async function POST(request: Request) {
  try {
    const body: CatalogRequest = await request.json();

    if (!body.titlePageText?.trim()) {
      return NextResponse.json(
        { error: "Title page text is required." },
        { status: 400 }
      );
    }

    const provider = body.provider || "claude";

    if (provider === "claude" && !process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured." },
        { status: 500 }
      );
    }
    if (provider === "gemini" && !process.env.GOOGLE_AI_API_KEY) {
      return NextResponse.json(
        { error: "GOOGLE_AI_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const rawText = await generateCatalogRecord(
      provider,
      body.titlePageText,
      body.versoText || ""
    );

    const { record, warnings, subjectCandidates } = parseMarcResponse(
      rawText
    );

    // Run enrichment, LCSH verification, and NACO verification in parallel
    const nameFields = extractNameFields(record);
    const [enrichResult, verifiedAiCandidates, nacoResults] = await Promise.all([
      enrichRecord(record, body.versoText || ""),
      Promise.all(
        subjectCandidates.map(async (group) => ({
          candidates: await verifyAllCandidates(group.candidates),
        }))
      ),
      verifyAllNames(nameFields),
    ]);

    const { record: enrichedRecord, enrichmentWarnings, additionalSubjects } =
      enrichResult;

    // Apply NACO name corrections to enriched record
    const { record: nameFixedRecord, warnings: nameWarnings, fieldSources: nameFieldSources } =
      applyNameCorrections(enrichedRecord, nameFields, nacoResults);

    // Verify Open Library additional subjects (depends on enrichment)
    const allVerifiedCandidates = [...verifiedAiCandidates];
    if (additionalSubjects.length > 0) {
      const olCandidates = additionalSubjects.map((subj) => ({
        subfields: [{ code: "a" as const, value: subj }],
      }));
      const verifiedOl = await verifyAllCandidates(olCandidates);
      allVerifiedCandidates.push({ candidates: verifiedOl });
    }

    const mergedFieldSources = { ...enrichResult.fieldSources, ...nameFieldSources };

    return NextResponse.json({
      record: nameFixedRecord,
      warnings: [...warnings, ...enrichmentWarnings, ...nameWarnings],
      subjectCandidates: allVerifiedCandidates,
      fieldSources: mergedFieldSources,
    });
  } catch (error) {
    console.error("Catalog API error:", error);
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
