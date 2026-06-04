# Product boundary

Internal decisions so marketing, showcase copy, and manufacturing stay aligned. **Do not promise integrations by name until they ship.**

## What Foundry is

**Foundry is not a smart-home platform. Foundry is a physical language for behaviours.**

Consumers will otherwise assume Home Assistant / Hue / Matter / Alexa compatibility and judge the project on integrations we have not chosen yet.

## Topology

| Now (M6) | Later |
|----------|-------|
| **One Core = one powered chain** — one sentence on your desk | Core ↔ Core networking TBD |
| Second behaviour = second Core (for now) | May become normal; say "for now" in copy |

People forgive limitations. They do not forgive ambiguity.

## Integrations

| Now | Later |
|-----|-------|
| Native Foundry cubes only | Hybrid (e.g. MQTT, external lights) when architecture is chosen |
| Copy: "open system; native cubes first; integrations planned" | Never name HA / Hue / Matter / Apple Home in copy until built |

## Identity cubes

| Demo / M6 | Production |
|-----------|------------|
| **Demo identities are physical** — London, Tokyo, Foundry stickers on generic Place shells for shows and photos | **Production identities are programmable** — generic Place / Person / Project cube with EEPROM or e-ink face |

**Do not manufacture** London Cube, Tokyo Cube, Chicago Cube, Sydney Cube, … as separate SKUs. That path does not scale.

Simulator `identity/london` etc. are vocabulary tokens; hardware should converge on reprogrammable Place.

## Geometry

| Now | Later |
|-----|-------|
| Linear magnetic chain (desk stick) | Corners, flex links, logical order ≠ physical layout |

World Desk length is a known desk friction; document, do not solve in M6.

## Simulator

The simulator is a **workshop** for language validation. It is not the product. The product is cubes on a desk.

## Trust boundary (showcase copy)

The showcase documents **what users must trust**, not undecided implementation details.

| Topic | Consumer-facing principle |
|-------|---------------------------|
| **Place** | One cube type, **assigned to** a city — not a “London cube” SKU per city |
| **Setup** | “When setting up your Core” — agnostic of USB, phone app, or Bluetooth until decided |
| **Mistakes** | Users **arrange objects**, not programs. Wrong order → clear **physical signal**, not error codes. Avoid: compiler, validation, syntax error |
| **Wi-Fi** | “Weather and time update automatically while the Core is on Wi-Fi.” No refresh intervals or offline policy in consumer copy |

**Infrastructure (Wi-Fi, power) lives in the Core** — never a semantic cube in the sentence.

Wrong product signal to eliminate: “I need one cube per city.”

Showcase answers configuration, mistakes, and connectivity trust — see [silent-showcase-test.md](silent-showcase-test.md).

## Smart-home drift

When a conversation drifts to "will it work with my Hue bulbs?", redirect:

1. First hardware = native cubes
2. Foundry is a language, not a hub replacement
3. Integrations are a later platform decision
