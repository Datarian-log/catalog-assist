# AI-Powered Library Cataloging Tool

An AI-powered tool that automatically generates MARC21 bibliographic records from book title pages and verso (copyright) pages, following RDA, MARC21, LCSH, and LCC standards.

## Motivation

This project started from a simple idea born out of hands-on experience: **what if you could just take a photo of the title page and have the record generated automatically?**

But speed alone isn't enough — cataloging demands accuracy. So this tool is designed around **verifiable, evidence-based record creation**:

- **LCSH subject headings** are proposed by AI but verified against the LC Authorities API, with verified/unverified status clearly shown for the cataloger to review
- **Author name authority control** — 100/700 field names are verified against the LC Name Authority File (NACO), automatically standardizing to the authorized form (e.g., "J.K. Rowling" → "Rowling, J. K.")
- **Physical description (300 field)** is never guessed by AI — page count and dimensions are retrieved from Google Books and Open Library using real publication data
- **LCC call numbers (050 field)** are verified against Open Library's LC classification data when available
- **Publication dates, language codes, publisher names, and publication places** are all cross-checked against external sources — AI-generated values are corrected automatically when discrepancies are found
- **ISBN checksum validation** — OCR-extracted ISBNs are verified before external lookups, preventing cascading errors from a single misread digit
- **008 field built programmatically** — the 40-character fixed-length field is assembled by code (not AI), eliminating length/position errors; multipart items (008 pos. 6 = 'm') are correctly preserved
- **Series and multivolume handling** — AI prompt distinguishes edition statements (250), series (490/830), and multipart monographs (245 $n/$p) to prevent field confusion
- **ISBD punctuation auto-corrected** — title and publication fields are post-processed to enforce correct ISBD punctuation rules
- **Data source transparency** — every field shows its origin (AI, Google Books, Open Library, LC Authorities, or auto-corrected) so the cataloger knows what to trust
- **Parallel API processing** — enrichment, LCSH verification, and name authority verification run concurrently, reducing response time by 2-5 seconds
- **Dual input modes**: type in the text directly, or snap a photo of the title page and verso — OCR handles the rest

## Features

- **AI-powered MARC21 record generation** — choose between Claude or Gemini to generate bibliographic records
- **Photo-based input** — photograph the title page and verso, and Tesseract.js OCR extracts the text for cataloging
- **ISBN checksum validation** — ISBN-10/13 checksums are verified before external API calls; invalid ISBNs trigger a warning and fall back to title/author lookup instead of contaminating the record
- **LCSH subject verification** — subject heading candidates are automatically verified against the LC Authorities API; the cataloger makes the final selection
- **Name authority control (NACO)** — author names in 100/700 fields are verified against the LC Name Authority File and standardized to the authorized heading form
- **700 field support** — additional authors, editors, translators, and illustrators are extracted with proper relationship designators ($e)
- **Series and multivolume handling** — edition statements (250), series (490/830), and multipart monographs (245 $n/$p) are distinguished by enhanced AI instructions; 008 position 6 correctly handles multipart items ('m') vs single dates ('s')
- **External metadata enrichment** — page count, dimensions, publication place, publisher, language, LCC call number, publication date, and summary are all sourced or verified from Google Books and Open Library APIs
- **008 field builder** — record entry date, publication year, country code, and language code are set programmatically; AI-generated content-type positions are preserved; multipart date types preserved
- **245 indicator auto-correction** — nonfiling character count (indicator 2) is calculated from English article rules ("The " → 4, "An " → 3, "A " → 2)
- **ISBD punctuation correction** — 245 and 264 fields are automatically corrected to follow ISBD punctuation conventions
- **Data conflict detection** — when Google Books and Open Library report different page counts, both values are shown to the cataloger with a warning
- **Field source badges** — each field in the UI displays its data source (GB = Google Books, OL = Open Library, LC = LC Authorities, auto = rule-based correction)
- **Parallel API processing** — enrichment, LCSH verification, and NACO verification run concurrently via `Promise.all`, reducing total response time by 2-5 seconds
- **Record export** — export in ISO 2709 (.mrc) and MARCXML (.xml) formats

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **AI:** Anthropic Claude API, Google Gemini API
- **OCR:** Tesseract.js

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Create a `.env.local` file with your API keys:

```bash
cp .env.example .env.local
```

```env
ANTHROPIC_API_KEY=your_anthropic_api_key
GOOGLE_AI_API_KEY=your_google_ai_api_key
```

- `ANTHROPIC_API_KEY`: Available from the [Anthropic Console](https://console.anthropic.com/) (paid)
- `GOOGLE_AI_API_KEY`: Available for free from [Google AI Studio](https://aistudio.google.com/apikey)

Only one key is required — you can use whichever provider you have access to.

### 3. Run the development server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## How It Works

```
Type text directly          Photograph title page + verso
        |                              |
        |                       OCR text extraction
        |                              |
        +-------------+---------------+
                      v
       AI record generation (Claude / Gemini)
                      |
                      v
            JSON parsing & validation
                      |
                      v
              ISBN checksum validation
           (invalid → skip ISBN lookup,
            fall back to title/author)
                      |
    +-----------------+-----------------+  ← Promise.all (parallel)
    |                 |                 |
    v                 v                 v
  Enrichment       Verify LCSH       Verify NACO
  pipeline         candidates        (100/700 names)
  (GB + OL APIs)   (LC Auth API)     (LC Name Auth)
    |                 |                 |
    v                 |                 |
  300, 264, 050,      |                 |
  520, 008 rebuild,   |                 |
  245 ind2, ISBD      |                 |
    |                 |                 |
    +-----------------+-----------------+
                      |
                      v
         OL additional subjects verify
         + Name corrections applied
         + Field source badges assigned
           (GB / OL / LC / auto / AI)
                      |
                      v
         Cataloger selects subject headings
                      |
                      v
           Export record (.mrc / .xml)
```

The enrichment pipeline verifies, corrects, and augments AI-generated fields:

- **ISBN validation** — checksum verification before external lookups (prevents cascading OCR errors)
- **050** LCC call number → Open Library `lc_classifications`
- **100/700** author names → verified via **LC Name Authority File** (NACO); standardized to authorized form
- **008** rebuilt programmatically:
  - pos. 0-5: record entry date (server-generated, always accurate)
  - pos. 6: date type (`s` for single known date, `m` for multipart — AI value preserved)
  - pos. 7-10: publication year → Google Books `publishedDate`
  - pos. 11-14: ending date for multipart items (AI value preserved when pos. 6 = `m`)
  - pos. 15-17: country code → publication place mapping (~120 cities)
  - pos. 35-37: language code → Google Books `language`
  - pos. 18-34, 38-39: AI-generated values preserved
- **245 ind2** nonfiling character count → auto-calculated from English articles
- **264 $a** publication place → Open Library `publish_places`
- **264 $b** publisher name → Open Library `publishers`
- **300** page count and dimensions → Google Books + Open Library (with conflict detection)
- **520** summary → Google Books `description`
- **245, 264** ISBD punctuation → auto-corrected via regex post-processing

## Data Sources & Verification

Each MARC field is sourced and verified differently. The table below shows where each field's data comes from and how it is validated:

| MARC Field | Description | Primary Source | Verification / Enrichment |
|------------|-------------|----------------|---------------------------|
| **LDR** | Leader (24 chars) | AI-generated | Fixed structure per MARC21 rules |
| **008** | Fixed-length data (40 chars) | **Programmatic builder** | Pos. 0-5: server date; pos. 7-10: **Google Books** `publishedDate`; pos. 15-17: publication place → country code mapping; pos. 35-37: **Google Books** `language`; pos. 18-34: AI-generated (preserved) |
| **020** | ISBN | Extracted from input text | Read directly from verso text; **checksum validated** before use in API lookups |
| **050** | LCC call number | AI-estimated | Verified/enriched via **Open Library** `lc_classifications` when available |
| **100** | Main entry — personal name | AI-generated | Verified against **[LC Name Authority File](https://id.loc.gov/)** (NACO); standardized to authorized form |
| **245** | Title statement | AI-generated | **Indicator 2 auto-corrected** (nonfiling chars); **ISBD punctuation auto-corrected**; **$n/$p** for multipart volumes |
| **250** | Edition statement | AI-generated | AI instructed to distinguish editions from volume numbers and printings |
| **264** | Publication info | AI-generated | **$a** enriched via **Open Library**; **$b** verified via **Open Library** `publishers`; **ISBD punctuation auto-corrected** |
| **300** | Physical description | **External APIs** | Page count from **Google Books + Open Library** (with **conflict detection** if sources disagree) |
| **336/337/338** | Content/media/carrier type | AI-generated | Fixed values for book materials (text / unmediated / volume) |
| **490** | Series statement | AI-generated | Enhanced AI prompt distinguishes series from editions and volumes |
| **520** | Summary | **Google Books API** | Added automatically from Google Books description |
| **650** | Subject headings (LCSH) | AI candidates + **Open Library** subjects | All candidates verified against **[LC Authorities API](https://id.loc.gov/)** |
| **700** | Added entry — personal name | AI-generated | Verified against **[LC Name Authority File](https://id.loc.gov/)** (NACO); standardized to authorized form |
| **830** | Series added entry | AI-generated | Generated as traced counterpart for 490 fields |

### Field Source Badges

The UI displays a small badge next to each field indicating its data source:

| Badge | Source | Meaning |
|-------|--------|---------|
| **GB** (blue) | Google Books | Data verified or sourced from Google Books API |
| **OL** (orange) | Open Library | Data verified or sourced from Open Library API |
| **LC** (green) | LC Authorities | Subject heading or author name verified against Library of Congress |
| **auto** (purple) | System rules | Auto-corrected by deterministic rules (008 builder, 245 ind2, ISBD punctuation) |
| *(none)* | AI-generated | Default — field value comes directly from AI with no external verification |

## Quality Safeguards

The system applies multiple layers of validation and correction to minimize cataloging errors:

| Safeguard | Problem Addressed | How It Works |
|-----------|-------------------|--------------|
| **ISBN checksum** | OCR misreads (0↔O, 1↔l) corrupt API lookups | ISBN-10/13 checksum validated before any external API call; invalid ISBNs trigger warning + title/author fallback |
| **008 field builder** | AI miscounts characters in 40-char fixed field | Known positions (date, country, language) built by code; AI only fills content-type positions |
| **245 ind2 correction** | AI frequently miscalculates nonfiling characters | Rule-based: "The "→4, "An "→3, "A "→2; skips non-English titles with warning |
| **ISBD punctuation** | AI inconsistently applies ISBD conventions | Post-processing enforces correct trailing punctuation in 245 ($a : $b / $c.) and 264 ($a : $b, $c.) |
| **Data conflict detection** | Google Books and Open Library disagree on page count | Both values shown with warning when difference exceeds 5% |
| **Name authority (NACO)** | Author names lack standardization across records | 100/700 names verified against LC Name Authority File; authorized form applied automatically |
| **Series/multivolume distinction** | AI confuses editions, volumes, and series | Enhanced prompt rules distinguish 250 (edition), 490/830 (series), and 245 $n/$p (multipart); 008 pos. 6 preserves 'm' for multipart items |
| **Country code mapping** | AI guesses MARC country codes for 008 pos. 15-17 | ~120 publishing cities mapped to official MARC country codes |
| **Parallel API processing** | Sequential API calls cause 10-20s response times | Enrichment, LCSH verification, and NACO verification run concurrently via Promise.all, saving 2-5s |
| **Source transparency** | Cataloger can't tell which data needs manual review | Color-coded badges show data origin per field |

## Project Structure

```
src/
├── app/
│   ├── page.tsx                  # Main page
│   └── api/
│       ├── catalog/route.ts      # MARC record generation API
│       ├── export/               # Record export API
│       └── lcsh-verify/          # LCSH verification API
├── components/
│   ├── input/                    # Text/image input forms, AI provider selector
│   ├── marc/                     # MARC record display, subject selector, source badges
│   ├── export/                   # Export buttons
│   └── layout/                   # Header, Footer
├── hooks/
│   └── useCatalog.ts             # Cataloging state management
└── lib/
    ├── ai/generate.ts            # AI provider abstraction layer
    ├── claude/                   # Anthropic client & prompts
    ├── gemini/                   # Google Gemini client
    ├── enrichment/               # External API metadata enrichment
    │   ├── enrich.ts             # Enrichment pipeline orchestration
    │   └── bookLookup.ts         # Google Books + Open Library API clients
    ├── isbn/                     # ISBN checksum validation
    ├── lcsh/                     # LC Authorities subject verification
    ├── naco/                     # LC Name Authority File (NACO) verification
    ├── marc/                     # MARC types, parser, punctuation, country codes
    │   ├── types.ts              # MarcRecord, FieldSource types
    │   ├── parser.ts             # AI response parser & validator
    │   ├── punctuation.ts        # ISBD punctuation auto-correction
    │   └── countryCodes.ts       # Publication place → MARC country code mapping
    └── ocr/                      # Tesseract.js OCR
```

## Cataloging Standards

| Standard | Usage |
|----------|-------|
| **RDA** | Descriptive cataloging rules (245, 264, 300, 336/337/338, etc.) |
| **MARC21** | Bibliographic record format (leader, 008, control fields) |
| **LCSH** | Subject headings (650 fields, verified via LC Authorities API) |
| **LCC** | Classification numbers (050 field) |
| **ISBD** | Punctuation conventions (auto-enforced in 245, 264 fields) |
