# M6 — Physical Sentence

## Milestone arc

| Milestones | Problem |
|------------|---------|
| **M1–M5** | Prove the **language** (grammar, viewport, split, bindings, observability, showcase) |
| **M6** | Prove the **object** |
| **M6.1** | Second sentence on hardware: `Tokyo → Time → Display` |

## M6 goal

A stranger can pick up the cubes, snap them together, and understand the resulting behaviour **without opening the simulator**.

## M6 proof chain

```
London → Weather → Light
```

Light is visible from across a room. A display requires reading — better as **M6.1**.

## M6 proof kit (hardware)

| Cube | Role |
|------|------|
| Core | Power, WiFi, runtime |
| Place | Noun (demo: London sticker on generic Place shell) |
| Weather | Verb |
| Light | Output |

See [starter-kit.md](starter-kit.md) for retail vs proof kit distinction.

## Success criteria

- [ ] 4-cube mockups printed; snap feel validated on a desk
- [ ] Core firmware drives Light from mock weather when London + Weather EEPROMs present
- [ ] Silent showcase test: first question is about **what to buy**, not grammar (see [silent-showcase-test.md](silent-showcase-test.md))

## M6.1 (after M6)

- `Tokyo → Time → Display` on real hardware
- Display shell in mockup set

## Simulator freeze (this sprint)

No new transforms, sources, debug tooling, or grammar work unless hardware exposes a real bug. Exception: showcase product copy in `HowFoundryWorksCard`.

## References

- [product-boundary.md](product-boundary.md)
- [starter-kit.md](starter-kit.md)
- [../hardware/m6-e2e-london-weather-light.md](../hardware/m6-e2e-london-weather-light.md)
- [../hardware/mockup-sprint.md](../hardware/mockup-sprint.md)
