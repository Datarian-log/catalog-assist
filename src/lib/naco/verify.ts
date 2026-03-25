export interface NacoResult {
  originalName: string;
  authorizedForm?: string;
  verified: boolean;
  lcUri?: string;
}

interface SuggestResult {
  hits: Array<{
    uri: string;
    aLabel: string;
    vLabel?: string;
  }>;
}

function normalizeName(name: string): string {
  return name
    .replace(/[.,;:]+$/, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Attempt to invert a direct-order name to MARC inverted form.
 * "J. K. Rowling" → "rowling, j. k."
 * "Gabriel García Márquez" → "garcía márquez, gabriel"
 */
function invertName(name: string): string | null {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return null;
  const last = parts[parts.length - 1];
  const rest = parts.slice(0, -1).join(" ");
  return normalizeName(`${last}, ${rest}`);
}

export async function verifyNameAuthority(
  name: string
): Promise<NacoResult> {
  const normalized = normalizeName(name);
  if (!normalized) {
    return { originalName: name, verified: false };
  }

  try {
    const url = `https://id.loc.gov/authorities/names/suggest2?q=${encodeURIComponent(normalized)}&count=20`;
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return { originalName: name, verified: false };
    }

    const data: SuggestResult = await response.json();
    const inverted = invertName(name);

    // Pass 1: Exact match on normalized name
    for (const hit of data.hits) {
      const hitNorm = normalizeName(hit.aLabel);
      if (hitNorm === normalized || (inverted && hitNorm === inverted)) {
        return {
          originalName: name,
          authorizedForm: hit.aLabel,
          verified: true,
          lcUri: hit.uri,
        };
      }
    }

    // Pass 2: Substring match (for cases like "Rowling, J. K." matching "Rowling, J. K., 1965-")
    for (const hit of data.hits) {
      const hitNorm = normalizeName(hit.aLabel);
      if (
        hitNorm.startsWith(normalized) ||
        (inverted && hitNorm.startsWith(inverted))
      ) {
        return {
          originalName: name,
          authorizedForm: hit.aLabel,
          verified: true,
          lcUri: hit.uri,
        };
      }
    }

    return { originalName: name, verified: false };
  } catch {
    return { originalName: name, verified: false };
  }
}

export async function verifyAllNames(
  names: string[]
): Promise<NacoResult[]> {
  return Promise.all(names.map(verifyNameAuthority));
}
