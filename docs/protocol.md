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
