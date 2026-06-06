import { describe, it, expect } from "vitest";
import { getTrayWordCube } from "@foundry/cube-defs";
import { getCubeFaceDisplay } from "./cube-display";

describe("getCubeFaceDisplay", () => {
  const phenomenon = getTrayWordCube("phenomenon")!;
  const home = getTrayWordCube("home")!;
  const response = getTrayWordCube("response")!;

  it("default orientation shows primary face only", () => {
    const display = getCubeFaceDisplay(phenomenon, "wind");
    expect(display.isRotated).toBe(false);
    expect(display.primaryLabel).toBe("WIND");
    expect(display.secondaryLabel).toBeNull();
  });

  it("rotated phenomenon shows active face large", () => {
    const display = getCubeFaceDisplay(phenomenon, "rain");
    expect(display.isRotated).toBe(true);
    expect(display.primaryLabel).toBe("RAIN");
    expect(display.secondaryLabel).toBe("wind");
  });

  it("rotated place die shows active place face large", () => {
    const display = getCubeFaceDisplay(home, "outside");
    expect(display.isRotated).toBe(true);
    expect(display.primaryLabel).toBe("OUTSIDE");
    expect(display.secondaryLabel).toBe("home");
  });

  it("rotated response die shows active response face large", () => {
    const display = getCubeFaceDisplay(response, "umbrella");
    expect(display.isRotated).toBe(true);
    expect(display.primaryLabel).toBe("UMBRELLA");
    expect(display.secondaryLabel).toBe("jacket");
  });
});
