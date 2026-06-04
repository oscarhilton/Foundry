# Foundry marketing site

Next.js landing page — docs-aligned copy, mockup product photography, links to the simulator showcase.

## Dev

```bash
# From repo root
npm install
npm run dev:marketing
```

Open [http://localhost:3001](http://localhost:3001).

Run the simulator separately for showcase links:

```bash
npm run dev   # http://localhost:5173/?showcase=1
```

## Environment

Copy `.env.example` to `.env.local`:

```
NEXT_PUBLIC_SIMULATOR_URL=http://localhost:5173
```

Set to your deployed simulator URL in production.

## Assets

Product PNGs live in `public/marketing/`, cropped from the marketing mockup. Source manifest: originally from `foundry_mockup_assets/manifest.json`.

**Use raster crops for photography only** — all marketing copy is HTML in `src/content/site.ts` (aligned with `docs/use-model.md`, `docs/starter-kit.md`, showcase cards).

## Build

```bash
npm run build -w @foundry/marketing
```
