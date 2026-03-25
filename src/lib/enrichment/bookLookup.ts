export interface BookMetadata {
  pageCount?: number;
  heightCm?: number;
  language?: string; // MARC language code: "eng", "kor", etc.
  publishPlace?: string;
  description?: string;
  subjects?: string[];
  lcClassification?: string; // e.g. "QA76.73.J38"
  publishedDate?: string; // e.g. "2018", "2018-01-15"
  publisher?: string;
  pageCountGoogle?: number;
  pageCountOpenLib?: number;
}

// ISO 639-1 (Google Books) → MARC 21 language code
const LANG_MAP: Record<string, string> = {
  en: "eng",
  ko: "kor",
  ja: "jpn",
  zh: "chi",
  fr: "fre",
  de: "ger",
  es: "spa",
  it: "ita",
  pt: "por",
  ru: "rus",
  ar: "ara",
  hi: "hin",
  nl: "dut",
  sv: "swe",
  pl: "pol",
  tr: "tur",
  vi: "vie",
  th: "tha",
  cs: "cze",
  da: "dan",
  fi: "fin",
  el: "gre",
  he: "heb",
  hu: "hun",
  id: "ind",
  ms: "may",
  no: "nor",
  ro: "rum",
  uk: "ukr",
  la: "lat",
};

interface GoogleBooksResponse {
  totalItems: number;
  items?: Array<{
    volumeInfo: {
      pageCount?: number;
      language?: string;
      description?: string;
      publishedDate?: string;
      dimensions?: {
        height?: string;
        width?: string;
        thickness?: string;
      };
    };
  }>;
}

interface OpenLibraryEntry {
  number_of_pages?: number;
  physical_dimensions?: string;
  publish_places?: Array<{ name: string }>;
  subjects?: Array<{ name: string; url?: string }>;
  classifications?: { lc_classifications?: string[] };
  publishers?: Array<{ name: string }>;
}

interface OpenLibraryResponse {
  [key: string]: OpenLibraryEntry;
}

function parseHeightCm(dimensionStr: string): number | undefined {
  // Open Library format: "23.5 x 15.5 x 2.5 centimeters"
  const match = dimensionStr.match(/^([\d.]+)\s*x/);
  if (match) {
    const val = parseFloat(match[1]);
    if (!isNaN(val) && val > 0 && val < 100) return Math.round(val);
  }
  return undefined;
}

function parseGoogleHeight(heightStr: string): number | undefined {
  const cmMatch = heightStr.match(/([\d.]+)\s*cm/i);
  if (cmMatch) {
    const val = parseFloat(cmMatch[1]);
    if (!isNaN(val) && val > 0) return Math.round(val);
  }
  const inMatch = heightStr.match(/([\d.]+)\s*in/i);
  if (inMatch) {
    const val = parseFloat(inMatch[1]);
    if (!isNaN(val) && val > 0) return Math.round(val * 2.54);
  }
  return undefined;
}

async function fetchGoogleBooks(query: string): Promise<BookMetadata> {
  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1`;
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return {};

    const data: GoogleBooksResponse = await response.json();
    if (!data.items || data.items.length === 0) return {};

    const vol = data.items[0].volumeInfo;
    const result: BookMetadata = {};

    if (vol.pageCount && vol.pageCount > 0) {
      result.pageCount = vol.pageCount;
    }
    if (vol.dimensions?.height) {
      result.heightCm = parseGoogleHeight(vol.dimensions.height);
    }
    if (vol.language) {
      result.language = LANG_MAP[vol.language] || vol.language;
    }
    if (vol.description) {
      result.description = vol.description;
    }
    if (vol.publishedDate) {
      result.publishedDate = vol.publishedDate;
    }

    return result;
  } catch {
    return {};
  }
}

async function fetchOpenLibrary(isbn: string): Promise<BookMetadata> {
  try {
    const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${encodeURIComponent(isbn)}&format=json&jscmd=data`;
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return {};

    const data: OpenLibraryResponse = await response.json();
    const entry = data[`ISBN:${isbn}`];
    if (!entry) return {};

    const result: BookMetadata = {};

    if (entry.number_of_pages && entry.number_of_pages > 0) {
      result.pageCount = entry.number_of_pages;
    }
    if (entry.physical_dimensions) {
      result.heightCm = parseHeightCm(entry.physical_dimensions);
    }
    if (entry.publish_places && entry.publish_places.length > 0) {
      result.publishPlace = entry.publish_places[0].name;
    }
    if (entry.subjects && entry.subjects.length > 0) {
      result.subjects = entry.subjects.slice(0, 10).map((s) => s.name);
    }
    if (
      entry.classifications?.lc_classifications &&
      entry.classifications.lc_classifications.length > 0
    ) {
      result.lcClassification = entry.classifications.lc_classifications[0];
    }
    if (entry.publishers && entry.publishers.length > 0) {
      result.publisher = entry.publishers[0].name;
    }

    return result;
  } catch {
    return {};
  }
}

export async function lookupByIsbn(isbn: string): Promise<BookMetadata> {
  const [google, openLib] = await Promise.all([
    fetchGoogleBooks(`isbn:${isbn}`),
    fetchOpenLibrary(isbn),
  ]);

  return {
    pageCount: google.pageCount || openLib.pageCount,
    heightCm: google.heightCm || openLib.heightCm,
    language: google.language,
    publishPlace: openLib.publishPlace,
    description: google.description,
    subjects: openLib.subjects,
    lcClassification: openLib.lcClassification,
    publishedDate: google.publishedDate,
    publisher: openLib.publisher,
    pageCountGoogle: google.pageCount,
    pageCountOpenLib: openLib.pageCount,
  };
}

export async function lookupByTitle(
  title: string,
  author: string
): Promise<BookMetadata> {
  const query = author
    ? `intitle:${title}+inauthor:${author}`
    : `intitle:${title}`;
  return fetchGoogleBooks(query);
}
