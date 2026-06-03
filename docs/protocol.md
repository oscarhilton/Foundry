# Foundry Data Protocol

## Overview

Foundry cubes daisy-chain via I2C through pogo pins. The **Core** discovers cubes, reads identity descriptors, and runs a topic-based signal runtime. Cubes do not talk to each other directly — they publish and subscribe through the Core's signal bus.

## I2C Discovery

1. Core scans addresses `0x50–0x57` (EEPROM passive cubes) and `0x20–0x27` (active register devices)
2. Read **Cube Descriptor Block** from each device
3. Build ordered chain from physical port traversal (West → East)

### Pin layout (6-pin pogo)

| Pin | Signal |
|-----|--------|
| 1 | VCC (3.3V) |
| 2 | GND |
| 3 | SDA |
| 4 | SCL |
| 5 | ID (optional address strap) |
| 6 | IRQ (optional change interrupt) |

## Cube Descriptor Block

Stored in EEPROM (passive) or register `0x00` (active). JSON in simulator; CBOR on device for flash efficiency.

```json
{
  "schema": 1,
  "id": "identity/london",
  "label": "London",
  "category": "identity",
  "role": "place",
  "colorAccent": "#E63946",
  "capabilities": [],
  "metadata": { "lat": 51.5074, "lon": -0.1278 },
  "registers": [],
  "topics": { "publish": [], "subscribe": [] }
}
```

### Active cube example (Dial)

```json
{
  "schema": 1,
  "id": "control/dial",
  "label": "Dial",
  "category": "control",
  "role": "control",
  "registers": [
    { "name": "position", "offset": 16, "type": "uint16", "scale": 0.001 }
  ],
  "topics": { "publish": ["control/dial"], "subscribe": [] }
}
```

## Signal Topics

Namespace: `{domain}/{signal}[/{variant}]`

| Topic | Type | Description |
|-------|------|-------------|
| `place/name` | string | Selected place label |
| `weather/temp` | number | Temperature °C |
| `weather/rain` | number | Rain probability 0–1 |
| `weather/rain/smoothed` | number | Calm-smoothed rain |
| `weather/brightness` | number | Derived 0–1 brightness |
| `github/activity` | number | Activity score 0–1 |
| `sensor/motion` | boolean | Motion detected |
| `control/dial` | number | Dial position 0–1 |
| `output/light/brightness` | number | Final light brightness 0–1 |
| `output/chime/trigger` | boolean | Chime fire event |
| `output/music/note` | number | MIDI note number |
| `output/display/text` | string | E-ink display text |
| `output/lcd/text` | string | Backlit LCD text |
| `core/power` | string | Power source and level, e.g. `PWR USB 100%` or `BAT 87%` |

#### LCD text priority

When an `output/lcd` cube is in a powered chain, the Core resolves `output/lcd/text` on every signal update. Each non-core module in the chain contributes a segment in **decreasing priority** (highest first):

1. **Motion** — `MOTION` while `sensor/motion` is active (broadcast to all LCDs; overrides spread)
2. **Temperature sensor** — `16°C`
3. **Weather** — `18°C 40%`
4. **GitHub** — `14/hr`
5. **Time** — `14:32`
6. **Dial / Slider** — e.g. `65%`
7. **Place** — place label, e.g. `London`
8. **Calm modifier** — `CALM`
9. **Random modifier** — `RND`
10. **Button** — `BTN`
11. **Light output** — brightness as `45%`

LCD content is independent of the active behaviour recipe.

#### Core-only LCD chains

When the chain contains only **Core + LCD** (no other signal modules), all LCDs show power status: `PWR USB 100%` when USB-powered, or `BAT 87%` on battery. State is exposed as `powerSource` (`usb` | `battery`) and `batteryPercent` (0–100) on `FoundryOutputState`. The Core publishes `core/power` with the same formatted string whenever power state changes or the chain rebinds.

#### Multiple LCD cubes

When a chain has **one** `output/lcd`, all segments are concatenated on that module (e.g. `16°C 18°C 40% 14:32 London`). The simulator word-wraps medium-length text and horizontally scrolls overflow.

When a chain has **two or more** LCDs, segments are spread left-to-right — one segment per LCD when there are enough modules; when there are more segments than LCDs, segments are grouped into buckets and concatenated per LCD. Extra LCDs show `--`.

Each LCD receives its own `output/lcd/text` publish with `source` set to that LCD's instance id. State is exposed as `lcdTexts: Record<instanceId, string>`; `lcdText` mirrors the first LCD for compatibility.

While motion is active, **all** LCDs broadcast `MOTION`; when motion clears, the spread layout is restored.

### Message shape

```typescript
{
  value: number | string | boolean;
  ts: number;      // Unix ms
  source: string; // cube instance id or "core"
}
```

## Chain Order Semantics

Left-to-right pipeline:

1. **Sources** — place, weather, github, time
2. **Modifiers** — calm, random, threshold
3. **Controls** — dial, slider, button
4. **Outputs** — light, music, chime, display, lcd

**Conflict rule:** nearest control to output binds first.

## Behaviour Recipes

Recipes match chain patterns and wire signal subscriptions:

| Recipe | Pattern | Behaviour |
|--------|---------|-----------|
| `london-weather-light` | Place + Weather + Light | Weather temp/rain → brightness |
| `weather-dial-light` | Weather + Control + Light | Weather × dial → brightness |
| `room-motion-chime` | Motion + Chime | Motion rising edge → chime |

## Rate Limiting (Core adapters)

| Adapter | Default interval |
|---------|------------------|
| Weather (Open-Meteo) | 15 min |
| GitHub REST | 5 min |
| Motion (local) | 50 Hz poll |

## Versioning

- `schema` field in descriptor; Core rejects incompatible versions
- Simulator uses schema `1` exclusively for MVP
