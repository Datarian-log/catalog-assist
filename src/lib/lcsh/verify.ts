import { LcshCandidate, MarcSubfield } from "@/lib/marc/types";

interface SuggestResult {
  hits: Array<{
    uri: string;
    aLabel: string;
    vLabel?: string;
  }>;
}

function getHeadingString(subfields: MarcSubfield[]): string {
  return subfields
    .map((sf) => {
      if (sf.code === "a") return sf.value;
      return `--${sf.value}`;
    })
    .join("");
}

function getMainTerm(subfields: MarcSubfield[]): string {
  const main = subfields.find((sf) => sf.code === "a");
  return main?.value || "";
}

export async function verifyLcshCandidate(
  candidate: LcshCandidate
): Promise<LcshCandidate> {
  const mainTerm = getMainTerm(candidate.subfields);
  if (!mainTerm) {
    return { ...candidate, verified: false };
  }

  try {
    const url = `https://id.loc.gov/authorities/subjects/suggest2?q=${encodeURIComponent(mainTerm)}&count=20`;
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return { ...candidate, verified: false };
    }

    const data: SuggestResult = await response.json();
    const fullHeading = getHeadingString(candidate.subfields)
      .replace(/\.$/, "")
      .toLowerCase();

    // Check for exact match on the main term or full heading
    for (const hit of data.hits) {
      const label = hit.aLabel.toLowerCase();
      if (label === mainTerm.replace(/\.$/, "").toLowerCase()) {
        return {
          ...candidate,
          verified: true,
          lcUri: hit.uri,
        };
      }
    }

    // Also try matching the full heading string
    for (const hit of data.hits) {
      const label = hit.aLabel.toLowerCase();
      if (fullHeading.includes(label) || label.includes(fullHeading)) {
        return {
          ...candidate,
          verified: true,
          lcUri: hit.uri,
        };
      }
    }

    return { ...candidate, verified: false };
  } catch {
    return { ...candidate, verified: false };
  }
}

export async function verifyAllCandidates(
  candidates: LcshCandidate[]
): Promise<LcshCandidate[]> {
  return Promise.all(candidates.map(verifyLcshCandidate));
}
