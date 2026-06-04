# Grammar frontier — control words

**Status:** Post-M6 internal roadmap. Not in the simulator, showcase, or runtime until M6 has met reality. See [m6-physical-sentence.md](m6-physical-sentence.md) simulator freeze.

---

## Design principle

> **Users are asking for conditionals. Do not answer with code. Answer with physical control words.**

This stops Foundry drifting into Node-RED with better typography. When someone asks "can it only happen when…?" or "after a while…?", describe **Threshold**, **Gate**, **Delay** — not triggers, flows, or logic blocks.

---

## What people are really asking for

Feedback often sounds like "more actions." That is usually misread as **more output cubes** (Stock, Trains, Calendar, Sports, Email).

The real ask is **behaviour-shaping control words** — cubes that change what a sentence *means*, not how loud it is.

| Misread | Actual frontier |
|---------|-----------------|
| More integrations | More **grammatical powers** |
| More outputs | More **when / whether / how** |

The next frontier is **not** endless data sources. It is:

**Threshold · Delay · Repeat · Gate · Remember · Fade · Compare**

Those are grammatical powers. They change what sentences can mean.

---

## Mental model

Users reach for **WHEN / IF / HOW** without having the words. In product language, that maps to:

**Condition → Behaviour → Expression**

Foundry today is mostly:

**Noun → Verb → Output**

Example: `London → Weather → Light`

The missing layer sits between behaviour and expression (and sometimes before the verb):

**Noun → Verb → Control → Output**

Do **not** ship cubes named IF, WHEN, or HOW. Those are programming words. Foundry stays physical and humane.

---

## Grammar layers

| Layer | Examples | Role |
|-------|----------|------|
| **Nouns** | London, Tokyo, Foundry, Plant | Context — what the sentence is about |
| **Verbs** | Weather, Time, GitHub, Moisture | Sources that fetch or publish facts |
| **Transforms** | Split, Dial | Reshape *how* facts read on an output |
| **Controls** | Threshold, Delay, Repeat, Gate, Button, Motion, Fade, Remember, Compare | Shape **when**, **whether**, or **how** a behaviour is **expressed** |
| **Outputs** | Light, Display, Sound | Where the sentence becomes visible |

**Transforms** change the payload. **Controls** change the behaviour's timing, gating, rhythm, or expression — without turning the desk into a program.

### Using the word "Control" carefully

The protocol already has `control/dial` and `control/button`. "Control" is slightly overloaded.

In this doc, **controls** means:

> **Controls shape when, whether, or how a behaviour is expressed.**

That lets Button, Motion, Threshold, and Delay sit in the same *family* without forcing one implementation role. Dial remains primarily a **transform** (field select / scale). Button and Motion are early members of the control family with different mechanics.

### Motion is today's first partial control

Gate is half-shipped already. Motion acts as a gate in:

`Motion → London → Weather → LCD`

Weather appears only while motion is active. The frontier is **evolutionary** — not speculative greenfield.

---

## Humane cube names (frontier vocabulary)

| Avoid (programming) | Prefer (physical) |
|---------------------|-------------------|
| IF, WHEN, HOW | Threshold, Gate, Delay, Repeat, Fade |
| Loop | **Repeat** — express every so often (rhythm, interval) |
| Trigger / automation | Threshold, Gate |
| Node-RED, flows, rules | Sentences, control words |

Additional frontier names (not all first-ship): Timer, Compare, Remember.

---

## Example sentences (not shipped)

| Chain | Meaning |
|-------|---------|
| `London → Weather → Threshold → Light` | Light up only when rain is above a chosen level |
| `Motion → Gate → London → Weather → Display` | Show weather only when someone is nearby |
| `Button → Delay → Light` | Turn the light off after a short delay |
| `Weather → Fade → Light` | Express weather as a slow colour transition |
| `Plant → Moisture → Threshold → Light` | Glow when the plant needs water |

---

## First three to implement (after M6)

| Cube | Human question | Description |
|------|----------------|-------------|
| **Threshold** | Only if enough? | Compare a fact to a level — express output only when the condition is met |
| **Delay** | After a while? | Wait before or after an expression changes |
| **Repeat** | Keep doing it? | Express this **every so often** — rhythm or interval, not a programming loop |

**Repeat** language: *express every so often*, *on a beat*, *at an interval*. Never "loop" in copy or docs — that pulls the product toward programming. "Repeat" stays physical and musical.

These three unlock a large share of conditional and temporal sentences without platform sprawl.

Later frontier: Gate (generalise Motion), Remember, Fade, Compare, Timer.

---

## What to resist

**Source sprawl** — Stock, Trains, Calendar, Sports, Email — adds feeds, not sentence power.

**Output sprawl** — more lights and displays without new grammar.

Prefer new **control words** over new integrations. See [use-model.md](use-model.md) §6.

---

## Response playbook

| User says | Answer with |
|-----------|-------------|
| "Only when it rains" | `Threshold` in the chain |
| "When someone walks by" | `Gate` / Motion (today partial) |
| "After a few seconds" | `Delay` |
| "Every few minutes" | `Repeat` (interval, not loop) |
| "Can I write a rule?" | Physical control words — not code |

Log verbatim control-word questions in [silent-showcase-test.md](silent-showcase-test.md). Strong language signal; not a build trigger until post-M6.

---

## References

- [grammar.md](grammar.md) — shipped rules; Motion gate
- [use-model.md](use-model.md) — grammar powers, layers
- [m6-physical-sentence.md](m6-physical-sentence.md) — current milestone and simulator freeze
- [product-boundary.md](product-boundary.md) — trust boundary, anti smart-home drift
