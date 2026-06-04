# Foundry Chain Grammar

Foundry chains are read **left to right** (top to bottom on mobile) like a sentence:

`London → Weather → Clock → Display`

means roughly: *show London's weather and time on a display*.

The simulator shows a linear chain. The runtime compiles it into a **capability graph** where consecutive displays are linked by **remainder** edges: each viewport consumes some information and passes the rest downstream.

## Core rules

1. **Order matters** — cubes only affect outputs to their right (positional windows).
2. **One Core** — exactly one Core cube powers the chain.
3. **Segments** — upstream modules produce formatted *segments* (e.g. `12°C 45%`, `London 14:32`).
4. **Viewports consume segments** — each LCD shows one or more segments; extra LCDs in a cluster *share* upstream segments (like adding another monitor).
5. **Formatting is cosmetic** — the runtime decides *who consumes what*; formatters only turn values into strings.

## Single viewport

| Chain | Typical LCD text |
|-------|------------------|
| `London → Weather → LCD` | Place-scoped weather, e.g. `12°C 45%` |
| `London → Time → LCD` | `London 14:32` |
| `Temp → LCD` | `20°C` |
| `Time → LCD` | `14:32` |

## Multiple viewports (load sharing)

When several LCDs share one upstream window (no modules between them), segments are distributed across the run:

| Chain | LCD 1 | LCD 2 | LCD 3 |
|-------|-------|-------|-------|
| `Temp → Weather → LCD → LCD` | temp | weather | `--` |
| `Temp → Weather → Time → LCD → LCD → LCD` | temp | weather | time |

**Interleaved** chains keep strict windows — modules between LCDs reset the window:

| Chain | LCD 1 | LCD 2 |
|-------|-------|-------|
| `Tokyo → Time → LCD → London → Weather → LCD` | `Tokyo 07:03` | `12°C 45%` |

**Backfill** — trailing modules after an LCD cluster can fill `--` slots left by load sharing.

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

## Internal model (runtime)

```
Chain → CapabilityGraph → segment pipeline → lcdTexts
```

- **payload** edges link signal modules in chain order.
- **remainder** edges link consecutive `output/lcd` nodes.
- Recipe matching (London Weather Light, etc.) is separate from LCD segment distribution.

## Future (not in MVP)

Branching — e.g. one weather source driving both a display and a light without strict left-to-right duplication — will use graph forks, not a new chain layout. The linear sentence UX stays primary.
