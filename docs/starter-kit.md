# Foundry Starter Kit

Two kit definitions exist on purpose: **what we build first on the bench** (M6 proof) vs **what we might sell in a box** (retail narrative).

## M6 proof kit (build this first)

Minimum hardware to de-risk the product. Four cubes, one sentence.

| Cube | Simulator ID | Role |
|------|----------------|------|
| Core | `core/core` | Power, connectivity, runtime |
| Place | `identity/london` (demo sticker) | Noun |
| Weather | `identity/weather` | Verb |
| Light | `output/light` | Output |

**Proof chain:** `London → Weather → Light`

**Why no Display in M6:** Light changes are noticeable from across a room. LCD text requires walking over and reading. M6.1 adds `Tokyo → Time → Display`.

**80% magic test:** If a stranger snaps this chain and the light shifts with weather without opening the simulator, M6 succeeds.

## Retail / showcase narrative (broader)

What we tell people exploring `?showcase=1` or the workshop:

- Start with a **Core**
- Add a **Light** or **Display**
- Add cubes to grow vocabulary (Place, Weather, Time, Dial, Motion, …)

The simulator demonstrates Split, World Desk, and multi-LCD sentences. Those require **software + more cubes**; they are not the first box on the bench.

## Optional add-ons (post-M6)

| Cube | Unlocks |
|------|---------|
| Time | `Tokyo → Time → Display` (M6.1) |
| Display (LCD) | Viewport sentences, Split |
| Dial | Weather dial light / field select |
| Motion | Presence-gated weather |
| Second Place | Multi-city (with grammar care) |

## Pricing

Not set. Silent showcase test success looks like: *"How much is the starter kit?"* — not *"How do I wire London to the light?"*

## Code alignment

`STARTER_CUBE_IDS` in `packages/cube-defs` reflects an earlier validation shelf (dial, motion, chime). Reconcile with this doc when the retail SKU locks; do not block M6 on that merge.
