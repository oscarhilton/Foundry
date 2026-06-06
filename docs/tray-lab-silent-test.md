# Tray Lab silent test

The most important QA for the tray + dice product direction. Run after each tray-lab interaction pass.

## Product thesis

**Foundry translates physical sentences into useful little decisions.**

The tray is a **translator** — each cube gets a local interpretation in the slot-aligned zone beneath it, plus one concise **final answer** line. Local translations show *why*; final output says *what to do*.

## Vocabulary rule (v2.2 — TRAY-115 matrix)

**One visible word = one grammatical role.** Four rotating axes plus two control cubes.

- **Place die** faces: HOME / WORK / OUTSIDE / COMMUTE (`place/*`)
- **Moment die** faces: MORNING / AFTERNOON / EVENING / NIGHT (`moment/*`) — sole owner of temporal words
- **Phenomenon die** faces: WIND / RAIN / SUN / SNOW (`phenomenon/*`) — the weather query, not a meta WEATHER cube
- **Response die** faces: JACKET / UMBRELLA / SUNGLASSES / GLOVES (`response/*`) — what to bring or wear
- **Control dies:** BUTTON static; TIMER rotates TIMER / 5 MIN / 15 MIN / 30 MIN

**TRAY-115 audit:** `packages/cube-defs/src/vocabulary-audit.test.ts` enforces orthogonal axis invariants on `ALL_WORD_CUBES` and starter layout on `STARTER_CUBES`.

Physical tokens stay clean in vocabulary; `tray-compile.ts` maps to legacy parser tokens at the chain boundary only.

**Forgiving grammar:** not every sentence needs every role. Both umbrella paths resolve to the same final answer:

- **Express:** `MORNING → RAIN → UMBRELLA` (default home inferred)
- **Canonical:** `HOME → MORNING → RAIN → UMBRELLA` (explicit home anchor)

Both → `No umbrella needed this morning.`

## Tray Lab modes

| Mode | URL | Tray on load | Purpose |
|------|-----|--------------|---------|
| **Silent test** | `?silent=1` | Empty tray, 6-cube pool | Can a stranger discover the product? |
| **Default dev** | `/` | Empty tray, 6-cube pool | Honest grammar — no pre-docked answer |
| **Showcase demo** | `?showcase=1` | Preloaded `HOME → MORNING → RAIN → UMBRELLA` | Beautiful instant demo |

Do not preload the silent test tray. Pre-docking teaches the answer.

## Matrix intent (TRAY-115)

**The word you see is the axis being read.**

| Axis | Question | Example local | Example final (morning, 22% rain) |
|------|----------|---------------|-----------------------------------|
| **PHENOMENON (RAIN)** | What's the condition? | `22% rain` | (feeds renderer) |
| **RESPONSE (UMBRELLA)** | What should I bring? | `No umbrella` | `No umbrella needed this morning.` |

Cross-pairings are useful, not errors: `WIND → UMBRELLA` → "High winds make umbrellas unmanageable this morning." (warning tone).

## Cube display (physical language — TRAY-110 / TRAY-115)

**The largest word on the die is the word the runtime reads.**

- **Default orientation:** identity word centered large (e.g. `HOME`, `PHENOMENON`, `TIMER`)
- **Rotated orientation (place/moment/phenomenon/response/timer):** active face centered large (e.g. `RAIN`, `AFTERNOON`, `UMBRELLA`) with die word tiny and debossed below
- **Static cubes (BUTTON):** face never changes
- The cube has not changed; the user has turned it (where rotation is allowed)

**Product rule:** Dice are physical objects first, UI elements second — never a selectable dashboard. No orange selection borders, no completion badges.

## Domain renderer (TRAY-115)

When phenomenon + response are both present, `WeatherPackRenderer` produces slot locals and final output:

- **Canonical pairings:** rain→umbrella, wind→jacket, sun→sunglasses, snow→gloves
- **Cross-pairings:** threshold logic, not pairing police
- **Structural hints** (missing phenomenon or response) stay in compile — not in the renderer

## Final line rules (TRAY-108)

The final line may **answer**, **count down**, or **hint**. It must never merge contradictory local meanings into a franken-sentence.

**Composition order:**

1. Running timer owns the final line
2. Any local slot hint blocks synthetic advice — final tone becomes `hint`
3. Domain renderer final output when matrix is complete

**Hint dominance examples:**

| Layout issue | Final line |
|--------------|------------|
| Response without phenomenon | `Add weather condition` |
| Phenomenon without response | `Add response` |
| Valid canonical/express umbrella paths | Normal answer tone |

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

## Starter kit (tray-lab pool — 6 cubes)

Pool order (grammar-biased): **HOME · MOMENT · PHENOMENON · RESPONSE · BUTTON · TIMER**

| Class | Cubes |
|-------|-------|
| Context | HOME, MOMENT |
| Weather axes | PHENOMENON, RESPONSE |
| Controls | BUTTON, TIMER |

## Canonical scenario

**Prompt:** "Make the tray tell you whether to take an umbrella."

**Canonical sentence:**

```
HOME → MORNING → RAIN → UMBRELLA
```

**Expected dual-layer display:**

```
[ HOME     MORNING    RAIN                 UMBRELLA    empty ]
[ Home     Morning    22% rain             No umbrella ]
──────────────────────────────────────────────────────────────
      No umbrella needed this morning.
```

Grammar reading: *At home, for the morning, check rain, decide umbrella.*

### Hero moment

```
HOME → MORNING → RAIN → UMBRELLA
Local:  Home  Morning  22% rain  No umbrella
Final:  No umbrella needed this morning.

(rotate RESPONSE cube only — e.g. to JACKET)

Local:  Home  Morning  22% rain  Waterproof advised
Final:  Waterproof jacket recommended this morning.
```

Same place. Same morning. Same phenomenon. Different response. Different decision.

## Observer milestones (automatic, silent)

| Milestone ID | Meaning |
|--------------|---------|
| `placement_started` | First die placed |
| `sentence_complete` | HOME + MOMENT + PHENOMENON + RESPONSE all present |
| `umbrella_decision_visible` | finalOutput or response local shows umbrella decision |
| `hero_moment` | Response slot changed; place, moment, and phenomenon stable |
| `lens_rotated_before_complete` | User discovered rotation before full sentence |

**Hero moment detector:** programmatic — fires when response slot text changes while place, moment, and phenomenon slot texts stay identical.

## Session JSON export

Click **Copy session JSON** in the observer panel. Events include full `TrayTranslation` (`localTranslations`, `finalOutput`, `finalOutputTone`).

## Question progression (healthy evolution)

```
Physical placement (where do cubes go?)
  ↓
Rotation (what does turning a face do?)
  ↓
Decision comprehension (same condition, different advice)
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
| "Why did only this part change?" / "Same rain but different advice?" | **Decision** — breakthrough |
| "What is the tray?" / "Do the cubes have batteries?" | **Product** |
| "What do I buy?" / "What's in the box?" | **Purchase path** |

### Ritual signal (watch for)

| Participant behaviour… | Meaning |
|------------------------|---------|
| Builds HOME → MORNING → RAIN → UMBRELLA without help | **Canonical sentence clear** |
| Rotates response cube before asking | **Orientation discovered** |
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
2. ≥2 of 5 rotate the response cube; observer logs `hero_moment`
3. ≥3 of 5 describe cubes as **words** and the tray as **the thing that reads them**
4. Participant UI shows no completion badges or victory screens
5. Stranger can read tray and understand **why** without feeling like a debugger

## Relation to Simulator v1

| Surface | Question |
|---------|----------|
| `apps/simulator` | Does this chain parse? |
| `apps/tray-lab` | Does this object make sense to a stranger? |

Do not conflate results.
