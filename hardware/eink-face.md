# E-ink cube face — 1.54" panel reference

Self-describing source cubes (Weather first) use a small **black/white e-paper** face so the cube explains what it currently means, even without a downstream LCD.

## Reference module

| Spec | Value |
|------|-------|
| Typical breakout | Waveshare 1.54" SPI e-Paper module |
| Raw panel | **GDEY0154D67** (Good Display) |
| Driver IC | **SSD1681** |
| Resolution | **200 × 200 px** |
| Active / display area | 27.6 × 27.6 mm (module); ~27 × 27 mm (raw panel) |
| Module outline | ~48 × 33 mm |
| Pixel pitch | ~0.138–0.14 mm |
| Interface | SPI (3-wire or 4-wire) |
| Logic / power | 3.3 V or 5 V module (board-dependent) |
| Colours | Black / white only (2-level greyscale) |
| Full refresh | ~2 s |
| Partial refresh | ~0.3 s |
| Refresh power | ~26 mW typical |
| Standby | ~0.01 µA — image persists with no Core (latched face) |
| Viewing angle | >170° |
| Operating temp | 0–50°C typical |

## Mechanical fit (50 mm cube)

- Internal cavity: 46 × 46 × 46 mm ([shell-spec.md](enclosure/shell-spec.md))
- 27.6 mm active area fits on **top face** or a dedicated aperture; N-face label recess (40 × 12 mm) is too small for this panel
- Face layout budget (200 × 200): place line, condition glyph + headline (`RAIN` / `SUN` / `OVERCAST`), temp/rain detail line

## Firmware notes (future)

- Drive via SPI from Core or cube-local MCU
- Commit face updates only when content changes (avoid unnecessary ~0.3–2 s refreshes)
- Partial refresh when only detail line changes; full refresh when symbol/headline changes
- Simulator contract: `weatherFace` in `packages/runtime` — no `output/lcd/text` topic for cube faces

See [grammar.md](../docs/grammar.md) — Weather cube e-ink when no LCD is present.
