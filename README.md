# Foundry

Modular physical computing — snap cubes into a sentence, get ambient behaviour.

## Structure

- `apps/simulator` — React simulator (drag cubes, see outputs, signal log)
- `packages/runtime` — Chain parser, signal router, behaviour recipes
- `packages/cube-defs` — Cube library and JSON schema
- `docs/` — Protocol and hardware design notes
- `hardware/` — Schematics, firmware, enclosure specs

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
