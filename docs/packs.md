# Foundry packs

Commercial language for cubes beyond the starter kit. Simulator IDs in backticks for engineering alignment.

## Starter kit

**Cubes:** Core, Place, Weather, Motion, Glow, Display  
**First sentence:** `Place → Weather → Glow`  
**Hero demos:** Morning Check (`Button → Weather → Clothes → Display`), Doorway Signal (`Motion → Hallway → Weather → Glow`), Kitchen Timer (`Timer → Chime`)

Intelligence concentrates in Core + smart-face modules. Passive Place/EEPROM cubes stay cheap — a starter kit is not twenty electronic cubes.

## Room → trigger grammar

| Room | Trigger | Output | Demo preset |
|------|---------|--------|-------------|
| Bedroom | Button — ask me | Display | `morning-check` |
| Doorway | Motion — notice me | Glow | `doorway-signal` |
| Kitchen | Timer — remind me later | Chime | `kitchen-timer` |

Multi-core per room is a future note only — one Core powers one sentence today.

**Button semantics:** The M6 simulator toggles circuit OPEN/CLOSED. Product-natural hardware should prefer **press to ask** (momentary request), not a permanent toggle.

## Kitchen pack (add-on)

**Cubes:** Timer, Chime  
**Demo:** `Timer → Chime`

Turn the Timer cube to pick 5, 10, 15, or 30 minutes. When time is up, Chime rings.

## Morning pack (future)

**Cubes:** Clothes, UV (future), Pollen (future)  
**Demo:** Morning Check ritual

Clothes is a simple transform over weather today — four rules, not a wardrobe engine.

## Wellbeing pack (future)

**Cubes:** Reminder (future), Cycle (future)  
**Constraint:** local-only integrations — no cloud health claims without partner/legal design.

## Power story

| Mode | Today | Future |
|------|-------|--------|
| Desk | USB-C Core | Same |
| Hallway / kitchen | — | Core with built-in rechargeable battery preferred |

Defer clip-on battery block and solar panel for starter product — fewer concepts, cleaner story.

## Materials (industrial design target)

Weighty, matte, dice-like feel — soft-touch mineral plastic or matte resin. Not shiny gadget plastic.
