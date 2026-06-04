import { describe, it, expect } from "vitest";
import { parseChain } from "./chain-parser.js";
import {
  compileChainToGraph,
  getRemainderEdges,
  hasRemainderEdge,
} from "./capability-graph.js";

const CORE = "core/core";

function makeChain(...definitionIds: string[]) {
  return definitionIds.map((definitionId, i) => ({
    instanceId: `cube-${i}`,
    definitionId,
  }));
}

function withCore(...definitionIds: string[]) {
  return makeChain(...definitionIds, CORE);
}

describe("compileChainToGraph", () => {
  it("creates remainder edges between consecutive LCD viewports", () => {
    const parsed = parseChain(
      withCore("identity/london", "identity/weather", "output/lcd", "output/lcd"),
    );
    const graph = compileChainToGraph(parsed);
    const lcds = graph.nodes.filter((n) => n.cubeId === "output/lcd");

    expect(lcds).toHaveLength(2);
    expect(hasRemainderEdge(graph, lcds[0]!.id, lcds[1]!.id)).toBe(true);
    expect(getRemainderEdges(graph)).toHaveLength(1);
  });

  it("chains three LCDs with two remainder edges", () => {
    const parsed = parseChain(
      withCore("output/lcd", "output/lcd", "output/lcd"),
    );
    const graph = compileChainToGraph(parsed);
    expect(getRemainderEdges(graph)).toHaveLength(2);
  });

  it("links payload nodes in chain order", () => {
    const parsed = parseChain(
      withCore("identity/london", "identity/weather", "source/time", "output/lcd"),
    );
    const graph = compileChainToGraph(parsed);
    const payloadEdges = graph.edges.filter((e) => e.channel === "payload");
    expect(payloadEdges.length).toBeGreaterThanOrEqual(2);
  });

  it("is deterministic for the same chain", () => {
    const input = withCore("sensor/temperature", "output/lcd", "output/lcd");
    const a = compileChainToGraph(parseChain(input));
    const b = compileChainToGraph(parseChain(input));
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("includes light as output node without remainder to LCD", () => {
    const parsed = parseChain(
      withCore("identity/weather", "output/light", "output/lcd"),
    );
    const graph = compileChainToGraph(parsed);
    const light = graph.nodes.find((n) => n.cubeId === "output/light");
    const lcd = graph.nodes.find((n) => n.cubeId === "output/lcd");
    expect(light?.kind).toBe("output");
    expect(lcd?.kind).toBe("consumer");
    expect(
      graph.edges.some(
        (e) => e.channel === "remainder" && e.from === light!.id,
      ),
    ).toBe(false);
  });
});
