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

## Front-light layer (GooDisplay)

E-paper is reflective — unreadable in dim light without illumination. **GooDisplay** front-light panels bond an ultra-thin optical film to the panel face (not sold separately).

| Spec | GDEY0154D67-FL04 (recommended for 50 mm cube) |
|------|-----------------------------------------------|
| Panel | Same 1.54" / 200×200 / SSD1681 as bare GDEY0154D67 |
| Outline | **40.3 × 31.8 × 1.85 mm** (fits 50 mm top face — see [smart-face-platform.md](smart-face-platform.md)) |
| Front-light connector | 6-pin FPC |
| LEDs | 3, parallel, 2.8–3.3 V, ≤45 mA |
| Modes | Cool white or warm white (catalog option) |

Larger GooDisplay front-lit modules (2.13", 2.7", …) **do not fit** the current 50 mm enclosure. Panel choice is documented in the fit matrix in [smart-face-platform.md](smart-face-platform.md) — **Path A: 1.54" FL04** pending mechanical confirm; **Path B: ~65 mm cube** if 2.7" is required.

Product page: [GDEY0154D67-FL04](https://www.good-display.com/product/257.html).
