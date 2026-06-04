# M6 E2E — London → Weather → Light

Hardware proof for [M6](../docs/m6-physical-sentence.md). **M6.1** adds Tokyo → Time → Display.

## Target chain

```
[London EEPROM @ 0x50] → [Weather EEPROM @ 0x51] → [Light @ 0x21] ← [Core ESP32]
```

Dial optional; not required for M6.

## Build order

| Step | Work | Doc |
|------|------|-----|
| 1 | Breadboard: ESP32 + EEPROM + pot (optional) + LED | [schematics/schematic-notes.md](schematics/schematic-notes.md) |
| 2 | Pogo jig — two fixtures align | [README.md](README.md) |
| 3 | Core PCB + programmed EEPROMs + Light slave | [firmware/core/README.md](firmware/core/README.md) |
| 4 | 3D shells, fit test | [mockup-sprint.md](mockup-sprint.md) |
| 5 | Snap 4 cubes; observe light drift with mock weather | this doc |

## EEPROM programming

Program before snap-in. Descriptor format: length-prefixed JSON at offset 0 (see [firmware/core/README.md](firmware/core/README.md)).

**London @ 0x50:**

```json
{"schema":1,"id":"identity/london","label":"London","category":"identity","role":"place","colorAccent":"#E63946","capabilities":[],"topics":{"publish":[],"subscribe":[]}}
```

**Weather @ 0x51** (use next free address in 0x50–0x57 range):

```json
{"schema":1,"id":"identity/weather","label":"Weather","category":"identity","role":"source","colorAccent":"#457B9D","capabilities":[],"topics":{"publish":[],"subscribe":[]}}
```

## Firmware

```bash
cd hardware/firmware/core
pio run -t upload
pio device monitor
```

Core discovers EEPROMs, detects Light @ `0x21`, runs mock weather every 3s, writes brightness register.

Expected serial:

```
[chain] discovered:
  London (identity/london) @ 0x50
  Weather (identity/weather) @ 0x51
[chain] weather=1 dial=0 light=1 place=London
[signal] output/light/brightness=0.xxx ...
```

Light cube firmware: [firmware/light/src/main.cpp](firmware/light/src/main.cpp).

## Pass / fail

| Criterion | Pass |
|-----------|------|
| Chain discovery finds London + Weather | |
| Light PWM changes over ~30s without USB serial open | |
| Stranger told "snap them in order" understands weather → light | |
| No simulator required for demo | |

## Alignment with TypeScript runtime

`weatherToBrightness()` in [firmware/core/src/main.cpp](firmware/core/src/main.cpp) must stay aligned with `packages/runtime/src/signal-router.ts`. When recipes change, update both.

## Out of scope for M6 E2E

- LCD / viewport text
- GitHub, Split, motion gate
- WiFi live weather (Open-Meteo is roadmap in core README)
- Core ↔ Core mesh
