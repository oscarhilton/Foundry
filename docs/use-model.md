# How people use Foundry

Foundry is a physical language for behaviours. People do not begin by inventing grammar; they begin by copying useful sentences.

This doc describes **how humans behave around the object** — not constraints or promises (see [product-boundary.md](product-boundary.md)) or runtime rules (see [grammar.md](grammar.md)).

---

## 1. Copy first

Users start with known sentences that already work:

```
London → Weather → Light
Tokyo → Time → Display
Motion → Weather → Display
```

They treat presets like recipes in a cookbook. The early product is not "create arbitrary logic" — it is **pick a sentence that already works, then physically arrange it**.

The showcase, starter kit, and preset chains should lean into that: *Start with these sentences.*

---

## 2. Substitute one word

Once a sentence works, users swap **one word** at a time — nouns, verbs, or outputs:

```
London → Weather → Light
Tokyo  → Weather → Light
London → Weather → Display
London → Time    → Display
```

People learn by pattern substitution. The product should make vocabulary obvious:

| Role | Examples |
|------|----------|
| Nouns | Place (London, Tokyo, Foundry) |
| Verbs | Weather, Time, GitHub |
| Outputs | Light, Display |

Desk controls use the same pattern — see [grammar.md](grammar.md#button-gate--contact):

```
Button → Light
Button → Light → Display
```

Press toggles the circuit; a display after the light shows how bright it is.

---

## 3. Ambient certainty, not dashboards

Foundry is strongest when it answers **small environmental questions**, not when it becomes a data terminal:

- Should I take an umbrella?
- Is it a good time to call Tokyo?
- Is the room occupied?
- Is the build active?

A light glowing blue because rain is coming beats a miniature weather app on a cube. Prefer **quiet physical indicators** that reduce tiny uncertainties.

---

## 4. Placement gives meaning

A sentence belongs where its behaviour matters:

| Sentence | Where it lives |
|----------|----------------|
| Weather → Light | By the front door |
| World clock | On the desk |
| Motion → Display | In the hallway |
| GitHub → Light | Near the work monitor |

**One Core = one sentence on your desk** matches how people live: behaviours are place-specific. The hallway sentence and the desk sentence are separate physical objects — not a limitation to apologise for.

---

## 5. Wrong chains should be gentle

Foundry should behave more like **LEGO** than a **compiler**.

Users will experiment:

```
Light → Weather → London
Split → London → Weather → Display
```

Bad sentences should produce **hints**, **amber status**, or **`--`** — not error codes, syntax errors, or validation failures. Wrong notes are allowed; they should sound wrong.

See [product-boundary.md](product-boundary.md) trust boundary: users **arrange objects**, not programs.

---

## 6. Grammar powers matter more than source sprawl

A small vocabulary with rich grammar beats a huge vocabulary with shallow behaviour.

**Prefer new transforms and control words** over endless new data sources:

| Grammar power | Role |
|---------------|------|
| Split | Decompose a fact across displays |
| Gate | Motion, presence, conditions (Motion is today's first partial control) |
| Select | Dial picks a field |
| Threshold | Only if enough (frontier — see [grammar-frontier-controls.md](grammar-frontier-controls.md)) |
| Delay | After a while (frontier) |
| Repeat | Express every so often — rhythm, not a programming loop (frontier) |
| Remember | Persist state (frontier) |

Resist drift into "add Stock cube, Calendar cube, Train cube." Users asking for "more actions" usually want **behaviour-shaping control words**, not more output cubes. Full frontier: [grammar-frontier-controls.md](grammar-frontier-controls.md).

> **Users are asking for conditionals. Do not answer with code. Answer with physical control words.**

---

## 7. The emotional promise

> I snapped together a little sentence, and now my desk knows something useful.

That is the soul of the product — not "control your smart home," not "build IoT automations," not "modular hardware platform."

People will anthropomorphise working chains: *the London light says rain*, *the desk is glowing because GitHub is active*. That is a product advantage, not frivolity.

---

## Grammar layers

Foundry has three overlapping layers of "grammar":

### Structural

Left-to-right **dataflow**. Positional windows. Outputs consume upstream payload. Order in the chain determines who sees what.

```
Place → Weather → Display   ✅
Display → Weather → Place   ❌ (no upstream payload)
```

Implemented in the runtime capability graph and viewport consumption — see [grammar.md](grammar.md).

### Semantic

**Roles and binding rules** — what makes sense, not just what connects:

| Pattern | Reads as |
|---------|----------|
| `London → Weather` | London's weather |
| `Foundry → GitHub` | Foundry's GitHub activity |
| `London → GitHub` | Ambiguous — grammar hints may apply |
| `London → Weather → Split → Display × N` | Decompose weather across displays |

Foundry today is mostly **Context → Transformation → Output**, not full subject–verb–object ("I walk the dog"). Semantic expectations emerge from cube roles: place, source, transform, output. Post-M6 frontier adds **controls** (when / whether / how expressed) — see [grammar-frontier-controls.md](grammar-frontier-controls.md).

### Pragmatic

**Useful presets, physical placement, human expectations.**

A chain can be structurally valid and semantically odd but pragmatically silly (`Split → Display × 12`). Presets and showcase copy teach the sentences worth building.

---

## Predictability test

A sentence is working when a user can **predict what it does before running it**.

| Chain | Expected inference |
|-------|-------------------|
| `London → Weather → Display` | Show London's weather |
| `Foundry → GitHub → Display` | Show GitHub activity for Foundry |
| `London → Weather → Split → Display → Display` | Weather split across two displays (e.g. place+temp, rain) |
| `London → Weather → Split → Display × 3` | London · temp · rain — one clause per display |

If the display **surprises** the user in a bad way, the grammar or formatter is wrong — not the user.

Log predictability in [silent-showcase-test.md](silent-showcase-test.md) when participants correctly guess behaviour before touching the chain.

---

## References

- [grammar.md](grammar.md) — structural rules, Split, Dial, Motion
- [grammar-frontier-controls.md](grammar-frontier-controls.md) — post-M6 control words (internal roadmap)
- [product-boundary.md](product-boundary.md) — constraints, trust, extensibility
- [starter-kit.md](starter-kit.md) — first sentences to copy
- [silent-showcase-test.md](silent-showcase-test.md) — whether copy teaches predictable sentences
