# Wheel control cube

Product name: **Wheel**. Protocol id: `control/dial`. Position publishes as `control/dial` (0–1).

## Interaction model

| Gesture | M6 (simulator + bench) | Future hardware |
|---------|------------------------|-----------------|
| Rotate ring | Continuous position → `control/dial` | Cap-touch ring → position register |
| Centre tap | Visual only (reserved) | `control/wheel/press` momentary event |
| Long press | — | Reset / default (TBD) |

Ring drag in the simulator uses **delta-based** rotation so crossing the 0/360° seam does not jump the value.

## M6 bench (unchanged)

| Component | Part | Notes |
|-----------|------|-------|
| MCU | ATtiny841 | I2C slave @ 0x20 |
| Input | 10k potentiometer | Panel-mount on top face |
| Reg map | 0x10 = position uint16 | Scale 0.001 → 0–1 |

Firmware: [`firmware/dial/src/main.cpp`](firmware/dial/src/main.cpp). WHOAMI `0x02` in register map ([`schematics/schematic-notes.md`](schematics/schematic-notes.md)).

## Target product form

White 50mm cube with:

- Flat **circular touch ring** on top (not a chunky retro click wheel — thin Bauhaus instrument)
- Small **centre select** button
- Optional tiny e-ink or printed label on the face

Physical layout matches the simulator: thin ring, travelling dot, soft centre, mono percent readout.

## Firmware path (post-M6)

1. Ring encoder or cap-touch → position register (same 0x10 map) → Core publishes `control/dial`
2. Centre button → IRQ line (pogo pin 6) → Core publishes `control/wheel/press`
3. Optional `control/wheel/state` for touch-down vs pressed

See [protocol.md](../docs/protocol.md) for reserved topics.

## Grammar reminder

Order still defines meaning:

| Chain | Wheel role |
|-------|------------|
| `London → Wheel → Weather → Light` | Wheel **tunes** rain threshold; Light follows gate |
| `London → Weather → Wheel → Light` | Wheel **scales** brightness |

See [grammar.md](../docs/grammar.md).

## Related

- [README.md](README.md) — system overview
- [smart-face-platform.md](smart-face-platform.md) — control vs smart-face SKUs
- [enclosure/shell-spec.md](enclosure/shell-spec.md) — shell top variants
