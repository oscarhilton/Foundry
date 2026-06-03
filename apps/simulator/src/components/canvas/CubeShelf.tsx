import { useRef, useState } from "react";
import { Group, Text } from "react-konva";
import type Konva from "konva";
import { CUBE_DEFINITIONS, STARTER_CUBE_IDS } from "@foundry/cube-defs";
import { useSimulatorStore } from "../../store";
import { getShelfSlotPosition, type StageLayout } from "./layout";
import { CubeNode, type CubeVisualState } from "./CubeNode";
import { tweenTo } from "./animations";

interface CubeShelfProps {
  layout: StageLayout;
  animTime: number;
  onDropToChain: (definitionId: string, x: number, y: number) => boolean;
}

export function CubeShelf({ layout, animTime, onDropToChain }: CubeShelfProps) {
  const productMode = useSimulatorStore((s) => s.productMode);
  const showExtendedCubes = useSimulatorStore((s) => s.showExtendedCubes);
  const toggleExtendedCubes = useSimulatorStore((s) => s.toggleExtendedCubes);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const homeRefs = useRef<Map<string, { x: number; y: number }>>(new Map());
  const nodeRefs = useRef<Map<string, Konva.Group>>(new Map());

  const showStarterOnly = productMode && !showExtendedCubes;
  const visibleCubes = showStarterOnly
    ? CUBE_DEFINITIONS.filter((c) => STARTER_CUBE_IDS.has(c.id))
    : CUBE_DEFINITIONS;

  const row1 = visibleCubes.filter((_, i) => i < Math.ceil(visibleCubes.length / 2));
  const row2 = visibleCubes.filter((_, i) => i >= Math.ceil(visibleCubes.length / 2));

  const visualState: CubeVisualState = {
    outputState: {
      powered: false,
      coreCount: 0,
      lightBrightness: 0.02,
      chimeTriggered: false,
      chimeCount: 0,
      activeRecipeId: null,
      activeRecipeName: null,
      warnings: [],
      placeLabel: null,
      placeId: null,
      placeTimezone: null,
      weatherTemp: null,
      weatherRain: null,
      dialPosition: 0.65,
      sliderPosition: 0.5,
      motionDetected: false,
      buttonPressed: false,
      githubActivity: null,
      musicNote: null,
      musicVelocity: null,
      displayText: null,
      lcdText: null,
      lcdTexts: {},
      sensorTemp: null,
      timeHour: null,
      powerSource: "usb",
      batteryPercent: 100,
    },
    animTime,
    recipeActive: false,
    powered: false,
    debugOpen: false,
    inChain: false,
  };

  const renderRow = (cubes: typeof CUBE_DEFINITIONS, row: 0 | 1) =>
    cubes.map((def, index) => {
      const home = getShelfSlotPosition(layout, row, index, cubes.length);
      homeRefs.current.set(def.id, home);
      const isDragging = draggingId === def.id;

      return (
        <Group
          key={def.id}
          x={home.x}
          y={home.y}
          ref={(node) => {
            if (node) nodeRefs.current.set(def.id, node);
            else nodeRefs.current.delete(def.id);
          }}
        >
          <CubeNode
            definition={def}
            x={0}
            y={0}
            draggable
            dragScale={isDragging ? 1.06 : 1}
            opacity={isDragging ? 0.85 : 1}
            visualState={visualState}
            onDragStart={() => setDraggingId(def.id)}
            onDragEnd={(dragX, dragY, node) => {
              setDraggingId(null);
              const homePos = homeRefs.current.get(def.id)!;
              const dropped = onDropToChain(def.id, homePos.x + dragX, homePos.y + dragY);
              const shelfNode = nodeRefs.current.get(def.id);
              if (!dropped && shelfNode) {
                tweenTo(shelfNode, { x: homePos.x, y: homePos.y }, 0.2);
              }
              if (node) node.position({ x: 0, y: 0 });
            }}
          />
        </Group>
      );
    });

  const hintText = showStarterOnly
    ? "Starter kit — drag onto the chain · order matters, read left to right"
    : "Cubes — drag onto the chain above";

  return (
    <Group>
      <Text
        x={40}
        y={layout.shelfRow1Y - 24}
        text={hintText}
        fontSize={11}
        fill="#9CA3AF"
        fontFamily="Helvetica Neue, Helvetica, Arial, sans-serif"
      />
      {productMode && (
        <Group
          onClick={toggleExtendedCubes}
          onTap={toggleExtendedCubes}
        >
          <Text
            x={layout.width - 140}
            y={layout.shelfRow1Y - 24}
            text={showExtendedCubes ? "Starter kit ↑" : "More cubes →"}
            fontSize={11}
            fill="#457B9D"
            fontFamily="Helvetica Neue, Helvetica, Arial, sans-serif"
          />
        </Group>
      )}
      {renderRow(row1, 0)}
      {renderRow(row2, 1)}
    </Group>
  );
}
