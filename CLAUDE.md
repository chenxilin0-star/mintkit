# MintKit

## Project Overview
AI Digital Product Generator — turns any niche into sellable PDF products (Planner/Checklist/Guide) using GPT-4o. MVP completed Week 1.

## Tech Stack
- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- OpenAI GPT-4o for content generation
- html2pdf.js for client-side PDF rendering
- Vercel for deployment

## Key Files
- `src/app/page.tsx` — Main UI (niche input → ideas → preview → download)
- `src/app/api/generate-ideas/route.ts` — GPT-4o idea generation API
- `src/app/api/generate-product/route.ts` — GPT-4o content generation API
- `src/lib/pdfGenerator.ts` — html2pdf.js client-side PDF generation
- `src/lib/openai.ts` — OpenAI API wrapper
- `.env.local` — OPENAI_API_KEY (not committed)

## Environment Variables
```
OPENAI_API_KEY=sk-...  # Required
```

## Commands
```bash
npm run dev     # Development
npm run build   # Production build
npm run start  # Production server
```

## Status
Week 1 MVP complete — All P0 features implemented:
- Niche → 5 GPT-4o generated ideas
- Select idea → Full product content generation
- PDF download (client-side via html2pdf.js)
- Copy to clipboard
- Gumroad upload guide

**Next:** Deploy to Vercel, add OpenAI API key, test full flow.
