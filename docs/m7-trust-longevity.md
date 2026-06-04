# M7 — Trust & Longevity

Internal milestone. **Not a sprint backlog** — a trust problem to answer after M6 proves the object.

## Problem

After M6, cold participants who have accepted the concept ask **buyer due diligence**, not grammar:

- What if Foundry goes away?
- Does it need your servers?
- Can other companies make cubes?

That is a different kind of success signal — they are evaluating whether to spend money.

## Goal

**The user's sentence survives** — company changes, cloud outages, API shifts. See [product-boundary.md](product-boundary.md) Longevity section.

## Questions to answer

| Area | Question |
|------|----------|
| **Cloud** | Can Foundry work without a Foundry cloud? |
| **Data** | Does `London → Weather → Light` continue if Foundry Ltd disappears? |
| **Hardware** | Can someone manufacture compatible cubes? (position when ready) |
| **Graceful failure** | Weather API down, cube disconnected, network offline — sentence degrades visibly, not silently |

## Not M7

- Custom Cube SDK
- More source cubes
- Showcase hero FAQ on longevity
- Open PCB / bus spec publication (until position decided)

## Where answers live

| Audience | Channel |
|----------|---------|
| Buyers performing due diligence | FAQ, docs, GitHub, hardware pages — **not** showcase first contact |
| Team alignment | [product-boundary.md](product-boundary.md) |
| Demand signal | [silent-showcase-test.md](silent-showcase-test.md) longevity layer |

## Success signal

- Silent tests reach the **longevity** layer (≥1 of 5 asks company survival or cloud lock-in)
- Team can point to longevity principles without over-promising open hardware or cloud-free forever

## References

- [product-boundary.md](product-boundary.md) — Longevity principles, fail gracefully
- [silent-showcase-test.md](silent-showcase-test.md) — question progression ladder
- [m6-physical-sentence.md](m6-physical-sentence.md) — milestone arc
