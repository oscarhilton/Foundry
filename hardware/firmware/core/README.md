# Foundry Core Firmware

PlatformIO firmware for the Seeed XIAO ESP32-S3 Core cube.

## Features (MVP)

- I2C chain discovery (EEPROM passive cubes @ 0x50–0x57)
- Active cube detection (Dial @ 0x20, Light @ 0x21)
- Mock weather adapter when Weather cube present (matches simulator cadence)
- **M6:** `London → Weather → Light` — `brightness = weatherToBrightness(temp, rain)` (dial optional)
- 50 Hz poll loop for dial → light latency target &lt;200ms

See [../../m6-e2e-london-weather-light.md](../../m6-e2e-london-weather-light.md).

## Build & flash

```bash
cd hardware/firmware/core
pio run -t upload
pio device monitor
```

## EEPROM programming

Passive cubes store a length-prefixed JSON descriptor at offset 0:

```
Offset 0x00: uint16 LE length
Offset 0x02: JSON bytes (see packages/cube-defs)
```

Example London descriptor:

```json
{"schema":1,"id":"identity/london","label":"London","category":"identity","role":"place","colorAccent":"#E63946","capabilities":[],"topics":{"publish":[],"subscribe":[]}}
```

Program via CH340 EEPROM writer or Core passthrough (future).

## Register maps

See [`../schematics/schematic-notes.md`](../schematics/schematic-notes.md).

## Roadmap

- [ ] Open-Meteo HTTP adapter (WiFi)
- [ ] Hot-plug debounce (500ms)
- [ ] Motion → Chime recipe
- [ ] OTA via web UI
- [ ] Port full recipe table from `packages/runtime`

## Alignment with simulator

Logic in `weatherToBrightness()` and dial scaling matches:
- `packages/runtime/src/signal-router.ts`
- `packages/runtime/src/index.ts` (FoundryEngine.recalculateOutputs)

When changing recipes, update both TS runtime and this firmware.
