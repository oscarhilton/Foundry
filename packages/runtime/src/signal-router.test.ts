import { describe, it, expect } from "vitest";
import { SignalRouter } from "./signal-router.js";

describe("SignalRouter viewport targets", () => {
  it("stores latest per targetId on the same topic", () => {
    const router = new SignalRouter();

    router.publish("output/lcd/text", "Tokyo 01:39", {
      source: "core",
      targetId: "lcd1",
      targetAddress: "0x52",
    });
    router.publish("output/lcd/text", "--", {
      source: "core",
      targetId: "lcd2",
      targetAddress: "0x53",
    });
    router.publish("output/lcd/text", "12°C 45%", {
      source: "core",
      targetId: "lcd3",
      targetAddress: "0x56",
    });

    expect(router.getLatest("output/lcd/text", "lcd1")?.value).toBe("Tokyo 01:39");
    expect(router.getLatest("output/lcd/text", "lcd2")?.value).toBe("--");
    expect(router.getLatest("output/lcd/text", "lcd3")?.value).toBe("12°C 45%");
    expect(router.getLatest("output/lcd/text")).toBeUndefined();
  });
});
