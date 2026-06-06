# TRAY-114: Physical shape exploration protocol

**Scope:** foam prototypes and unbriefed participant tasks only. No software changes. TRAY-115 vocabulary and renderer work proceed independently in code.

## Axiom lock (do not violate during shape tests)

1. **One cube = one word** — shape must not imply bundled categories
2. **Four faces per rotating axis** — place, moment, phenomenon, response cubes each expose exactly four readable faces
3. **Active face is largest** — the face the user turned toward them is the word the tray reads
4. **Tray reads left-to-right** — slot order is sentence order; shape must not suggest drag-to-reorder UI
5. **Dual-layer output** — tray surface shows locals + one final line; shape exploration does not change copy rules

If a prototype breaks an axiom, discard it regardless of participant preference.

## Foam variants (A–E)

Build five cube/tray pairs from foam or 3D-printed blanks. Label faces with adhesive tape only — no electronics.

| Variant | Cube form | Tray form | Hypothesis |
|---------|-----------|-----------|------------|
| **A — Classic die** | 40 mm cube, chamfered edges, word on each face | Flat rectangular tray, five shallow recesses | Baseline — familiar die affordance |
| **B — Rounded brick** | 45 × 30 × 30 mm rounded rectangle, word on long face | Same tray as A | Softer, less "game piece" |
| **C — Low profile** | 50 × 50 × 18 mm slab, word debossed on top face when seated | Tray with magnetic wells, cubes lie flat | Reduces tower height; emphasizes tray surface |
| **D — Tall token** | 35 mm diameter cylinder, four flat sides with words | Grooved rail tray, cubes stand upright | Strong slot identity; risk of tipping |
| **E — Tray-led** | Minimal 30 mm cubes, tiny identity mark only | Tray with embossed word per slot; cubes are orientation keys | Tests whether tray carries vocabulary |

Run all five with the same task battery. Do not mix variants mid-session.

## Unbriefed tasks (say nothing else)

Use physical props only — no tray-lab screen during shape sessions.

1. **Placement:** "Put these where they belong." (tray + 4 word cubes: HOME, MORNING, RAIN, UMBRELLA)
2. **Rotation:** "Show me what you'd check before leaving in the morning." (same cubes)
3. **Change one thing:** "Now show me a different answer without moving where you are." (expects response rotation)
4. **Explain back:** "What is this thing? What are these blocks?"

Record video. Note first unprompted action (pick up, rotate, stack, ignore tray).

## Pass / fail criteria

### Pass (variant advances)

- ≥3 of 5 participants complete task 1 without asking "is this an app?"
- ≥2 of 5 discover rotation in task 2 or 3 without facilitator hint
- ≥3 of 5 describe cubes as **words** or **labels**, tray as **reader** or **surface**
- No participant treats cubes as draggable cards (stacking for storage is OK; stacking as "UI" is a fail signal)

### Fail (variant discarded)

- Participant consistently reads wrong face (identity vs active) — typography/shape fault
- Participant ignores tray and arranges cubes in a line on the table — tray affordance failed
- Participant asks "which one is selected?" — selection chrome leaked into physical form
- Facilitator must explain rotation more than once per session — affordance too hidden

### Tie-break

When two variants pass, prefer the one with:

1. Fewer facilitator corrections on rotation
2. Faster task 1 completion (median time)
3. Lower stack height when seated in tray (C/D tradeoff)

## Session logistics

- **N = 5** unbriefed participants per variant (25 total across A–E)
- **5 minutes** silence after handoff before first question allowed from facilitator
- **No** tray-lab URL, no observer panel, no milestone JSON — paper notes only
- Photograph final arrangement after each task

## Deliverable

One-page recommendation: winning variant + required changes before injection molding. Link from hardware backlog; do not merge shape decisions into `vocabulary.ts` or runtime.

## Relation to TRAY-115

| Ticket | Layer |
|--------|-------|
| TRAY-114 | Physical foam — shape, affordance, readability |
| TRAY-115 | Software — orthogonal matrix, domain renderer, silent-test grammar |

Shape winners must still satisfy the four-face axis axiom before tooling.
