import { describe, it, expect } from "vitest";
import { getTrayWordCube } from "@foundry/cube-defs";
import { getCubeFaceDisplay } from "./cube-display";

describe("getCubeFaceDisplay", () => {
  const weather = getTrayWordCube("weather")!;
  const home = getTrayWordCube("home")!;

  it("default orientation shows primary face only", () => {
    const display = getCubeFaceDisplay(weather, "full");
    expect(display.isRotated).toBe(false);
    expect(display.primaryLabel).toBe("WEATHER");
    expect(display.secondaryLabel).toBeNull();
  });

  it("rotated orientation shows active face large and die word tiny", () => {
    const display = getCubeFaceDisplay(weather, "rain");
    expect(display.isRotated).toBe(true);
    expect(display.primaryLabel).toBe("RAIN");
    expect(display.secondaryLabel).toBe("weather");
  });

  it("rotated place die shows active place face large", () => {
    const display = getCubeFaceDisplay(home, "outside");
    expect(display.isRotated).toBe(true);
    expect(display.primaryLabel).toBe("OUTSIDE");
    expect(display.secondaryLabel).toBe("home");
  });
});
