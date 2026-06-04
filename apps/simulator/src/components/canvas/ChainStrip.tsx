import { Fragment, useEffect, useState, forwardRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { getDefinition, useSimulatorStore } from "../../store";
import { CUBE_SIZE } from "./layout";
import { CubeNode, type CubeVisualState } from "./CubeNode";
import { ChainConnector } from "./ChainConnector";
import { ChainInsertGap } from "./ChainInsertGap";
import { useAnimTime } from "./useAnimTime";
import { useEffectTimestamps } from "./effect-timestamps";
import { useCanvasLayout } from "./CanvasLayoutContext";

interface ChainStripProps {
  insertIndex?: number | null;
  onCubeHover?: (label: string, description: string, clientX: number, clientY: number) => void;
  onCubeHoverEnd?: () => void;
}

function firstId(chain: { instanceId: string; definitionId: string }[], defId: string) {
  return chain.find((c) => c.definitionId === defId)?.instanceId;
}

const DIAL_HINT_DELAY_MS = 10_000;

interface SortableChainCubeProps {
  instanceId: string;
  isDropTarget: boolean;
  visualState: CubeVisualState & {
    isPrimaryLight: boolean;
    isPrimaryDial: boolean;
    isInactiveLight: boolean;
    isInactiveMusic: boolean;
    isInactiveChime: boolean;
    dialHintPulse: boolean;
    isPrimaryChime: boolean;
    isPrimaryMusic: boolean;
    lcdText: string | null;
    isPrimaryButton: boolean;
    isPrimarySlider: boolean;
  };
  onCubeClick: (defId: string) => void;
  onCubeHover?: ChainStripProps["onCubeHover"];
  onCubeHoverEnd?: ChainStripProps["onCubeHoverEnd"];
}

function SortableChainCube({
  instanceId,
  isDropTarget,
  visualState,
  onCubeClick,
  onCubeHover,
  onCubeHoverEnd,
}: SortableChainCubeProps) {
  const cube = useSimulatorStore((s) => s.chain.find((c) => c.instanceId === instanceId));
  const removeCube = useSimulatorStore((s) => s.removeCube);
  const setDialPosition = useSimulatorStore((s) => s.setDialPosition);
  const setSliderPosition = useSimulatorStore((s) => s.setSliderPosition);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: instanceId });

  const def = cube ? getDefinition(cube.definitionId) : null;
  if (!def || !cube) return null;

  const sortableTransform = CSS.Transform.toString(transform);

  return (
    <div
      ref={setNodeRef}
      className="flex shrink-0 flex-col items-center gap-1.5"
      style={{
        transform: sortableTransform ?? undefined,
        transition: isDragging ? undefined : transition,
        zIndex: isDragging ? 10 : undefined,
        opacity: isDragging ? 0 : 1,
        minHeight: isDragging ? CUBE_SIZE : undefined,
      }}
    >
      <CubeNode
        definition={def}
        visualState={visualState}
        isDropTarget={isDropTarget}
        dragScale={isDragging ? 1.04 : 1}
        dragListeners={listeners}
        dragAttributes={attributes}
        onDblClick={() => removeCube(cube.instanceId)}
        onClick={() => onCubeClick(def.id)}
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
      <span className="max-w-[6.5rem] truncate text-center text-[10px] font-medium leading-tight text-[#86868B]">
        {def.label}
      </span>
    </div>
  );
}

export const ChainStrip = forwardRef<HTMLElement, ChainStripProps>(function ChainStrip(
  { insertIndex = null, onCubeHover, onCubeHoverEnd },
  ref,
) {
  const animTime = useAnimTime();
  const chain = useSimulatorStore((s) => s.chain);
  const outputState = useSimulatorStore((s) => s.outputState);
  const activeRecipeName = useSimulatorStore((s) => s.activeRecipeName);
  const showCoreDebug = useSimulatorStore((s) => s.showCoreDebug);
  const productMode = useSimulatorStore((s) => s.productMode);
  const onboarding = useSimulatorStore((s) => s.onboarding);
  const recipeActiveSince = useSimulatorStore((s) => s.recipeActiveSince);
  const triggerMotion = useSimulatorStore((s) => s.triggerMotion);
  const triggerButton = useSimulatorStore((s) => s.triggerButton);
  const openCoreDebug = useSimulatorStore((s) => s.openCoreDebug);
  const dismissFlowHint = useSimulatorStore((s) => s.dismissFlowHint);
  const { layout } = useCanvasLayout();
  const isVertical = layout === "vertical";

  const { setNodeRef: setDropRef } = useDroppable({ id: "chain-strip" });

  const setSectionRef = (node: HTMLElement | null) => {
    setDropRef(node);
    if (typeof ref === "function") {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  };

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

  const [now, setNow] = useState(Date.now());

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

  const warnings = useSimulatorStore((s) => s.warnings);
  const multipleLightsWarning = warnings.some((w) =>
    w.includes("Multiple Light cubes"),
  );
  const multiDisplayHint = warnings.some((w) =>
    w.includes("Multiple displays share"),
  );

  const primaryLightId = firstId(chain, "output/light");

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

  const handleCubeClick = (defId: string) => {
    if (defId === "sensor/motion") triggerMotion();
    if (defId === "control/button") triggerButton();
    if (defId === "core/core") openCoreDebug();
  };

  return (
    <section
      ref={setSectionRef}
      className="flex w-full shrink-0 flex-col items-center gap-4 rounded-2xl bg-white/50 px-4 py-8 md:min-h-0 md:flex-1 md:justify-center md:gap-3 md:bg-transparent md:px-10 md:py-8"
    >
      {!outputState.powered && chain.length > 0 && (
        <p className="w-full max-w-md text-center text-xs px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800">
          Chain unpowered — add exactly one Core cube
        </p>
      )}

      {multipleLightsWarning && outputState.powered && (
        <p className="w-full max-w-md text-center text-xs px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800">
          Only the first Light cube drives brightness
        </p>
      )}

      {multiDisplayHint && outputState.powered && (
        <p className="w-full max-w-md text-center text-xs px-3 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-800">
          Extra displays split the same upstream information — like adding another monitor
        </p>
      )}

      {showOrderHint && (
        <p
          className="pointer-events-none text-center text-xs text-[#457B9D] px-2"
          style={{ opacity: 0.85 + Math.sin(animTime * 0.003) * 0.15 }}
        >
          {isVertical ? "Read top to bottom ↓" : "Read left to right →"}
        </p>
      )}

      {chain.length === 0 && (
        <p className="pointer-events-none text-center text-sm text-[#9CA3AF] px-4 max-w-xs">
          Drag cubes from the shelf below — include Core for power
        </p>
      )}

      <SortableContext
        items={chain.map((c) => c.instanceId)}
        strategy={
          isVertical
            ? verticalListSortingStrategy
            : horizontalListSortingStrategy
        }
      >
        <div
          className={
            isVertical
              ? "flex flex-col items-center gap-2"
              : "flex flex-row flex-wrap items-center justify-center gap-x-0"
          }
        >
          {chain.length === 0 && insertIndex === 0 && (
            <ChainInsertGap
              showConnector={false}
              connectorOpacity={connectorOpacity}
              flowHintActive={onboarding.flowHintActive}
              powered={outputState.powered}
              orientation={layout}
            />
          )}
          {chain.map((cube, index) => {
            const def = getDefinition(cube.definitionId);
            if (!def) return null;
            const isPrimaryLight = cube.instanceId === primaryLightId;
            const isPrimaryDial = cube.instanceId === firstId(chain, "control/dial");
            const isNeighbor =
              insertIndex === index || insertIndex === index + 1;

            return (
              <Fragment key={cube.instanceId}>
                {insertIndex === index && (
                  <ChainInsertGap
                    showConnector={index > 0}
                    connectorOpacity={connectorOpacity}
                    flowHintActive={onboarding.flowHintActive}
                    powered={outputState.powered}
                    orientation={layout}
                  />
                )}
                {index > 0 && insertIndex !== index && (
                  <ChainConnector
                    opacity={connectorOpacity}
                    flowHintActive={onboarding.flowHintActive}
                    powered={outputState.powered}
                    orientation={layout}
                  />
                )}
                <SortableChainCube
                  instanceId={cube.instanceId}
                  isDropTarget={isNeighbor}
                  onCubeClick={handleCubeClick}
                  onCubeHover={onCubeHover}
                  onCubeHoverEnd={onCubeHoverEnd}
                  visualState={{
                    ...visualBase,
                    isPrimaryLight,
                    isPrimaryDial,
                    isInactiveLight: def.id === "output/light" && !isPrimaryLight,
                    isInactiveMusic:
                      def.id === "output/music" &&
                      cube.instanceId !== firstId(chain, "output/music"),
                    isInactiveChime:
                      def.id === "output/chime" &&
                      cube.instanceId !== firstId(chain, "output/chime"),
                    dialHintPulse: isPrimaryDial && dialHintEligible,
                    isPrimaryChime: cube.instanceId === firstId(chain, "output/chime"),
                    isPrimaryMusic: cube.instanceId === firstId(chain, "output/music"),
                    lcdText: outputState.lcdTexts[cube.instanceId] ?? null,
                    isPrimaryButton: cube.instanceId === firstId(chain, "control/button"),
                    isPrimarySlider: cube.instanceId === firstId(chain, "control/slider"),
                  }}
                />
              </Fragment>
            );
          })}
          {insertIndex === chain.length && chain.length > 0 && (
            <ChainInsertGap
              showConnector
              connectorOpacity={connectorOpacity}
              flowHintActive={onboarding.flowHintActive}
              powered={outputState.powered}
              orientation={layout}
            />
          )}
        </div>
      </SortableContext>
    </section>
  );
});
