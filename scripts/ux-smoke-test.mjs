#!/usr/bin/env node
import { FoundryEngine, parseChain, matchRecipe } from "@foundry/runtime";

const CORE = "core/core";

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ ${message}`);
  }
}

function makeChain(...ids) {
  return ids.map((definitionId, i) => ({
    instanceId: `test-${i}`,
    definitionId,
  }));
}

function withCore(...ids) {
  return makeChain(...ids, CORE);
}

console.log("Foundry UX smoke tests\n");

console.log("Task 1 — London Weather Light (powered)");
{
  const engine = new FoundryEngine();
  engine.setChain(withCore("identity/london", "identity/weather", "output/light"));
  engine.start();
  engine.mockAdapters.setWeather({ temp: 20, rain: 0.1 });
  const state = engine.getOutputState();
  assert(state.powered, "chain is powered");
  assert(state.activeRecipeId === "london-weather-light", "recipe matched");
  assert(state.lightBrightness > 0.1, "light visibly on");
  engine.destroy();
}

console.log("\nTask 2 — Weather Dial Light");
{
  const engine = new FoundryEngine({ dialDefault: 0.5 });
  engine.setChain(
    withCore("identity/london", "identity/weather", "control/dial", "output/light"),
  );
  engine.start();
  engine.mockAdapters.setWeather({ temp: 18, rain: 0.2 });
  engine.setDialPosition(0);
  const dim = engine.getOutputState().lightBrightness;
  engine.setDialPosition(1);
  const bright = engine.getOutputState().lightBrightness;
  assert(bright > dim, "dial increases brightness");
  engine.destroy();
}

console.log("\nTask 3 — Room Motion Chime");
{
  const engine = new FoundryEngine();
  engine.setChain(withCore("sensor/motion", "output/chime"));
  engine.start();
  engine.mockAdapters.triggerMotion(true);
  assert(engine.getOutputState().chimeCount === 1, "chime fired on motion");
  engine.destroy();
}

console.log("\nPower — unpowered without Core");
{
  const engine = new FoundryEngine();
  engine.setChain(makeChain("identity/weather", "output/light"));
  engine.start();
  const state = engine.getOutputState();
  assert(!state.powered, "not powered");
  assert(state.activeRecipeId === null, "no recipe");
  engine.destroy();
}

console.log("\nButton Chime");
{
  const engine = new FoundryEngine();
  engine.setChain(withCore("control/button", "output/chime"));
  engine.start();
  engine.triggerButton();
  assert(engine.getOutputState().chimeCount === 1, "button fires chime");
  engine.destroy();
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
