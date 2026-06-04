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

### Active cube example (Wheel)

Product label **Wheel**; cube id and protocol topic remain `control/dial`.

```json
{
  "schema": 1,
  "id": "control/dial",
  "label": "Wheel",
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
| `place/lat` | number | Place latitude (from place cube metadata) |
| `place/lon` | number | Place longitude (from place cube metadata) |
| `weather/temp` | number | Temperature °C |
| `weather/rain` | number | Rain probability 0–1 |
| `weather/rain/smoothed` | number | Calm-smoothed rain |
| `weather/brightness` | number | Derived 0–1 brightness |
| `github/activity` | number | Activity score 0–1 |
| `sensor/motion` | boolean | Motion detected |
| `control/dial` | number | Wheel position 0–1 (product name: Wheel) |
| `control/button/press` | boolean | Latched circuit: `false` = OPEN, `true` = CLOSED (toggle on press) |
| `output/light/brightness` | number | Final light brightness 0–1 |
| `output/chime/trigger` | boolean | Chime fire event |
| `output/music/note` | number | MIDI note number |
| `output/lcd/text` | string | Backlit LCD text |
| `core/power` | string | Power source and level, e.g. `PWR USB 100%` or `BAT 87%` |

#### Wheel topics (future — not implemented M6)

Reserved for cap-touch ring hardware. M6 bench maps a potentiometer to `control/dial` only. Simulator centre-button tap is a UI prototype until Core subscribes.

| Topic | Type | Description |
|-------|------|-------------|
| `control/wheel/position` | number | Hardware alias for ring position 0–1 |
| `control/wheel/press` | boolean / event | Momentary centre-button press |
| `control/wheel/state` | string | `idle` \| `touched` \| `pressed` |

#### LCD text priority

When an `output/lcd` cube is in a powered chain, the Core resolves `output/lcd/text` on every signal update. Each non-core module in the chain contributes a segment in **decreasing priority** (highest first):

1. **Motion** — `MOTION` while `sensor/motion` is active (broadcast to all LCDs; overrides windows)
2. **Temperature sensor** — `16°C`
3. **Weather** — `London` + `12°C · 40% rain` when the first place in the window binds Weather; `12°C · 40% rain` when no place is present
4. **GitHub** — `14/hr`
5. **Time (transform)** — `London 14:32` when a place shares the window; wall-clock `14:32` only when Time is alone in the window; no segment when Time follows consumed places
6. **Wheel / Slider** — e.g. `65%`
7. **Place** — place label when Time and Weather are not already showing that place, e.g. `London`
8. **Calm modifier** — `CALM 45%` (Perlin noise level; label only when value unavailable)
9. **Random modifier** — `RND 72%` (Perlin noise level; label only when value unavailable)
10. **Button** — `OPEN` or `CLOSED` (latched circuit; `control/button/press`: `false` = OPEN, `true` = CLOSED)
11. **Light output** — brightness as `45%`, or `Light` + newline + percent when Button is the nearest control driving the light (e.g. `Light\n100%`)

LCD content is independent of the active behaviour recipe.

#### Core-only LCD chains

When the chain contains only **Core + LCD** (no other signal modules), all LCDs show power status: `PWR USB 100%` when USB-powered, or `BAT 87%` on battery. State is exposed as `powerSource` (`usb` | `battery`) and `batteryPercent` (0–100) on `FoundryOutputState`. The Core publishes `core/power` with the same formatted string whenever power state changes or the chain rebinds.

#### Multiple LCD cubes

When a chain has **one** `output/lcd`, all segments from modules before that LCD are concatenated on it (e.g. `16°C 18°C 40% 14:32 London`). The simulator word-wraps medium-length text and horizontally scrolls overflow.

When a chain has **two or more** LCDs, the Core resolves text using the **left-hand rule** (modules only affect LCDs to their right) plus **positional windows** and **load sharing**:

1. **Positional windows** — each LCD initially collects segments from modules after the previous LCD (or chain start) up to before this LCD. Core is never in a window.
2. **Viewport consumption** — when consecutive LCDs share one upstream window (later LCDs in the run have empty windows), a **remainder fold** assigns one segment per viewport; empty slots remain `--` unless trailing modifiers follow the cluster (not the next positional window).
3. **Trailing modifiers** — modules after an LCD cluster (with no intervening LCD that has its own upstream window) may fill `--` slots left-to-right (e.g. Random after `LCD, LCD`).

**Interleaved** chains keep strict windows: `Tokyo, Time, LCD, London, Weather, LCD` → LCD1 = `Tokyo 07:03`, LCD2 = `London` + `12°C · 45% rain` (Weather binds to London in that window).

**Clustered** LCDs share upstream load: `London, Weather, Wheel, Light, LCD, LCD, LCD, LCD, Random` → LCD1 = `London` + `12°C · 45% rain`, LCD2 = `50%`, LCD3 = `72%`, LCD4 = `RND 68%`.

Each LCD receives its own `output/lcd/text` publish:

- `source` — always `core` (Core resolves viewport text from the chain)
- `targetId` — viewport instance id (routing identity; required for LCD text)
- `targetAddress` — optional I²C address from device discovery (transport metadata)

`output/light/brightness` is published the same way: `source` is always `core`, with `targetId` set to the Light cube instance (the runtime commands the output; the cube is the target).

The signal router stores latest values per `topic::targetId`, not per topic alone. State is exposed as `lcdTexts: Record<instanceId, string>`; `lcdText` mirrors the first LCD for compatibility.

While motion is active, **all** LCDs broadcast `MOTION`; when motion clears, the window layout is restored.

### Message shape

```typescript
{
  topic: string;
  value: number | string | boolean;
  ts: number;           // Unix ms
  source: string;      // publisher instance id or "core"
  targetId?: string;   // viewport instanceId — routing identity for per-display topics
  targetAddress?: string; // I²C address — transport metadata; may change on hot-swap
}
```

LCD text must include `targetId`. Route by instance identity first; display `targetAddress` second.

## Chain Order Semantics

Left-to-right pipeline:

1. **Sources** — place, weather, github, time
2. **Modifiers** — calm, random, threshold
3. **Controls** — dial, slider, button
4. **Outputs** — light, music, chime, lcd

**Conflict rule:** nearest control to output binds first.

### Output modalities

Outputs are split into two modalities (see `outputModality` on cube descriptors):

| Modality | Cubes | Conflict rule |
|----------|-------|---------------|
| **Visual** | Light, LCD | Only the **last** visual output in the chain is active |
| **Audio** | Music, Chime | Can run in parallel with visual outputs; only the **first** cube of each audio type is active |

Audio and visual outputs do not conflict — a chain may include both Light and Music. Signal `source` fields use the target cube's instance id (e.g. music notes publish with the Music cube's id).

### Place cubes drive adapters

Place cubes (`identity/london`, `identity/tokyo`) carry `lat`, `lon`, and `timezone` in their descriptor metadata. When a place cube is in a powered chain:

- **Mock weather** uses place-specific baselines (London ~12°C / rainier; Tokyo ~22°C / drier) when a Weather cube is also present
- **Live weather** (builder mode) fetches Open-Meteo for the place coordinates
- **`time/hour`** is published in the place timezone even without a Time cube; when no place is present, time uses browser local time and only publishes if a Time cube is in the chain

Swapping London for Tokyo changes weather character and local time immediately on chain rebind.

When a **Time cube** is also in the chain with LCD output, each place in that LCD's window contributes a **local time segment** (e.g. `London 14:30`, `Tokyo 22:30`), computed from that place's timezone. Without a Time cube in the window, place cubes contribute their city name only. A single LCD concatenates all segments from its window; multiple LCDs use positional windows with load sharing across consecutive LCD runs (see **Multiple LCD cubes** above).

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
