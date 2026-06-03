# 50mm Cube Enclosure — Prototype Spec

## Dimensions (mm)

All dimensions for FDM 3D print prototype (PETG or ABS).

```
        50
    ┌────────┐
    │        │ 50
    │  N     │
    │  label │
    └────────┘
   W ═══════ E   ← chain axis (pogo faces)
```

| Feature | Dimension |
|---------|-----------|
| External cube | 50 × 50 × 50 |
| Internal cavity | 46 × 46 × 46 |
| Wall thickness | 2 |
| Magnet pocket diameter | 6.2 |
| Magnet pocket depth | 3.2 |
| Magnet inset from edge | 8 |
| Pogo hole diameter | 4.0 |
| Pogo row vertical spacing | 18 (centres at y=18,36,54 from bottom — 3 visible dots) |
| Pogo inset from E/W face edge | 2 |
| Label recess (N face) | 40 × 12 × 0.5 deep |

## Shell parts

Each cube = **top half** + **bottom half**, split at z=25mm.

- Top: potentiometer / LED aperture as needed per SKU
- Bottom: PCB standoffs 3mm × Ø3, M2 self-tap or heat-set inserts

## Magnet polarity keying

Alternate cube polarity along chain so cubes cannot rotate 180° and reverse bus:

- Odd position: N-S on W face, S-N on E face
- Even position: opposite

Document polarity with coloured dot on jig during assembly.

## Print settings (FDM)

| Setting | Value |
|---------|-------|
| Layer height | 0.2 mm |
| Infill | 20% gyroid |
| Material | PETG white |
| Supports | Pogo holes only if bridging fails |

## Files (to create in CAD)

| File | Description |
|------|-------------|
| `shell-generic-top.stl` | Passive / identity top |
| `shell-generic-bottom.stl` | All cubes bottom with standoffs |
| `shell-dial-top.stl` | 7mm pot shaft hole |
| `shell-light-top.stl` | 20mm diffuser opening |
| `shell-core-bottom.stl` | USB-C cutout on South face |

## Fit checklist

- [ ] PCB slides in from bottom half
- [ ] Pogo pins protrude 1.5mm from face
- [ ] Magnets snap to neighbour with ~2N separation force
- [ ] No pin short when cubes misaligned by 1mm
- [ ] Label readable at 30cm

## Next step

Model in Fusion 360 / OpenSCAD and export STLs to this directory. For MVP, print 5 bottoms + mix of tops for Core, Dial, Light, and 2× passive.
