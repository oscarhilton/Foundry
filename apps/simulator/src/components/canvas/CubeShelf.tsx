import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { FoundryOutputState } from "@foundry/runtime";
import { CUBE_DEFINITIONS, STARTER_CUBE_IDS } from "@foundry/cube-defs";
import { useSimulatorStore } from "../../store";
import { CUBE_SIZE } from "./layout";
import { CubeNode, type CubeVisualState } from "./CubeNode";
import { EMPTY_EFFECT_TIMESTAMPS } from "./effect-timestamps";

interface CubeShelfProps {
  onCubeHover?: (label: string, description: string, clientX: number, clientY: number) => void;
  onCubeHoverEnd?: () => void;
}

const SHELF_OUTPUT_STATE: FoundryOutputState = {
  powered: false,
  coreCount: 0,
  lightBrightness: 0.02,
  lightMood: null,
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
  weatherFace: null,
  dialPosition: 0.65,
  sliderPosition: 0.5,
  motionDetected: false,
  buttonPressed: false,
  githubActivity: null,
  musicNote: null,
  musicVelocity: null,
  lcdText: null,
  lcdTexts: {},
  sensorTemp: null,
  timeHour: null,
  modifierRandom: null,
  modifierCalmNoise: null,
  powerSource: "usb",
  batteryPercent: 100,
  buttonCircuitClosed: false,
  resolvedWeather: null,
  timerFaceIndex: 0,
  timerRemainingMs: null,
  timerRunning: false,
};

const SHELF_VISUAL_STATE: CubeVisualState = {
  outputState: SHELF_OUTPUT_STATE,
  animTime: 0,
  recipeActive: false,
  powered: false,
  debugOpen: false,
  inChain: false,
  effectTimestamps: EMPTY_EFFECT_TIMESTAMPS,
};

function ShelfCube({
  definitionId,
  onCubeHover,
  onCubeHoverEnd,
}: {
  definitionId: string;
  onCubeHover?: CubeShelfProps["onCubeHover"];
  onCubeHoverEnd?: CubeShelfProps["onCubeHoverEnd"];
}) {
  const def = CUBE_DEFINITIONS.find((c) => c.id === definitionId);
  const { attributes, listeners, setNodeRef, transform, isDragging: dragging } =
    useDraggable({
      id: `shelf:${definitionId}`,
      data: { source: "shelf", definitionId },
    });

  if (!def) return null;

  const dragTransform = CSS.Translate.toString(transform);

  return (
    <div
      ref={setNodeRef}
      className="shrink-0 justify-self-center"
      style={{
        width: dragging ? 0 : CUBE_SIZE,
        margin: dragging ? 0 : undefined,
        transform: dragTransform ?? undefined,
        opacity: dragging ? 0 : 1,
        transition: "width 200ms ease, margin 200ms ease, opacity 200ms ease",
      }}
    >
      <CubeNode
        definition={def}
        visualState={SHELF_VISUAL_STATE}
        dragScale={dragging ? 1.06 : 1}
        dragListeners={listeners}
        dragAttributes={attributes}
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
    </div>
  );
}

export function CubeShelf({ onCubeHover, onCubeHoverEnd }: CubeShelfProps) {
  const productMode = useSimulatorStore((s) => s.productMode);
  const showExtendedCubes = useSimulatorStore((s) => s.showExtendedCubes);
  const toggleExtendedCubes = useSimulatorStore((s) => s.toggleExtendedCubes);

  const showStarterOnly = productMode && !showExtendedCubes;
  const visibleCubes = showStarterOnly
    ? CUBE_DEFINITIONS.filter((c) => STARTER_CUBE_IDS.has(c.id))
    : CUBE_DEFINITIONS;

  const hintText = showStarterOnly
    ? "Starter kit — drag onto the chain · order matters"
    : "Cubes — drag onto the chain above";

  return (
    <section className="flex shrink-0 flex-col gap-3 border-t border-[#E5E7EB] px-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 md:px-4 md:pt-4">
      <div className="flex flex-col gap-1 px-1 md:flex-row md:items-center md:justify-between md:gap-4 md:px-2">
        <p className="text-[11px] text-[#9CA3AF] text-center md:text-left">{hintText}</p>
        {productMode && (
          <button
            type="button"
            className="shrink-0 text-[11px] text-[#457B9D] hover:underline text-center md:text-right"
            onClick={toggleExtendedCubes}
          >
            {showExtendedCubes ? "Starter kit ↑" : "More cubes →"}
          </button>
        )}
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-9 gap-3 md:gap-2 justify-items-center max-w-4xl mx-auto w-full px-1">
        {visibleCubes.map((def) => (
          <ShelfCube
            key={def.id}
            definitionId={def.id}
            onCubeHover={onCubeHover}
            onCubeHoverEnd={onCubeHoverEnd}
          />
        ))}
      </div>
    </section>
  );
}
