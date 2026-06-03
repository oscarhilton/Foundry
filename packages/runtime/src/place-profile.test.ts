import { describe, it, expect } from "vitest";
import { parseChain } from "./chain-parser.js";
import {
  hourFractionInTimezone,
  resolvePlaceProfile,
} from "./place-profile.js";

function chainWith(...definitionIds: string[]) {
  return parseChain(
    definitionIds.map((definitionId, i) => ({
      instanceId: `c${i}`,
      definitionId,
    })),
  );
}

describe("resolvePlaceProfile", () => {
  it("returns London profile with UK mock baselines", () => {
    const profile = resolvePlaceProfile(
      chainWith("identity/london", "core/core"),
    );
    expect(profile?.id).toBe("identity/london");
    expect(profile?.timezone).toBe("Europe/London");
    expect(profile?.mockBaseTemp).toBe(12);
    expect(profile?.mockRainBias).toBe(0.45);
    expect(profile?.lat).toBeCloseTo(51.5074);
  });

  it("returns Tokyo profile with warmer mock baselines", () => {
    const profile = resolvePlaceProfile(
      chainWith("identity/tokyo", "core/core"),
    );
    expect(profile?.id).toBe("identity/tokyo");
    expect(profile?.timezone).toBe("Asia/Tokyo");
    expect(profile?.mockBaseTemp).toBe(22);
    expect(profile?.mockRainBias).toBe(0.3);
  });

  it("returns null when no place cube", () => {
    expect(
      resolvePlaceProfile(chainWith("identity/weather", "core/core")),
    ).toBeNull();
  });
});

describe("hourFractionInTimezone", () => {
  it("differs between London and Tokyo for the same instant", () => {
    const instant = new Date("2024-06-15T12:00:00.000Z");
    const london = hourFractionInTimezone("Europe/London", instant);
    const tokyo = hourFractionInTimezone("Asia/Tokyo", instant);
    expect(Math.abs(london - tokyo)).toBeGreaterThan(0.01);
  });
});
