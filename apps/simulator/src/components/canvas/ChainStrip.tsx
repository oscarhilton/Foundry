import { useEffect, useRef, useState } from "react";
import { Group, Arrow, Line, Text } from "react-konva";
import type Konva from "konva";
import { getDefinition, useSimulatorStore } from "../../store";
import {
  CUBE_SIZE,
  CONNECTOR_W,
  getChainSlotPosition,
  findNearestChainSlot,
  isNearChainStrip,
  type StageLayout,
} from "./layout";
import { CubeNode, type CubeVisualState } from "./CubeNode";
import { tweenTo } from "./animations";

interface ChainStripProps {
  layout: StageLayout;
  animTime: number;
}

function firstId(chain: { instanceId: string; definitionId: string }[], defId: string) {
  return chain.find((c) => c.definitionId === defId)?.instanceId;
}

export function ChainStrip({ layout, animTime }: ChainStripProps) {
  const chain = useSimulatorStore((s) => s.chain);
  const outputState = useSimulatorStore((s) => s.outputState);
  const activeRecipeName = useSimulatorStore((s) => s.activeRecipeName);
  const layoutVersion = useSimulatorStore((s) => s.layoutVersion);
  const showCoreDebug = useSimulatorStore((s) => s.showCoreDebug);
  const reorderChain = useSimulatorStore((s) => s.reorderChain);
  const removeCube = useSimulatorStore((s) => s.removeCube);
  const setDialPosition = useSimulatorStore((s) => s.setDialPosition);
  const setSliderPosition = useSimulatorStore((s) => s.setSliderPosition);
  const triggerMotion = useSimulatorStore((s) => s.triggerMotion);
  const triggerButton = useSimulatorStore((s) => s.triggerButton);
  const openCoreDebug = useSimulatorStore((s) => s.openCoreDebug);

  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const groupRefs = useRef<Map<string, Konva.Group>>(new Map());
  const prevLayoutVersion = useRef(-1);

  const recipeActive = activeRecipeName !== null;
  const connectorOpacity = outputState.powered
    ? 0.55 + Math.sin(animTime * 0.004) * 0.25
    : 0.35;

  const visualBase: Omit<CubeVisualState, "isPrimaryLight" | "isPrimaryDial" | "isPrimaryChime" | "isPrimaryMusic" | "isPrimaryDisplay" | "isPrimaryButton" | "isPrimarySlider" | "lcdText"> = {
    outputState,
    animTime,
    recipeActive,
    powered: outputState.powered,
    debugOpen: showCoreDebug,
    inChain: true,
  };

  useEffect(() => {
    if (prevLayoutVersion.current === layoutVersion) return;
    prevLayoutVersion.current = layoutVersion;

    chain.forEach((cube, index) => {
      const node = groupRefs.current.get(cube.instanceId);
      if (!node) return;
      const target = getChainSlotPosition(layout, index, chain.length);
      node.position({
        x: target.x,
        y: layout.shelfRow2Y,
      });
      node.opacity(0.5);
      setTimeout(() => {
        tweenTo(node, { x: target.x, y: target.y, opacity: 1 }, 0.35);
      }, index * 150);
    });
  }, [layoutVersion, chain, layout]);

  useEffect(() => {
    chain.forEach((cube, index) => {
      if (dragIndex === index) return;
      const node = groupRefs.current.get(cube.instanceId);
      if (!node) return;
      const target = getChainSlotPosition(layout, index, chain.length);
      if (Math.abs(node.x() - target.x) > 1 || Math.abs(node.y() - target.y) > 1) {
        tweenTo(node, { x: target.x, y: target.y }, 0.2);
      }
    });
  }, [chain, layout.width, layout.height, dragIndex]);

  const handleDragEnd = (index: number, node: Konva.Group) => {
    setDragIndex(null);
    setDropTargetIndex(null);

    const x = node.x();
    const y = node.y();

    if (!isNearChainStrip(x + CUBE_SIZE / 2, y + CUBE_SIZE / 2, layout)) {
      const target = getChainSlotPosition(layout, index, chain.length);
      tweenTo(node, { x: target.x, y: target.y }, 0.2);
      return;
    }

    const newIndex = findNearestChainSlot(x + CUBE_SIZE / 2, layout, chain.length);
    if (newIndex !== index) {
      reorderChain(index, newIndex);
    } else {
      const target = getChainSlotPosition(layout, index, chain.length);
      tweenTo(node, { x: target.x, y: target.y }, 0.2);
    }
  };

  const hintX = layout.width / 2 - 180;

  const handleCubeClick = (defId: string) => {
    if (defId === "sensor/motion") triggerMotion();
    if (defId === "control/button") triggerButton();
    if (defId === "core/core") openCoreDebug();
  };

  return (
    <Group>
      <Line
        points={[40, layout.shelfRow1Y - 36, layout.width - 40, layout.shelfRow1Y - 36]}
        stroke="#E5E7EB"
        strokeWidth={1}
      />

      {chain.length === 0 && (
        <Text
          x={hintX}
          y={layout.chainY + CUBE_SIZE / 2 - 8}
          text="Drag cubes from the shelf — include Core for power"
          fontSize={14}
          fill="#9CA3AF"
          fontFamily="Helvetica Neue, Helvetica, Arial, sans-serif"
        />
      )}

      {chain.map((cube, index) => {
        const def = getDefinition(cube.definitionId);
        if (!def) return null;

        const pos = getChainSlotPosition(layout, index, chain.length);
        const isDragging = dragIndex === index;

        return (
          <Group key={cube.instanceId}>
            {index > 0 && (
              <Arrow
                points={[
                  pos.x - CONNECTOR_W,
                  pos.y + CUBE_SIZE / 2,
                  pos.x - 4,
                  pos.y + CUBE_SIZE / 2,
                ]}
                stroke={outputState.powered ? "#D1D5DB" : "#E5E7EB"}
                fill={outputState.powered ? "#D1D5DB" : "#E5E7EB"}
                strokeWidth={1.5}
                pointerLength={6}
                pointerWidth={6}
                opacity={connectorOpacity}
              />
            )}

            <Group
              draggable
              ref={(node) => {
                if (node) {
                  groupRefs.current.set(cube.instanceId, node);
                  const target = getChainSlotPosition(layout, index, chain.length);
                  if (node.getAttr("dataInit") !== cube.instanceId) {
                    node.position({ x: target.x, y: target.y });
                    node.setAttr("dataInit", cube.instanceId);
                  }
                } else {
                  groupRefs.current.delete(cube.instanceId);
                }
              }}
              onDragStart={() => setDragIndex(index)}
              onDragMove={(e) => {
                const node = e.target as Konva.Group;
                const slot = findNearestChainSlot(
                  node.x() + CUBE_SIZE / 2,
                  layout,
                  chain.length,
                );
                setDropTargetIndex(slot);
              }}
              onDragEnd={(e) => handleDragEnd(index, e.target as Konva.Group)}
              onDblClick={() => removeCube(cube.instanceId)}
            >
              <CubeNode
                definition={def}
                x={0}
                y={0}
                isDropTarget={dropTargetIndex === index}
                dragScale={isDragging ? 1.04 : 1}
                visualState={{
                  ...visualBase,
                  isPrimaryLight: cube.instanceId === firstId(chain, "output/light"),
                  isPrimaryDial: cube.instanceId === firstId(chain, "control/dial"),
                  isPrimaryChime: cube.instanceId === firstId(chain, "output/chime"),
                  isPrimaryMusic: cube.instanceId === firstId(chain, "output/music"),
                  isPrimaryDisplay: cube.instanceId === firstId(chain, "output/display"),
                  lcdText: outputState.lcdTexts[cube.instanceId] ?? null,
                  isPrimaryButton: cube.instanceId === firstId(chain, "control/button"),
                  isPrimarySlider: cube.instanceId === firstId(chain, "control/slider"),
                }}
                onClick={() => handleCubeClick(def.id)}
                onDialChange={setDialPosition}
                onSliderChange={setSliderPosition}
              />
            </Group>
          </Group>
        );
      })}
    </Group>
  );
}
