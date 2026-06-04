# Foundry Chain Grammar

## What Foundry is

**Before any cube ships, ask: Does this introduce a new kind of sentence?**

Foundry optimises for *language*, not cube count. How people learn and use that language — copy first, substitute one word, ambient certainty — is in [use-model.md](use-model.md). Prefer roughly **10 sources and 10 transforms** over many data feeds with few verbs. Sources publish facts; **transforms** change how those facts read on an output.

## Noun → Verb → Output

Identity cubes (London, Tokyo, Foundry) are **nouns**. Sources and transforms are **verbs**. Outputs (LCD, Light) are where the sentence becomes visible.

| Noun | Verb | Output |
|------|------|--------|
| London | Weather | LCD |
| Tokyo | Time | LCD |
| Foundry | GitHub | LCD |
| London | Weather | Light |

Weather **binds to the first noun** in its positional window. Time binds to places in its window. Split **decomposes** a combined weather segment across LCDs.

## Controls (frontier — not shipped)

**Controls** shape **when**, **whether**, or **how** a behaviour is expressed. They are not more output cubes and not endless data feeds (Stock, Calendar, etc.).

Motion is **today's first partial control** — it gates content:

`Motion → London → Weather → LCD`

Threshold, Delay, Repeat, and generalised Gate are post-M6 roadmap only. Do not promise them in showcase copy. See [grammar-frontier-controls.md](grammar-frontier-controls.md).

> Users are asking for conditionals. Do not answer with code. Answer with physical control words.

---

Foundry chains are read **left to right** (top to bottom on mobile) like a sentence:

`London → Weather → Clock → Display`

means roughly: *show London's weather and time on a display*.

The simulator shows a linear chain. The runtime compiles it into a **capability graph** where consecutive displays are linked by **remainder** edges: each viewport consumes some information and passes the rest downstream.

## Core rules

1. **Order matters** — cubes only affect outputs to their right (positional windows).
2. **One Core** — exactly one Core cube powers the chain.
3. **Segments** — upstream modules produce formatted *segments* (e.g. `London` + `12°C · 45% rain`, `London 14:32`).
4. **Viewport consumption** — each LCD (viewport) consumes segments from upstream via a **remainder fold**: one segment per viewport in a cluster when possible; empty slots stay `--` unless trailing modifiers sit after the cluster (not before the next positional window).
5. **Formatting is cosmetic** — the runtime decides *who consumes what*; formatters only turn values into strings.

## Time is a transform

Time (`source/time`) is a **transform**, not a global clock. It only formats places in the **same positional window** (modules immediately before the same LCD or cluster).

| Chain | LCD 1 | LCD 2 |
|-------|-------|-------|
| `Tokyo → London → LCD → Time → LCD` | `Tokyo London` | `--` |
| `Tokyo → Time → LCD → London → Time → LCD` | `Tokyo 01:57` | `London 17:57` |
| `Time → LCD` (only) | `14:32` | — (wall-clock exception) |

Time does **not** bind backwards across viewports. For city-specific times, put **Time after each city**:

`Tokyo → Time → London → Time → LCD`

## Light colour (weather moods)

`London → Weather → Light` maps conditions to **colour** on the Light cube:

| Condition | Colour |
|-----------|--------|
| Rainy | Blue |
| Clear | Yellow |
| Overcast | Grey |

Brightness still follows temperature and rain. Light and LCD are independent.

## Wheel position changes meaning

The **Wheel** control cube (`control/dial` in protocol — position 0–1) changes meaning by **order** in the chain:

| Order | Meaning |
|-------|---------|
| `Wheel → Weather` | **Tune** the weather source — face shows a **rain gate** (e.g. `RAIN` + `> 60%`), not live “it is raining”. Motion/chime uses rain **above** that threshold. |
| `Weather → Wheel` | **Select** which weather field reaches the LCD (temperature / rain / full). Weather face stays on **live condition** (`RAIN`, `SUN`, `OVERCAST`). |
| `Wheel → Weather → Light` | Wheel sets the **rain threshold**; Light is on when rain exceeds it (**Tuned Weather Light**). |
| `Weather → Wheel → Light` | Weather drives mood; Wheel **scales** brightness (**Weather Wheel Light** preset). |

`London → Weather → Wheel → LCD` — wheel thirds pick **temperature**, **rain**, or **full weather** on the display.

When **Light** is in the chain with Wheel and weather, order decides whether the wheel tunes the gate or scales brightness — see table above. The visual rename does not change runtime semantics; only the product word changes from Dial to Wheel.

## Split decomposes segments

`London → Weather → Split → LCD → LCD` — Split expands weather into atomic clauses (place, temp, rain). Viewports consume one clause each when available; fewer displays front-pack (e.g. `London\n12°C` then `45% rain`). Without Split, clustered LCDs share segments via the remainder fold.

## Motion gates content

`Motion → London → Weather → LCD` — weather appears only while motion is active; otherwise `--`. Pure motion chains still broadcast `MOTION` to all LCDs.

## Weather binds to a place

Weather (`identity/weather`) is a **source**. When a place cube is in the same positional window, Weather **binds to the first place** in that window (it does not consume or average all places). Other places in the window may still participate in remainder rules later; they simply do not appear on this LCD’s weather line.

| Chain | LCD output |
|-------|------------|
| `London → Weather → LCD` | `London` then `12°C · 45% rain` (two lines) |
| `Weather → LCD` (no place) | `12°C · 45% rain` |
| `London → Tokyo → Weather → LCD` | London’s weather only; simulator tip to interleave |

For comparing cities, put **Weather after each city**:

`London → Weather → LCD → Tokyo → Weather → LCD`

## Single viewport

| Chain | Typical LCD text |
|-------|------------------|
| `London → Weather → LCD` | `London` + `12°C · 45% rain` |
| `London → Time → LCD` | `London 14:32` |
| `Temp → LCD` | `20°C` |
| `Time → LCD` | `14:32` (Time alone in window) |

## Multiple viewports (load sharing)

When several LCDs share one upstream window (no modules between them), segments are distributed across the run:

| Chain | LCD 1 | LCD 2 | LCD 3 |
|-------|-------|-------|-------|
| `Temp → Weather → LCD → LCD` | temp | weather | `--` |
| `Temp → Weather → Time → LCD → LCD → LCD` | temp | weather | `--` (Time needs a place in its window) |

**Interleaved** chains keep strict windows — modules between LCDs reset the window:

| Chain | LCD 1 | LCD 2 |
|-------|-------|-------|
| `Tokyo → Time → LCD → London → Weather → LCD` | `Tokyo 07:03` | `London` + `12°C · 45% rain` |

**Triple-LCD interleaved** — middle LCD in an empty-window cluster does **not** receive the next window’s weather:

| Chain | LCD 1 | LCD 2 | LCD 3 |
|-------|-------|-------|-------|
| `Tokyo → Time → LCD → LCD → London → Weather → LCD` | `Tokyo 01:39` | `--` | `London` + `12°C · 45% rain` |

**Trailing modifiers** — modules after an LCD cluster (with no following LCD that has its own window) can fill `--` slots left by viewport consumption (e.g. `LCD, LCD, Random`).

## Button (gate / contact)

The Button is a **gate** or **contact**, not a software boolean:

| State | Meaning |
|-------|---------|
| OPEN | No flow through the circuit |
| CLOSED | Flow allowed |

Press **toggles** the latched circuit (desk behaviour). On the wire, `control/button/press` uses `false` = OPEN and `true` = CLOSED; the simulator and Core Debug show **OPEN** / **CLOSED**.

### `Button → Light`

Press toggles the light: **closed** → full brightness, **open** → dim idle level.

### `Button → Light → LCD`

Press toggles the light; the LCD shows the **output’s current state** (e.g. `Light` + `2%`), not a static badge. The button segment is omitted when it is the nearest control driving the light.

### `Button → Chime`

`Button → Chime` (preset **Button Chime**): each press that **closes** the circuit triggers the chime once.

## Output → LCD

When an output cube sits immediately before an LCD, the display shows that output’s **live telemetry**:

| Chain | LCD shows |
|-------|-----------|
| `Light → LCD` | Brightness as `45%` (or `Light` + percent when a control drives the light) |
| `Button → LCD` | `OPEN` or `CLOSED` |
| `Button → Light → LCD` | Current light level (`Light` + brightness) |

Recipe matching (London Weather Light, Button Light, etc.) is separate from which segments appear on the LCD.

## Light + LCD

`London → Weather → Light → LCD` runs the weather light recipe *and* shows upstream segments on the LCD. The Light cube is not “turned off” because an LCD is present.

## Motion broadcast

While motion is active, **all** LCDs show `MOTION`; when motion clears, normal window layout returns.

## Warnings (simulator)

| Condition | Message |
|-----------|---------|
| Multiple Light cubes | Only the first drives brightness |
| Multiple LCD cubes | Informational: displays share upstream segments |
| No Core | Chain unpowered |
| Multi-place + Weather in one window | Tip: place Weather after each city |

## Internal model (runtime)

```
Chain → CapabilityGraph → viewport consumption (remainder fold) → lcdTexts
```

LCD publishes use topic `output/lcd/text` with `source: core`, **targetId** (viewport instanceId) for routing, and optional **targetAddress** (I²C transport metadata).

- **payload** edges link signal modules in chain order.
- **remainder** edges link consecutive `output/lcd` nodes.
- Recipe matching (London Weather Light, etc.) is separate from LCD segment distribution.

## Future (not in MVP)

Branching — e.g. one weather source driving both a display and a light without strict left-to-right duplication — will use graph forks, not a new chain layout. The linear sentence UX stays primary.
