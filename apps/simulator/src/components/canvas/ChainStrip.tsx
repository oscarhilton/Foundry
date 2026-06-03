import { useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
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
import { useAnimTime } from "./useAnimTime";
import { useEffectTimestamps } from "./effect-timestamps";

interface ChainStripProps {
  layout: StageLayout;
  onCubeHover?: (label: string, description: string, clientX: number, clientY: number) => void;
  onCubeHoverEnd?: () => void;
}

function firstId(chain: { instanceId: string; definitionId: string }[], defId: string) {
  return chain.find((c) => c.definitionId === defId)?.instanceId;
}

const DIAL_HINT_DELAY_MS = 10_000;

export function ChainStrip({ layout, onCubeHover, onCubeHoverEnd }: ChainStripProps) {
  const animTime = useAnimTime();
  const chain = useSimulatorStore((s) => s.chain);
  const outputState = useSimulatorStore((s) => s.outputState);
  const activeRecipeName = useSimulatorStore((s) => s.activeRecipeName);
  const layoutVersion = useSimulatorStore((s) => s.layoutVersion);
  const showCoreDebug = useSimulatorStore((s) => s.showCoreDebug);
  const productMode = useSimulatorStore((s) => s.productMode);
  const onboarding = useSimulatorStore((s) => s.onboarding);
  const recipeActiveSince = useSimulatorStore((s) => s.recipeActiveSince);
  const reorderChain = useSimulatorStore((s) => s.reorderChain);
  const removeCube = useSimulatorStore((s) => s.removeCube);
  const setDialPosition = useSimulatorStore((s) => s.setDialPosition);
  const setSliderPosition = useSimulatorStore((s) => s.setSliderPosition);
  const triggerMotion = useSimulatorStore((s) => s.triggerMotion);
  const triggerButton = useSimulatorStore((s) => s.triggerButton);
  const openCoreDebug = useSimulatorStore((s) => s.openCoreDebug);
  const dismissFlowHint = useSimulatorStore((s) => s.dismissFlowHint);

  const effectTimestamps = useEffectTimestamps(
    useShallow((s) => ({
      chimeFiredAt: s.chimeFiredAt,
      buttonFiredAt: s.buttonFiredAt,
      motionFiredAt: s.motionFiredAt,
      lcdChangedAt: s.lcdChangedAt,
      musicNoteFiredAt: s.musicNoteFiredAt,
      lastMusicNote: s.lastMusicNote,
      poweredAt: s.poweredAt,
    })),
  );

  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const groupRefs = useRef<Map<string, Konva.Group>>(new Map());
  const prevLayoutVersion = useRef(-1);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!onboarding.flowHintActive) return;
    const id = setTimeout(() => dismissFlowHint(), 20_000);
    return () => clearTimeout(id);
  }, [onboarding.flowHintActive, dismissFlowHint]);

  const recipeActive = activeRecipeName !== null;
  const flowPulse = onboarding.flowHintActive
    ? 0.75 + Math.sin(animTime * 0.008) * 0.25
    : 1;
  const signalPulse = outputState.powered && recipeActive
    ? 0.55 + Math.sin(animTime * 0.004 + 0.5) * 0.25
    : 0.35;
  const connectorOpacity = outputState.powered ? signalPulse * flowPulse : 0.35 * flowPulse;

  const hasDial = chain.some((c) => c.definitionId === "control/dial");
  const dialHintEligible =
    productMode &&
    hasDial &&
    recipeActive &&
    !onboarding.hasUsedDial &&
    recipeActiveSince !== null &&
    now - recipeActiveSince > DIAL_HINT_DELAY_MS;

  const showOrderHint =
    productMode && chain.length > 0 && !activeRecipeName;

  const visualBase: Omit<
    CubeVisualState,
    | "isPrimaryLight"
    | "isPrimaryDial"
    | "isPrimaryChime"
    | "isPrimaryMusic"
    | "isPrimaryButton"
    | "isPrimarySlider"
    | "lcdText"
    | "isInactiveLight"
    | "isInactiveMusic"
    | "isInactiveChime"
    | "dialHintPulse"
  > = {
    outputState,
    animTime,
    recipeActive,
    powered: outputState.powered,
    debugOpen: showCoreDebug,
    inChain: true,
    effectTimestamps,
  };

  const primaryLightId = firstId(chain, "output/light");

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
        listening={false}
        points={[40, layout.shelfRow1Y - 36, layout.width - 40, layout.shelfRow1Y - 36]}
        stroke="#E5E7EB"
        strokeWidth={1}
      />

      {showOrderHint && (
        <Text
          listening={false}
          x={layout.width / 2 - 95}
          y={layout.chainY - 28}
          text="Read left to right →"
          fontSize={12}
          fill="#457B9D"
          fontFamily="Helvetica Neue, Helvetica, Arial, sans-serif"
          opacity={0.85 + Math.sin(animTime * 0.003) * 0.15}
        />
      )}

      {chain.length === 0 && (
        <Text
          listening={false}
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
        const isPrimaryLight = cube.instanceId === primaryLightId;
        const isPrimaryDial = cube.instanceId === firstId(chain, "control/dial");

        return (
          <Group key={cube.instanceId}>
            {index > 0 && (
              <Arrow
                listening={false}
                points={[
                  pos.x - CONNECTOR_W,
                  pos.y + CUBE_SIZE / 2,
                  pos.x - 4,
                  pos.y + CUBE_SIZE / 2,
                ]}
                stroke={
                  onboarding.flowHintActive
                    ? "#457B9D"
                    : outputState.powered
                      ? "#D1D5DB"
                      : "#E5E7EB"
                }
                fill={
                  onboarding.flowHintActive
                    ? "#457B9D"
                    : outputState.powered
                      ? "#D1D5DB"
                      : "#E5E7EB"
                }
                strokeWidth={onboarding.flowHintActive ? 2 : 1.5}
                pointerLength={onboarding.flowHintActive ? 8 : 6}
                pointerWidth={onboarding.flowHintActive ? 8 : 6}
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
                  isPrimaryLight,
                  isPrimaryDial,
                  isInactiveLight: def.id === "output/light" && !isPrimaryLight,
                  isInactiveMusic: def.id === "output/music" && cube.instanceId !== firstId(chain, "output/music"),
                  isInactiveChime: def.id === "output/chime" && cube.instanceId !== firstId(chain, "output/chime"),
                  dialHintPulse: isPrimaryDial && dialHintEligible,
                  isPrimaryChime: cube.instanceId === firstId(chain, "output/chime"),
                  isPrimaryMusic: cube.instanceId === firstId(chain, "output/music"),
                  lcdText: outputState.lcdTexts[cube.instanceId] ?? null,
                  isPrimaryButton: cube.instanceId === firstId(chain, "control/button"),
                  isPrimarySlider: cube.instanceId === firstId(chain, "control/slider"),
                }}
                onClick={() => handleCubeClick(def.id)}
                onDialChange={setDialPosition}
                onSliderChange={setSliderPosition}
                onHoverStart={(definition, clientX, clientY) =>
                  onCubeHover?.(
                    definition.label,
                    definition.description ?? "",
                    clientX,
                    clientY,
                  )
                }
                onHoverEnd={onCubeHoverEnd}
              />
            </Group>
          </Group>
        );
      })}
    </Group>
  );
}
