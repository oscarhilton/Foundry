import { useRef, useState } from "react";
import { Group, Text } from "react-konva";
import type Konva from "konva";
import { CUBE_DEFINITIONS } from "@foundry/cube-defs";
import { getShelfSlotPosition, type StageLayout } from "./layout";
import { CubeNode, type CubeVisualState } from "./CubeNode";
import { tweenTo } from "./animations";

const ROW1_IDS = new Set([
  "identity/london",
  "identity/tokyo",
  "identity/weather",
  "source/time",
  "modifier/calm",
  "modifier/random",
  "source/github",
  "control/dial",
  "control/button",
  "control/slider",
]);

interface CubeShelfProps {
  layout: StageLayout;
  animTime: number;
  onDropToChain: (definitionId: string, x: number, y: number) => boolean;
}

export function CubeShelf({ layout, animTime, onDropToChain }: CubeShelfProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const homeRefs = useRef<Map<string, { x: number; y: number }>>(new Map());
  const nodeRefs = useRef<Map<string, Konva.Group>>(new Map());

  const row1 = CUBE_DEFINITIONS.filter((c) => ROW1_IDS.has(c.id));
  const row2 = CUBE_DEFINITIONS.filter((c) => !ROW1_IDS.has(c.id));

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
      sensorTemp: null,
      timeHour: null,
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

  return (
    <Group>
      <Text
        x={40}
        y={layout.shelfRow1Y - 24}
        text="Cubes — drag onto the chain above"
        fontSize={11}
        fill="#9CA3AF"
        fontFamily="Helvetica Neue, Helvetica, Arial, sans-serif"
      />
      {renderRow(row1, 0)}
      {renderRow(row2, 1)}
    </Group>
  );
}
