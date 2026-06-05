# Foundry Starter Kit

Consumer summary: **Start Here** card on showcase (`?showcase=1`) — Core, Place, Weather, Motion, Glow, Display → `Place → Weather → Glow`.

Hero demos: **Morning Check** (`Button → Weather → Clothes → Display`), **Doorway Signal** (`Motion → Hallway → Weather → Glow`), **Kitchen Timer** (`Timer → Chime`).

See [packs.md](packs.md) for Kitchen pack (Timer + Chime) and future add-ons.

## Retail starter kit

| Cube | Simulator ID | Role |
|------|----------------|------|
| Core | `core/core` | Power, connectivity, runtime |
| Place | `identity/london` (demo sticker) | Context noun |
| Weather | `identity/weather` | Source symbol (OVERCAST / RAIN / SUN) |
| Motion | `sensor/motion` | Gate rituals |
| Glow | `output/light` | Ambient colour signal — not a lamp |
| Display | `output/lcd` | Sentence viewport |

**First sentence:** `Place → Weather → Glow`

**Kitchen pack add-on:** Timer + Chime → `Timer → Chime`

## M6 proof kit (bench)

Minimum hardware to de-risk the product. Still valid for first bring-up:

| Cube | Role |
|------|------|
| Core | Power + runtime |
| Place | Noun |
| Weather | Verb |
| Glow | Output |

**Proof chain:** `London → Weather → Glow`

M6.1 adds Display: `Tokyo → Time → Display`.

## Pricing

Not set. Silent showcase success looks like: *"In the bedroom I'd press the button, but at the door it notices me"* — not *"It keeps bothering me"* or *"What's the difference between these two weather cubes?"*

## Code alignment

`STARTER_CUBE_IDS` in `packages/cube-defs` matches the retail starter (Core, Place, Weather, Motion, Glow, Display). Clothes, Hallway, and Button are demo vocabulary for Morning Check and Doorway Signal; Timer/Chime are Kitchen pack.
