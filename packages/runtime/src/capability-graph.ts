import type { ParsedChain, ParsedChainSlot } from "./chain-parser.js";

export type GraphNodeKind = "source" | "transform" | "consumer" | "output" | "core";

export type GraphEdgeChannel = "payload" | "remainder" | "event";

export interface GraphNode {
  id: string;
  cubeId: string;
  instanceId: string;
  kind: GraphNodeKind;
  chainIndex: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  channel: GraphEdgeChannel;
}

export interface CapabilityGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

function roleToKind(
  role: ParsedChainSlot["definition"]["role"],
  cubeId: string,
): GraphNodeKind {
  if (role === "core") return "core";
  if (cubeId === "output/lcd") return "consumer";
  if (role === "output") return "output";
  if (role === "source" || role === "place" || role === "sensor") return "source";
  return "transform";
}

/** Compile a linear chain into a capability graph (MVP: no branching). */
export function compileChainToGraph(chain: ParsedChain): CapabilityGraph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  const signalNodes: GraphNode[] = [];

  for (let i = 0; i < chain.cubes.length; i++) {
    const slot = chain.cubes[i]!;
    const kind = roleToKind(slot.definition.role, slot.definition.id);
    const node: GraphNode = {
      id: slot.instanceId,
      cubeId: slot.definition.id,
      instanceId: slot.instanceId,
      kind,
      chainIndex: i,
    };
    nodes.push(node);

    if (kind !== "core" && kind !== "consumer" && kind !== "output") {
      signalNodes.push(node);
    } else if (kind === "output") {
      signalNodes.push(node);
    }
  }

  const payloadNodes = nodes.filter(
    (n) => n.kind !== "core" && n.cubeId !== "output/lcd",
  );

  for (let i = 1; i < payloadNodes.length; i++) {
    edges.push({
      from: payloadNodes[i - 1]!.id,
      to: payloadNodes[i]!.id,
      channel: "payload",
    });
  }

  const viewports = nodes.filter((n) => n.cubeId === "output/lcd");
  for (let i = 1; i < viewports.length; i++) {
    edges.push({
      from: viewports[i - 1]!.id,
      to: viewports[i]!.id,
      channel: "remainder",
    });
  }

  if (payloadNodes.length > 0 && viewports.length > 0) {
    const lastPayload = payloadNodes[payloadNodes.length - 1]!;
    const firstViewport = viewports[0]!;
    const alreadyLinked = edges.some(
      (e) => e.from === lastPayload.id && e.to === firstViewport.id,
    );
    if (!alreadyLinked) {
      edges.push({
        from: lastPayload.id,
        to: firstViewport.id,
        channel: "payload",
      });
    }
  }

  return { nodes, edges };
}

export function getRemainderEdges(graph: CapabilityGraph): GraphEdge[] {
  return graph.edges.filter((e) => e.channel === "remainder");
}

export function hasRemainderEdge(
  graph: CapabilityGraph,
  fromInstanceId: string,
  toInstanceId: string,
): boolean {
  return graph.edges.some(
    (e) =>
      e.channel === "remainder" &&
      e.from === fromInstanceId &&
      e.to === toInstanceId,
  );
}
