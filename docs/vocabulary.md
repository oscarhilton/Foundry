# Foundry vocabulary (tray word cubes)

One physical cube = one word. Each visible word has exactly one grammatical role (TRAY-115).

## Starter kit (tray-lab pool — 6 cubes)

| Die | Role | Word | Face options (rotations) | UI label |
|-----|------|------|--------------------------|----------|
| home | place | HOME | HOME · WORK · OUTSIDE · COMMUTE | Place |
| moment | moment | MORNING | MORNING · AFTERNOON · EVENING · NIGHT | Moment |
| phenomenon | phenomenon | WIND | WIND · RAIN · SUN · SNOW | Condition |
| response | response | JACKET | JACKET · UMBRELLA · SUNGLASSES · GLOVES | Response |
| button | control | BUTTON | BUTTON (static) | Control |
| timer | control | TIMER | TIMER · 5 MIN · 15 MIN · 30 MIN | Control |

Pool order: HOME · MOMENT · PHENOMENON · RESPONSE · BUTTON · TIMER

## Orthogonal weather matrix

Four rotating axes form an orthogonal weather-response system. Any moment can pair with any phenomenon and any response — there are no forced tracks.

| Axis | Faces | Runtime token prefix |
|------|-------|---------------------|
| Place | HOME / WORK / OUTSIDE / COMMUTE | `place/*` |
| Moment | MORNING / AFTERNOON / EVENING / NIGHT | `moment/*` |
| Phenomenon | WIND / RAIN / SUN / SNOW | `phenomenon/*` |
| Response | JACKET / UMBRELLA / SUNGLASSES / GLOVES | `response/*` |

**Canonical pairings** (crisp answers): rain→umbrella, wind→jacket, sun→sunglasses, snow→gloves.

**Cross-pairings** (useful, not errors): e.g. wind→umbrella → "High winds make umbrellas unmanageable"; rain→jacket → waterproof advice.

Meaning comes from the **WeatherPackRenderer** domain renderer (threshold logic), not a full 256-combination lookup table.

## TRAY-115 audit

Automated in `packages/cube-defs/src/vocabulary-audit.test.ts`:

- **Tier 1 (ALL_WORD_CUBES):** temporal faceText only on moment; phenomenon faceText only on phenomenon; response faceText only on response; no faceText reused across axis roles; place cubes never carry phenomenon/response tokens
- **Tier 2 (STARTER_CUBES):** four rotating axes each have 4 distinct faceText values; button static; timer has 4 duration faces; canonical demo faces exist (rain on phenomenon, umbrella on response)

## Packs (catalog-only for now)

Additional words (London, Leaving, Glow, Chime, Motion, Calendar) live in the catalog but are not in the tray-lab starter pool yet. Catalog cubes obey the same global invariants.

## Display model

1. **Local translations** — one per slot, aligned under the cube row
2. **finalOutput** — one concise answer line from the domain renderer + moment context
3. **Cube face** — identity word (static cubes) or active face (place/moment/phenomenon/response/timer rotations)
4. **Phenomenon slot** — shows the fact line (`22% rain`, `18 km/h wind`, …), not a meta "WEATHER" label

## Grammar

Sentences are forgiving: `RAIN → UMBRELLA` works without place or moment. Default place is inferred silently when needed. Phenomenon and response axes do not require upstream binding — reorder hints differ from TRAY-109 lens rules.

## Runtime adapter

Each cube maps to a legacy parser token at the chain boundary (e.g. `phenomenon/rain` → weather identity) for `compileTrayState` → `parseChain()`. Product vocabulary must not leak parser tokens into UI.
