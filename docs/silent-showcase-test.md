# Silent showcase test

The most important QA for positioning. Run after each showcase copy pass.

## Protocol

1. Send link: `http://localhost:5173/?showcase=1` (or deployed URL)
2. Say **nothing** for 30 seconds
3. Do **not** explain, defend, or guide
4. Write down the **first question** they ask verbatim

Run once before a copy update (baseline), once after (validation).

## Question progression (healthy evolution)

```
Grammar understanding
  ↓
Product understanding   (what to buy, how many Cores)
  ↓
Configuration understanding   (hometown, rename, Wi-Fi)
  ↓
Purchase path   (what's in the starter kit)
  ↓
Extensibility imagination   (custom cubes, new integrations, durability)
  ↓
Longevity / due diligence   (cloud, company survival, open ecosystem)
```

## How to score

### Success buckets

| First question sounds like… | Layer |
|-----------------------------|-------|
| "How much is the starter kit?" / "What do I buy?" | **Product** — premise accepted |
| "Can I make it represent my hometown?" / "Can I rename this cube?" / "How does it know it's London?" | **Configuration** — programmable Place landed |
| "Does it need Wi-Fi?" / "Is there an app?" | **Trust / scaffolding** — hidden complexity question |
| "What if I put them backwards?" | **Experimentation** — physical feedback copy resonating |
| "What's in the starter kit?" / "What comes in the box?" | **Purchase path** — Start Here card working |
| "Can I make my own cube?" / "Can I track stocks / trains?" | **Extensibility — creator signal** — language accepted; log verbatim |
| "What if my cat knocks it apart?" / "Does it break if disconnected?" | **Physical imagination** — object on desk; durability not yet in showcase |
| "Do I have to wait for Foundry to release a Stock cube?" | **Vocabulary limits** — internal only; do not add showcase FAQ yet |
| "What if Foundry goes away?" / "Do these become paperweights?" | **Longevity — buyer signal** — imagining purchase; log verbatim |
| "Does it need your servers?" / "Can it work offline?" | **Cloud independence** — internal; answer in docs not showcase |
| "Can other companies make cubes?" / "Is the connector bus open?" | **Hardware openness** — internal only until position decided |

### Custom-cube signal (watch, not a gate)

If **≥2 of 5** independently ask about **custom cubes** or **adding words to the language**, treat as strong evidence the concept reads as a language. **Do not** interpret as a build trigger — see [m7-trust-longevity.md](m7-trust-longevity.md).

### Longevity signal (watch, not a gate)

If **≥1 of 5** asks about **company survival** or **cloud lock-in**, treat as evidence the concept reads as a **product worth buying**, not a toy. Do not interpret as "publish open-hardware spec now." Point to [product-boundary.md](product-boundary.md) Longevity principles when asked.

### Starter kit comprehension (after 30s)

Ask optionally: *"What would you need to build the first example?"*

| Participant says… | Meaning |
|-------------------|---------|
| "Core, Place, Weather, Light" | **Purchase path clear** |
| "London, Tokyo, Wi-Fi, Display…" | **Leaking implementation** — tighten Start Here / Place copy |

Success: ≥3 of 5 name the four starter cubes **without** city names or infrastructure cubes.

### Unhealthy (core concept still unclear)

| First question sounds like… | Meaning |
|-----------------------------|---------|
| "What does Weather do?" / "Why is there a Core?" | **Grammar problem** — language not yet intuitive |
| "How do I make London weather control a light?" / "What is Split?" | **Runtime problem** — still teaching the simulator |

### Positioning leak

| First question | Action |
|----------------|--------|
| "Will this work with Alexa / Hue?" | Sharpen "not a smart-home platform" line |

### Topology (healthy after M6 hero)

| First question | Meaning |
|----------------|---------|
| "How many Cores do I need?" | Core-one-sentence copy working |

## Cubes as words (bonus success metric)

User refers to cubes using **language vocabulary** unprompted, e.g.:

- "Could I add another **place**?"
- "What other **verbs** are there?"
- "Can I add another **output**?"

When users invent the language themselves, grammar has entered their mental model. Log verbatim quotes; count sessions where this appears.

## Wrong product signal

Eliminate: "I need one cube per city." / "I need a Wi-Fi cube."

## Log template

```
Date:
Participant (role):
Before/after copy update:
First question (verbatim):
Layer (grammar / product / config / purchase / extensibility / longevity / unhealthy):
Starter kit described (verbatim, if asked):
Extensibility question (verbatim, if any):
Physical/durability question (verbatim, if any):
Longevity question (verbatim, if any):
Cubes-as-words quote (if any):
Notes (30s behaviour):
```

## Success criteria

**M6 product copy:** ≥3 of 5 cold participants ask a buy / kit / physical question before a grammar question.

**Trust-boundary copy:** ideal first questions include hometown, rename, or Wi-Fi — not "What does Weather do?"

**Start Here copy:** ≥3 of 5 can list Core + Place + Weather + Light; no one asks for a Wi-Fi cube.

**Extensibility signal:** log custom-cube and durability questions; ≥2 of 5 asking about custom words is a strong language signal (not a build trigger).

**Longevity signal:** log company-survival and cloud-lock-in questions; ≥1 of 5 at this layer means buyer due diligence (see [m7-trust-longevity.md](m7-trust-longevity.md)).

**Bonus:** ≥1 of 5 sessions includes cubes-as-words vocabulary.
