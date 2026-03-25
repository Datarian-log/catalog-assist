// Publication place → MARC 21 country code (3 chars, space-padded)
// Source: https://www.loc.gov/marc/countries/countries_code.html

const PLACE_TO_COUNTRY: Record<string, string> = {
  // United States — state-level codes
  "new york": "nyu",
  "brooklyn": "nyu",
  "manhattan": "nyu",
  "boston": "mau",
  "cambridge, mass": "mau",
  "chicago": "ilu",
  "san francisco": "cau",
  "los angeles": "cau",
  "berkeley": "cau",
  "seattle": "wau",
  "portland, or": "oru",
  "philadelphia": "pau",
  "princeton": "nju",
  "washington": "dcu",
  "washington, d.c.": "dcu",
  "minneapolis": "mnu",
  "ann arbor": "miu",
  "new haven": "ctu",
  "austin": "txu",
  "denver": "cou",
  "atlanta": "gau",
  "baltimore": "mdu",
  "indianapolis": "inu",

  // United Kingdom
  "london": "enk",
  "oxford": "enk",
  "cambridge": "enk",
  "edinburgh": "stk",
  "glasgow": "stk",
  "cardiff": "wlk",
  "dublin": "ie ",
  "belfast": "nik",

  // Canada
  "toronto": "onc",
  "montreal": "quc",
  "montréal": "quc",
  "vancouver": "bcc",
  "ottawa": "onc",

  // Europe
  "paris": "fr ",
  "lyon": "fr ",
  "berlin": "gw ",
  "munich": "gw ",
  "münchen": "gw ",
  "frankfurt": "gw ",
  "hamburg": "gw ",
  "amsterdam": "ne ",
  "leiden": "ne ",
  "rotterdam": "ne ",
  "madrid": "sp ",
  "barcelona": "sp ",
  "rome": "it ",
  "roma": "it ",
  "milan": "it ",
  "milano": "it ",
  "florence": "it ",
  "vienna": "au ",
  "wien": "au ",
  "zurich": "sz ",
  "zürich": "sz ",
  "geneva": "sz ",
  "genève": "sz ",
  "bern": "sz ",
  "brussels": "be ",
  "bruxelles": "be ",
  "lisbon": "po ",
  "lisboa": "po ",
  "stockholm": "sw ",
  "copenhagen": "dk ",
  "københavn": "dk ",
  "oslo": "no ",
  "helsinki": "fi ",
  "warsaw": "pl ",
  "warszawa": "pl ",
  "prague": "xr ",
  "praha": "xr ",
  "budapest": "hu ",
  "bucharest": "rm ",
  "athens": "gr ",
  "moscow": "ru ",
  "moskva": "ru ",
  "st. petersburg": "ru ",

  // Asia
  "tokyo": "ja ",
  "osaka": "ja ",
  "kyoto": "ja ",
  "seoul": "ko ",
  "서울": "ko ",
  "beijing": "cc ",
  "shanghai": "cc ",
  "hong kong": "cc ",
  "taipei": "ch ",
  "singapore": "si ",
  "mumbai": "ii ",
  "bombay": "ii ",
  "new delhi": "ii ",
  "delhi": "ii ",
  "kolkata": "ii ",
  "calcutta": "ii ",
  "bangalore": "ii ",
  "bangkok": "th ",
  "jakarta": "io ",
  "manila": "ph ",
  "hanoi": "vm ",
  "kuala lumpur": "my ",

  // Oceania
  "sydney": "at ",
  "melbourne": "at ",
  "canberra": "at ",
  "auckland": "nz ",
  "wellington": "nz ",

  // Latin America
  "mexico city": "mx ",
  "méxico": "mx ",
  "são paulo": "bl ",
  "rio de janeiro": "bl ",
  "buenos aires": "ag ",
  "bogotá": "ck ",
  "bogota": "ck ",
  "lima": "pe ",
  "santiago": "cl ",

  // Middle East & Africa
  "cairo": "ua ",
  "tel aviv": "is ",
  "jerusalem": "is ",
  "beirut": "le ",
  "istanbul": "tu ",
  "ankara": "tu ",
  "tehran": "ir ",
  "cape town": "sa ",
  "johannesburg": "sa ",
  "nairobi": "ke ",
  "lagos": "nr ",
};

export function lookupCountryCode(place: string): string | null {
  const normalized = place.toLowerCase().trim();

  // Try exact match first
  if (PLACE_TO_COUNTRY[normalized]) {
    return PLACE_TO_COUNTRY[normalized];
  }

  // Try substring match — check if any known place is contained in the input
  for (const [key, code] of Object.entries(PLACE_TO_COUNTRY)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return code;
    }
  }

  return null;
}
