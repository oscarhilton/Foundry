# Product boundary

Internal decisions so marketing, showcase copy, and manufacturing stay aligned. **Do not promise integrations by name until they ship.**

## What Foundry is

**Foundry is not a smart-home platform. Foundry is a physical language for behaviours.**

How people actually use it — copy, substitute, placement — is in [use-model.md](use-model.md).

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

## Extensibility

Internal alignment only — **not consumer-facing showcase copy yet.**

Foundry **starts with a curated vocabulary** (Weather, Time, GitHub, Motion, Light, Display, …).

| Path | Expectation |
|------|-------------|
| **Consumer** | Buy cube → snap → done. No code, no workshop required. |
| **Creator (unshipped)** | Custom sensors, outputs, and integrations are **not promised** in M6/M6.1. |

Future versions **may** allow custom cubes, sensors, and integrations. The first goal is making a **small vocabulary feel expressive**.

**Do not** put hobbyist/developer kit, open API, firmware, MQTT, or Matter language in showcase copy until decided.

Watch for the extensibility signal in silent tests — see [silent-showcase-test.md](silent-showcase-test.md).

### Open question

Deliberately unanswered. Log in silent tests; **do not commit roadmap:**

> Should Foundry eventually allow users to create their own nouns, verbs, and outputs?

Users asking **"Can I make my own cube?"** perceive Foundry as a **language**, not a gadget. That is a product signal, not a build mandate.

### Physical durability (internal principle)

**Not showcase copy yet** — wait for mockup snap validation ([mockup-sprint.md](../hardware/mockup-sprint.md)).

Ideal **physical-language** answer when we eventually ship it:

> The chain can disconnect and reconnect at any point. When reassembled, the Core rediscovers the sentence and resumes.

Technical basis: Core firmware runs chain discovery on boot and in the main loop ([firmware/core/src/main.cpp](../hardware/firmware/core/src/main.cpp) — `discoverChain()`).

## Longevity

Internal alignment only — **not consumer-facing showcase copy yet.** See [m7-trust-longevity.md](m7-trust-longevity.md).

**North star:** The user's sentence survives. Everything else is implementation.

### Longevity principles

- **Sentences execute on the Core** — grammar and runtime live on-device, not in a browser tab.
- **Live data sources should not require a Foundry cloud** — weather/time fetch over Wi-Fi; architecture goal is direct or configurable sources.
- **Hardware should degrade gracefully** if services disappear — a sentence like `London → Weather → Light` should not become inert because a vendor API changed; policy TBD.
- **Long-term openness remains an active design goal** — without promising open PCB, open manufacturing, or open-source everything today.

### Fail gracefully

The physical counterpart to *the user's sentence survives.* Implementation TBD; direction is clear:

| Failure | Desired behaviour |
|---------|-------------------|
| Weather API disappears | Sentence reports unavailable data — does not silently stop |
| Cube disconnected | Sentence rebinds automatically when reassembled |
| Network unavailable | Last known state remains visible on outputs |

### Design direction (aspirational, not shipped)

> Core runs locally. Cubes identify themselves over a documented protocol. The simulator is open source. Cloud services are optional. **The user's sentence survives.**

Existing evidence today: chain discovery on Core ([firmware/core/src/main.cpp](../hardware/firmware/core/src/main.cpp)); simulator as language workshop (this repo).

### Open questions (longevity)

Deliberately unanswered. Log in silent tests; **do not commit roadmap:**

| Question | Why it matters |
|----------|----------------|
| Can Foundry work without a Foundry cloud? | Buyer cloud-independence fear |
| Does `London → Weather → Light` keep working if Foundry Ltd disappears? | Investment protection |
| Can someone manufacture compatible cubes? | Ecosystem longevity; no position required yet |

**Buyer signal:** *"What happens if Foundry goes away?"* means they are imagining spending real money — log verbatim; not a build trigger. See [silent-showcase-test.md](silent-showcase-test.md).

## Smart-home drift

When a conversation drifts to "will it work with my Hue bulbs?", redirect:

1. First hardware = native cubes
2. Foundry is a language, not a hub replacement
3. Integrations are a later platform decision
