# Foundry Simulator — User Validation Protocol

## Purpose

Validate whether the sentence metaphor is understandable and delightful before hardware investment. Target: **≥80% of participants change light brightness with the dial without help in under 2 minutes**.

## Participant profile

Recruit 5–8 people across:
- 2× non-technical adults (desk toy / gift buyer mindset)
- 2× curious tinkerers (would open Workshop mode)
- 1–2× teens or older children (12+)
- 1× product/design reviewer

Do not explain Foundry before the session. No preamble beyond: *"This is an early prototype. Explore it."*

## Session structure (20 minutes)

| Phase | Duration | Activity |
|-------|----------|----------|
| Free explore | 5 min | Open simulator, no instructions |
| Task 1 | 3 min | "Make the light respond to London weather" |
| Task 2 | 3 min | "Use the dial to control how strong the effect is" |
| Task 3 | 3 min | "Create a chain that chimes when there's motion" |
| Debrief | 6 min | Semi-structured interview |

## Tasks & success criteria

### Task 1 — London Weather Light
- **Start state:** Empty chain or neutral preset
- **Success:** Chain includes Weather + Light; light visibly changes over time
- **Partial:** Adds cubes but wrong order; needs hint
- **Fail:** Cannot add cubes or no visible output after 3 min

### Task 2 — Dial scaling
- **Start state:** Load `Weather Dial Light` preset OR complete Task 1 then add Dial
- **Success:** Adjusts dial/slider; brightness changes within 5 seconds
- **Metric:** Time-to-first-dial-change (target &lt; 120s from session start)

### Task 3 — Motion Chime
- **Start state:** Empty chain
- **Success:** Motion + Chime cubes; triggers chime via simulate button
- **Partial:** Correct cubes, wrong order, needs reorder hint

## Metrics to record

| Metric | How to measure |
|--------|----------------|
| Time to first delight | First smile / "oh!" / unprompted positive comment |
| Time to dial discovery | Seconds until dial control used |
| Reorder comprehension | Can swap London for another identity without help |
| Workshop discovery | Finds signal log unprompted (optional bonus) |
| Recipe recognition | Can describe chain in own words ("weather controls the light") |

## Observation checklist

- [ ] User reads chain left-to-right without prompting
- [ ] User tries drag reorder after adding a cube
- [ ] User notices preset buttons
- [ ] User ignores Workshop until debrief
- [ ] User confused by "Core" (not in MVP chain — good)
- [ ] User asks about real weather → note Live weather toggle discoverability

## Debrief questions

1. What do you think the cubes are doing?
2. Did order matter? How did you know?
3. What would you put on your desk?
4. What felt confusing?
5. Would you buy this? At what price?

## Iterations applied (pre-test defaults)

Based on plan recommendations, the simulator ships with:

| Decision | Rationale |
|----------|-----------|
| Default preset: **Weather Dial Light** | Hero demo; dial discoverable immediately |
| **Product mode** by default | Hides Workshop, Mock/Live, Share; Core Debug via Core cube click |
| Starter kit shelf (7 cubes) | Matches first hardware SKU; extended cubes in drawer |
| Onboarding hints | Left-to-right label, flow arrows on first add, dial pulse after 10s |
| Validation observer panel | Builder mode → Validate button; facilitator checklist |
| Workshop hidden by default | Avoids signal-log overwhelm |
| Mock weather default | No API key friction |
| Palette copy: "Order matters — read left to right" | Reinforces sentence metaphor |
| Double-click to remove cube | Power-user affordance without clutter |
| Live weather toggle in toolbar | Optional depth for curious users |

## Post-test iteration backlog

Prioritise fixes by frequency across sessions:

1. **High:** Users don't see dial → move dial inline on canvas cube
2. **High:** Users don't understand order → animate flow arrows on first cube add
3. **Medium:** Presets overshadow free play → collapse presets after first use
4. **Medium:** Share URL not discovered → add subtle "Copy link" toast on preset load
5. **Low:** Signal log too dense → filter by topic prefix

## Reporting template

```
Session #: __
Participant type: __
Time to dial change: __s
Task 1/2/3: pass | partial | fail
Quote: "..."
Top friction: __
Suggested fix: __
```

## Go / no-go criteria

**Go to hardware pilot** if:
- ≥80% pass Task 2 (dial changes brightness)
- ≥60% pass Task 1 without hints
- ≥4/5 average delight score (1–5) in debrief
- No show-stopper confusion about sentence metaphor

**Iterate simulator** if:
- Multiple users treat cubes as unordered bag
- Dial not discovered in &lt;50% of sessions
- Output panel not noticed
