# M6 mockup sprint (non-electronic)

Goal: answer *Does this feel delightful on a desk?* before months on firmware.

Reference: [enclosure/shell-spec.md](enclosure/shell-spec.md), [README.md](README.md).

## Print set (M6 only)

| Part | Notes |
|------|-------|
| Core shell | USB face visible; distinct silhouette |
| Place shell | Label recess: **PLACE**; apply London demo sticker |
| Weather shell | Verb face / cloud aperture |
| Light shell | Diffuser dome insert |
| Link test | 2× magnetic pogo bridge pieces (straight segment only) |

**Defer to M6.1:** Display shell, Time shell.

## Smart-face aperture (production)

When printing role shells (Place, Weather, Light, Display), use a **shared top aperture** for the future 1.54" front-lit panel: **~41 × 32 mm** clear opening (GDEY0154D67-FL04 outline 40.3 × 31.8 mm + tolerance). M6 breadboard Light shell keeps the 20 mm diffuser dome until smart-face replaces it. See [smart-face-platform.md](smart-face-platform.md).

## Assembly checklist

- [ ] Magnets seated; polarity matches jig (alternate N-S along chain)
- [ ] Pogo apertures align when two shells snap
- [ ] Labels readable at 60 cm desk distance
- [ ] 4-cube chain: `London → Weather → Light → Core` sits stable on shelf

## Desk validation questions

| Question | Pass |
|----------|------|
| Satisfying snap? | |
| Chain self-supports in a line? | |
| Core visually obvious as "brain"? | |
| Would you show this to someone without explaining software? | |

## World Desk friction (note only)

Build an 8-cube stick from paper/printed blanks if helpful. Record: length, rigidity, desk footprint. **Do not solve in M6.**

## Photos

Capture for README / future showcase static assets:

1. 4-cube M6 proof chain on shelf
2. Hand snapping two cubes
3. Optional: long World Desk stick showing friction

## Sign-off

```
Date:
Printed by:
Snap quality (1–5):
Ready for electronics sprint: yes / no
```
