# Resume Optimizer & ATS Scoring (Next.js 14/App Router)

A full-stack app to upload a resume (PDF/DOCX/Image), paste a Job Description, parse & analyze via Google Gemini, and return ATS score, recommendations, and an optimized, editable resume. Export as PDF/DOCX.

## Tech
- Next.js 14+/App Router (TypeScript)
- TailwindCSS
- @google/generative-ai (Gemini)
- pdf-parse, mammoth (PDF/DOCX parsing)
- tesseract.js (OCR for images)
- react-quill (WYSIWYG editor)
- pdfkit, docx (export)

## Setup
1. Copy `.env.local.example` to `.env.local` and set:
```
GOOGLE_API_KEY=your_key_here
```

2. Install deps and run dev:
```
npm install
npm run dev
```

Open http://localhost:3000.

## Usage
- Home: Upload resume (max 5MB) + paste JD → Analyze.
- Results: View ATS score, missing keywords, per-section recommendations, and edit the optimized resume. Download as HTML/PDF/DOCX.

## Notes
- OCR: tesseract.js works server-side; optionally set `TESSDATA_PREFIX` for custom language data.
- Exports are text-based from the editor HTML. For richer formatting, integrate a robust HTML→PDF/DOCX pipeline.
- Security: Files are processed transiently and not persisted.

## Optional extensions
- Auth (NextAuth.js) to save scans.
- Subscriptions (Stripe) for usage plans.
- Prompt tuning and structured response validation for Gemini.

## License
MIT
