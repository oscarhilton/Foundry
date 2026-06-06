# Tray Lab silent test

The most important QA for the tray + dice product direction. Run after each tray-lab interaction pass.

## Product thesis

**Foundry translates physical sentences into useful little decisions.**

The tray is a **translator** — each cube gets a local interpretation in the slot-aligned zone beneath it, plus one concise **final answer** line. Local translations show *why*; final output says *what to do*.

## Vocabulary rule (v2.1)

**One die = one word.** Faces are **modes of that word**, not alternate product categories.

- HOME, MORNING, WEATHER, RAIN, UMBRELLA, WEAR are separate physical cubes where intent matters
- **Place die** faces: HOME / WORK / OUTSIDE / COMMUTE (face tokens `place/*`)
- **Moment die** faces: MORNING / NOW / LATER / EVENING (face tokens `moment/*`)
- Rotating WEATHER cycles Full / Temp / Rain / Wind — emphasis modes, not alternate source nouns
- Lens role is labeled **Decision** in the UI (internal name: `lens`)

Physical tokens stay clean in vocabulary; `tray-compile.ts` maps to legacy parser tokens at the chain boundary only.

**Forgiving grammar:** not every sentence needs every role. Both umbrella paths resolve to the same final answer:

- **Express:** `MORNING → WEATHER → UMBRELLA` (default home inferred)
- **Canonical:** `HOME → MORNING → WEATHER → UMBRELLA` (explicit home anchor)

Both → `No umbrella needed this morning.`

## Tray Lab modes

| Mode | URL | Tray on load | Purpose |
|------|-----|--------------|---------|
| **Silent test** | `?silent=1` | Empty tray, 8-cube pool | Can a stranger discover the product? |
| **Default dev** | `/` | Empty tray, 8-cube pool | Honest grammar — no pre-docked answer |
| **Showcase demo** | `?showcase=1` | Preloaded `HOME → MORNING → WEATHER → UMBRELLA` | Beautiful instant demo |

Do not preload the silent test tray. Pre-docking teaches the answer.

## Lens intent alignment (TRAY-111)

**The word you see is the question being answered.**

Each weather lens cube asks a different question of the same WEATHER source:

| Lens | Question | Example final (`NOW`, 22% rain) |
|------|----------|-------------------------------|
| **RAIN** (phenomenon) | Will it rain? | `Rain unlikely right now.` |
| **UMBRELLA** (utility) | Should I take one? | `No umbrella needed right now.` |
| **WEAR** (comfort) | What should I wear? | `Light jacket right now.` |

The silent test foil: placing **RAIN** when asked about an umbrella gives accurate weather data but not the requested action — the user discovers they need **UMBRELLA**.

WEAR must not carry a rain face. RAIN is its own starter cube.

## Cube display (physical language — TRAY-110)

**The largest word on the die is the word the runtime reads.**

- **Default orientation:** identity word centered large (e.g. `WEATHER`, `HOME`, `TIMER`)
- **Rotated orientation:** active face centered large (e.g. `OUTSIDE`, `RAIN`) with die word tiny and debossed below (e.g. `home`, `weather`)
- The cube has not changed; the user has turned it

**Product rule:** Dice are physical objects first, UI elements second — never a selectable dashboard. No orange selection borders, no completion badges.

## Physical grammar (TRAY-109)

**A word can only use what appears before it.**

- Lenses bind only to a **compatible upstream source face** to their left
- Places and moments are **upstream context**, not data sources — OUTSIDE does not satisfy UMBRELLA
- Downstream sources are **diagnostic only** — they produce layout hints, never power an answer
- Source compatibility checks the **active face**, not the die category

**No-lookahead example:**

```
OUTSIDE → MORNING → UMBRELLA → WEATHER
Local:  Outside  Morning  Put WEATHER before UMBRELLA.  22% rain after 4pm
Final:  Put WEATHER before UMBRELLA.
```

Valid canonical order still resolves normally:

```
HOME → MORNING → WEATHER → UMBRELLA  →  No umbrella needed this morning.
```

## Final line rules (TRAY-108)

The final line may **answer**, **count down**, or **hint**. It must never merge contradictory local meanings into a franken-sentence.

**Composition order:**

1. Running timer owns the final line
2. Any local slot hint blocks synthetic advice — final tone becomes `hint`
3. Normal canonical sentence assembly

**Hint dominance examples:**

| Layout issue | Final line |
|--------------|------------|
| Two decision cubes (umbrella + wear) | `Choose umbrella or clothing.` |
| Umbrella before weather (local hint) | Pass-through local hint — not synthetic advice |
| Valid canonical/express umbrella paths | Normal answer tone |

If the local layer says something is wrong (e.g. `One concern at a time`), the final layer must say "not quite" — not `Take umbrella later right now.`

## Protocol

### Participant

1. Send link: `http://localhost:5174/?silent=1` (or deployed URL)
2. Say **nothing** for 30 seconds
3. Do **not** explain, defend, or guide
4. Write down the **first question** they ask verbatim

### Facilitator (same session)

Open a second tab or window: `http://localhost:5174/?silent=1&observer=1`

The observer panel is facilitator-only. The participant never sees milestones, timers, or export controls.

Optional debug logging: add `&debug=1` to log session JSON to the browser console on export.

Run once before a major interaction change (baseline), once after (validation).

## Starter kit (tray-lab pool — 8 cubes)

Pool order (grammar-biased): **HOME · MORNING · WEATHER · RAIN · UMBRELLA · WEAR · BUTTON · TIMER**

| Class | Cubes |
|-------|-------|
| Context | HOME, MORNING |
| Source | WEATHER |
| Weather lenses | RAIN, UMBRELLA, WEAR |
| Controls | BUTTON, TIMER |

## Canonical scenario

**Prompt:** "Make the tray tell you whether to take an umbrella."

**Canonical sentence:**

```
HOME → MORNING → WEATHER → UMBRELLA
```

**Expected dual-layer display:**

```
[ HOME     MORNING    WEATHER              UMBRELLA    empty ]
[ Home     Morning    22% rain after 4pm   No umbrella needed ]
──────────────────────────────────────────────────────────────
      No umbrella needed this morning.
```

Grammar reading: *At home, for the morning, check weather, decide umbrella.*

### Hero moment

```
HOME → MORNING → WEATHER → UMBRELLA
Local:  Home  Morning  22% rain after 4pm  No umbrella needed
Final:  No umbrella needed this morning.

(rotate WEAR or UMBRELLA cube only)

Local:  Home  Morning  22% rain after 4pm  Light jacket
Final:  Light jacket this morning.
```

Same place. Same morning. Same weather. Different concern. Different decision.

## Observer milestones (automatic, silent)

| Milestone ID | Meaning |
|--------------|---------|
| `placement_started` | First die placed |
| `sentence_complete` | HOME + MORNING + WEATHER + Decision cube all present |
| `umbrella_decision_visible` | finalOutput or lens local shows umbrella decision |
| `hero_moment` | Decision slot changed; place, moment, and weather stable |
| `lens_rotated_before_complete` | User discovered rotation before full sentence |

**Hero moment detector:** programmatic — fires when lens slot text changes while place, moment (Morning), and weather slot texts stay identical.

## Session JSON export

Click **Copy session JSON** in the observer panel. Events include full `TrayTranslation` (`localTranslations`, `finalOutput`, `finalOutputTone`).

## Question progression (healthy evolution)

```
Physical placement (where do cubes go?)
  ↓
Rotation (what does turning a face do?)
  ↓
Decision comprehension (same weather, different advice)
  ↓
Product understanding (what is the tray? what are the cubes?)
  ↓
Purchase path (what's in the starter kit?)
```

## How to score

### Success buckets

| First question sounds like… | Layer |
|-----------------------------|-------|
| "Do I drag these in?" / "Does order matter?" | **Placement** |
| "What happens if I turn this?" / "How do I change the mode?" | **Orientation** |
| "Why did only this part change?" / "Same weather but different advice?" | **Decision** — breakthrough |
| "What is the tray?" / "Do the cubes have batteries?" | **Product** |
| "What do I buy?" / "What's in the box?" | **Purchase path** |

### Ritual signal (watch for)

| Participant behaviour… | Meaning |
|------------------------|---------|
| Builds HOME → MORNING → WEATHER → UMBRELLA without help | **Canonical sentence clear** |
| Rotates decision cube before asking | **Orientation discovered** |
| Reads local zones then final line | **Dual-layer model understood** |
| "When I'm leaving…" / "before work…" | **Ritual framing** |

### Unhealthy

| First question… | Meaning |
|-----------------|---------|
| "Is this a weather app?" | Software framing |
| "Which one is selected?" | UI habit / brackets leaking |
| "Where do I snap them?" | Chain model leak |

## Success gates

1. ≥3 of 5 complete "take an umbrella" without explanation
2. ≥2 of 5 rotate the decision cube; observer logs `hero_moment`
3. ≥3 of 5 describe cubes as **words** and the tray as **the thing that reads them**
4. Participant UI shows no completion badges or victory screens
5. Stranger can read tray and understand **why** without feeling like a debugger

## Relation to Simulator v1

| Surface | Question |
|---------|----------|
| `apps/simulator` | Does this chain parse? |
| `apps/tray-lab` | Does this object make sense to a stranger? |

Do not conflate results.
