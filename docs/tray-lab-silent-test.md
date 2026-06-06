# Tray Lab silent test

The most important QA for the tray + dice product direction. Run after each tray-lab interaction pass.

## Product thesis

**Foundry translates physical sentences into useful little decisions.**

The tray is a **translator** — each cube gets a local interpretation in the slot-aligned zone beneath it, plus one concise **final answer** line. Local translations show *why*; final output says *what to do*.

## Vocabulary rule (v2)

**One die = one word.** Faces are **modes of that word**, not alternate nouns.

- HOME, MORNING, WEATHER, UMBRELLA are separate physical cubes
- Rotating WEATHER cycles Full / Temp / Rain / Wind — the word stays WEATHER
- Lens role is labeled **Decision** in the UI (internal name: `lens`)

**Forgiving grammar:** not every sentence needs every role. `WEATHER → UMBRELLA` alone should still yield a useful answer.

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

## Starter kit (tray-lab pool)

Home · Morning · Weather · Umbrella · Wear · Button · Timer

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
