# AI-Powered Library Cataloging Tool

An AI-powered tool that generates MARC21 bibliographic records from book title pages and verso (copyright) pages — with external verification against LC Authorities, Google Books, and Open Library so the cataloger knows what to trust.

**Live Demo:** [catalog-assist.vercel.app](https://catalog-assist.vercel.app)

## Features

- **AI-powered MARC21 generation** — Claude or Gemini produces a full bibliographic record from title page text
- **Photo input + OCR** — photograph the title page and verso; Tesseract.js extracts the text
- **LCSH subject verification** — AI-proposed headings verified against the [LC Authorities API](https://id.loc.gov/); cataloger makes the final selection
- **Name authority control (NACO)** — 100/700 author names verified against the [LC Name Authority File](https://id.loc.gov/) and standardized to the authorized form
- **External metadata enrichment** — page count, dimensions, publisher, LCC call number, summary, and more sourced from [Google Books](https://developers.google.com/books) and [Open Library](https://openlibrary.org/developers/api) APIs
- **ISBN checksum validation** — ISBN-10/13 verified before API lookups; invalid ISBNs fall back to title/author search
- **Series & multivolume handling** — distinguishes edition (250), series (490/830), and multipart monographs (245 $n/$p); 008 pos. 6 handles 'm' correctly
- **008 field builder** — 40-character fixed field assembled programmatically, not by AI
- **ISBD punctuation & 245 indicator auto-correction**
- **Field source badges** — each field shows its origin (Google Books / Open Library / LC Authorities / auto / AI)
- **Parallel API processing** — enrichment, LCSH, and NACO run concurrently via `Promise.all`
- **Export** — ISO 2709 (.mrc) and MARCXML (.xml)

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **AI:** Anthropic Claude API, Google Gemini API
- **OCR:** Tesseract.js

## Getting Started

```bash
npm install
cp .env.example .env.local
```

Add your API key(s) to `.env.local`:

```env
ANTHROPIC_API_KEY=your_anthropic_api_key
GOOGLE_AI_API_KEY=your_google_ai_api_key
```

- `ANTHROPIC_API_KEY` — [Anthropic Console](https://console.anthropic.com/) (paid)
- `GOOGLE_AI_API_KEY` — [Google AI Studio](https://aistudio.google.com/apikey) (free)

Only one key is required.

```bash
npm run dev
```

## How It Works

```
Text input / Photo + OCR
            |
   AI record generation (Claude / Gemini)
            |
   JSON parsing + ISBN checksum validation
            |
   +--------+---------+     ← Promise.all (parallel)
   |        |         |
Enrichment  LCSH     NACO
(GB + OL)  verify    verify
   |        |         |
   +--------+---------+
            |
   OL subjects verify + name corrections + source badges
            |
   Cataloger selects subjects → Export (.mrc / .xml)
```

## Data Sources

| MARC Field | Description | Source | Verification |
|------------|-------------|--------|--------------|
| **008** | Fixed-length data | Programmatic | Date, country, language from Google Books; AI fills content-type positions |
| **020** | ISBN | Input text | Checksum validated before API lookups |
| **050** | LCC call number | AI | Verified via Open Library `lc_classifications` |
| **100/700** | Personal names | AI | Verified against [LC Name Authority File](https://id.loc.gov/) (NACO) |
| **245** | Title statement | AI | Indicator 2 + ISBD punctuation auto-corrected; $n/$p for multipart |
| **264** | Publication info | AI | Place + publisher enriched via Open Library; ISBD auto-corrected |
| **300** | Physical description | Google Books + Open Library | Conflict detection when sources disagree |
| **490/830** | Series | AI | Enhanced prompt distinguishes series from editions/volumes |
| **520** | Summary | Google Books | Added automatically from description |
| **650** | Subject headings | AI + Open Library | Verified against [LC Authorities API](https://id.loc.gov/) |

## Project Structure

```
src/
├── app/
│   ├── page.tsx                  # Main page
│   └── api/
│       ├── catalog/route.ts      # MARC record generation
│       ├── export/               # Record export
│       └── lcsh-verify/          # LCSH verification
├── components/
│   ├── input/                    # Text/image input, AI provider selector
│   ├── marc/                     # Record display, subject selector, source badges
│   ├── export/                   # Export buttons
│   └── layout/                   # Header, Footer
├── hooks/
│   └── useCatalog.ts             # Cataloging state management
└── lib/
    ├── ai/generate.ts            # AI provider abstraction
    ├── claude/                   # Anthropic client & prompts
    ├── gemini/                   # Google Gemini client
    ├── enrichment/               # Google Books + Open Library enrichment
    ├── isbn/                     # ISBN checksum validation
    ├── lcsh/                     # LC Authorities subject verification
    ├── naco/                     # LC Name Authority (NACO) verification
    ├── marc/                     # Types, parser, punctuation, country codes
    └── ocr/                      # Tesseract.js OCR
```

Standards: RDA, MARC21, LCSH, LCC, ISBD
