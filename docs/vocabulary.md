# Foundry vocabulary (tray word cubes)

One physical cube = one word. Faces = modes of that word.

## Starter kit (tray-lab pool)

| Cube | Role | Word | Modes | UI label |
|------|------|------|-------|----------|
| home | place | HOME | Home / Outside / Door / Away | Place |
| morning | moment | MORNING | Work / Weekend / Quick / Full | Moment |
| weather | source | WEATHER | Full / Temp / Rain / Wind | Source |
| umbrella | lens | UMBRELLA | Any / Heavy / Today / Now | Decision |
| wear | lens | WEAR | Light / Warm / Rain / Smart | Decision |
| button | control | BUTTON | Press / Hold / Toggle / Quiet | Control |
| timer | control | TIMER | 5 / 10 / 15 / 30 | Control |

## Packs (catalog-only for now)

Additional words (London, Leaving, Glow, Chime, Motion, Calendar) live in the catalog but are not in the tray-lab starter pool yet.

## Display model

1. **Local translations** — one per slot, aligned under the cube row
2. **finalOutput** — one concise answer line composed from primary decision + moment context

## Grammar

Sentences are forgiving: `WEATHER → UMBRELLA` works without place or moment. Default place is inferred silently when needed.

## Runtime adapter

Each cube maps to a legacy parser token (e.g. `home` → `identity/hallway`) for `compileTrayState` → `parseChain()`. Product vocabulary must not leak parser tokens into UI.
