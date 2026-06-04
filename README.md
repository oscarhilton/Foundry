# Foundry

Modular physical computing — snap cubes into a sentence, get ambient behaviour.

**Foundry is not a smart-home platform. It is a physical language for behaviours.**

**Current milestone: [M6 — Physical Sentence](docs/m6-physical-sentence.md)** — prove the object (`London → Weather → Light` on a desk). M1–M5 proved the language in the simulator.

**Before any cube ships, ask: Does this introduce a new kind of sentence?** Foundry optimises for chain *language*, not hardware SKU count. Aim for roughly ten sources and ten transforms — verbs matter more than data feeds.

Chains read as **Noun → Verb → Output** (e.g. `London → Weather → Light`). Full rules: [docs/grammar.md](docs/grammar.md).

**Showcase:** `npm run dev` then open `http://localhost:5173/?showcase=1`

## Structure

- `apps/simulator` — React simulator (drag cubes, see outputs, signal log)
- `packages/runtime` — Chain parser, signal router, behaviour recipes
- `packages/cube-defs` — Cube library and JSON schema
- `docs/` — Protocol, [product boundary](docs/product-boundary.md), [starter kit](docs/starter-kit.md), [M6](docs/m6-physical-sentence.md)
- `hardware/` — Schematics, firmware, [M6 E2E](hardware/m6-e2e-london-weather-light.md), [mockup sprint](hardware/mockup-sprint.md)

## Quick start

```bash
npm install
npm run dev      # simulator at http://localhost:5173
npm test         # runtime unit tests
```

## Chain grammar

Chains read left to right like a sentence. Segment consumption, multi-display load sharing, and viewport windows are specified in [docs/grammar.md](docs/grammar.md).

## MVP recipes

1. **London Weather Light** — ambient light from London weather
2. **Weather Dial Light** — dial scales weather → brightness
3. **Room Motion Chime** — motion triggers chime
