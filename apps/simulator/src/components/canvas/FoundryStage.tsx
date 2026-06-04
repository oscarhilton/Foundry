import { useEffect, useCallback, useState, useRef } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
  type DragCancelEvent,
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
  type DragStartEvent,
  type Active,
} from "@dnd-kit/core";
import { CUBE_DEFINITIONS } from "@foundry/cube-defs";
import { useSimulatorStore } from "../../store";
import {
  findNearestChainSlot,
  chainStripRectFromElement,
  pointerCoordForLayout,
  type ChainLayout,
  type ChainStripRect,
} from "./layout";
import { CanvasLayoutProvider, useCanvasLayout } from "./CanvasLayoutContext";
import { ChainStrip } from "./ChainStrip";
import { CubeShelf } from "./CubeShelf";
import { CubeTooltip, type CubeTooltipData } from "./CubeTooltip";
import { CubeNode } from "./CubeNode";
import { COLORS } from "./design-tokens";
import { EMPTY_EFFECT_TIMESTAMPS } from "./effect-timestamps";

const DEMO_MOTION_INTERVAL_MS = 60_000;

const SHELF_VISUAL_STATE = {
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
    lcdText: null,
    lcdTexts: {},
    sensorTemp: null,
    timeHour: null,
    modifierRandom: null,
    modifierCalmNoise: null,
    powerSource: "usb" as const,
    batteryPercent: 100,
  },
  animTime: 0,
  recipeActive: false,
  powered: false,
  debugOpen: false,
  inChain: false,
  effectTimestamps: EMPTY_EFFECT_TIMESTAMPS,
};

function FoundryStageInner() {
  const chainStripRef = useRef<HTMLElement>(null);
  const { layout } = useCanvasLayout();
  const [tooltip, setTooltip] = useState<CubeTooltipData | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [insertIndex, setInsertIndex] = useState<number | null>(null);
  const lastPointer = useRef({ x: 0, y: 0 });

  const updatePointerFromActive = (active: Active) => {
    const translated = active.rect.current.translated;
    if (translated) {
      lastPointer.current = {
        x: translated.left + translated.width / 2,
        y: translated.top + translated.height / 2,
      };
    }
  };

  const isOverChain = (overId: string | number | undefined, chainIds: string[]) =>
    overId === "chain-strip" || (overId != null && chainIds.includes(String(overId)));

  const computeInsertIndex = (
    activeId: string,
    stripRect: ChainStripRect,
    chainLayout: ChainLayout,
  ) => {
    const coord = pointerCoordForLayout(lastPointer.current, chainLayout);
    let index = findNearestChainSlot(
      coord,
      stripRect,
      chain.length,
      true,
      chainLayout,
    );
    const activeIndex = chain.findIndex((c) => c.instanceId === activeId);
    if (activeIndex >= 0 && index > activeIndex) {
      index -= 1;
    }
    return index;
  };

  const handleCubeHover = useCallback(
    (label: string, description: string, clientX: number, clientY: number) => {
      setTooltip({ label, description, x: clientX, y: clientY });
    },
    [],
  );

  const handleCubeHoverEnd = useCallback(() => {
    setTooltip(null);
  }, []);

  const init = useSimulatorStore((s) => s.init);
  const addCubeToChain = useSimulatorStore((s) => s.addCubeToChain);
  const chain = useSimulatorStore((s) => s.chain);
  const reorderChain = useSimulatorStore((s) => s.reorderChain);
  const productMode = useSimulatorStore((s) => s.productMode);
  const outputState = useSimulatorStore((s) => s.outputState);
  const triggerMotion = useSimulatorStore((s) => s.triggerMotion);

  const hasMotion = chain.some((c) => c.definitionId === "sensor/motion");
  const ambientTint =
    outputState.powered && outputState.lightBrightness > 0.05
      ? Math.min(0.05, outputState.lightBrightness * 0.04)
      : 0;

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (!productMode || !hasMotion || !outputState.powered) return;

    const pulse = () => {
      triggerMotion();
      setTimeout(() => triggerMotion(), 1500);
    };

    const id = setInterval(pulse, DEMO_MOTION_INTERVAL_MS);
    return () => clearInterval(id);
  }, [productMode, hasMotion, outputState.powered, triggerMotion]);

  useEffect(() => {
    setInsertIndex(null);
  }, [layout]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
    updatePointerFromActive(event.active);
  };

  const handleDragMove = (event: DragMoveEvent) => {
    updatePointerFromActive(event.active);
  };

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      updatePointerFromActive(event.active);
      const activeId = String(event.active.id);
      const chainIds = chain.map((c) => c.instanceId);
      const isShelf = activeId.startsWith("shelf:");
      const isChainCube = chainIds.includes(activeId);

      if (!isShelf && !isChainCube) {
        setInsertIndex(null);
        return;
      }

      if (!isOverChain(event.over?.id, chainIds)) {
        setInsertIndex(null);
        return;
      }

      const stripRect = chainStripRectFromElement(chainStripRef.current);
      if (!stripRect) {
        setInsertIndex(null);
        return;
      }

      setInsertIndex(computeInsertIndex(activeId, stripRect, layout));
    },
    [chain, layout],
  );

  const clearDragState = useCallback(() => {
    setActiveDragId(null);
    setInsertIndex(null);
  }, []);

  const handleDragCancel = useCallback(
    (_event: DragCancelEvent) => {
      clearDragState();
    },
    [clearDragState],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      const data = active.data.current as { source?: string; definitionId?: string } | undefined;
      const chainIds = chain.map((c) => c.instanceId);
      const savedInsertIndex = insertIndex;

      clearDragState();

      if (data?.source === "shelf" && data.definitionId && isOverChain(over?.id, chainIds)) {
        const stripRect = chainStripRectFromElement(chainStripRef.current);
        if (stripRect) {
          const coord = pointerCoordForLayout(lastPointer.current, layout);
          const index =
            savedInsertIndex ??
            findNearestChainSlot(coord, stripRect, chain.length, true, layout);
          addCubeToChain(data.definitionId, index);
        }
        return;
      }

      if (over && active.id !== over.id) {
        const oldIndex = chain.findIndex((c) => c.instanceId === active.id);
        const newIndex = chain.findIndex((c) => c.instanceId === over.id);
        if (oldIndex >= 0 && newIndex >= 0) {
          reorderChain(oldIndex, newIndex);
        }
      }
    },
    [chain, insertIndex, layout, addCubeToChain, reorderChain, clearDragState],
  );

  const bgFill =
    ambientTint > 0
      ? `rgb(${245 + ambientTint * 60}, ${245 + ambientTint * 30}, ${243})`
      : COLORS.bg;

  const overlayDefId =
    activeDragId?.startsWith("shelf:") ? activeDragId.slice(6) : null;
  const overlayDef = overlayDefId
    ? CUBE_DEFINITIONS.find((c) => c.id === overlayDefId)
    : null;

  const overlayChainCube =
    activeDragId && !activeDragId.startsWith("shelf:")
      ? chain.find((c) => c.instanceId === activeDragId)
      : null;
  const overlayChainDef = overlayChainCube
    ? CUBE_DEFINITIONS.find((c) => c.id === overlayChainCube.definitionId)
    : null;

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragOver={handleDragOver}
        onDragCancel={handleDragCancel}
        onDragEnd={handleDragEnd}
      >
        <div
          className="flex min-h-0 flex-1 flex-col md:overflow-hidden"
          style={{ background: bgFill }}
        >
          <ChainStrip
            ref={chainStripRef}
            insertIndex={insertIndex}
            onCubeHover={handleCubeHover}
            onCubeHoverEnd={handleCubeHoverEnd}
          />
          <CubeShelf
            onCubeHover={handleCubeHover}
            onCubeHoverEnd={handleCubeHoverEnd}
          />
        </div>
        <DragOverlay>
          {overlayDef && (
            <CubeNode
              definition={overlayDef}
              visualState={SHELF_VISUAL_STATE}
              dragScale={1.06}
              opacity={0.9}
            />
          )}
          {overlayChainDef && overlayChainCube && (
            <CubeNode
              definition={overlayChainDef}
              visualState={{
                ...SHELF_VISUAL_STATE,
                inChain: true,
                powered: outputState.powered,
                outputState,
              }}
              dragScale={1.04}
            />
          )}
        </DragOverlay>
      </DndContext>
      <CubeTooltip tooltip={tooltip} />
    </>
  );
}

export function FoundryStage() {
  return (
    <CanvasLayoutProvider>
      <FoundryStageInner />
    </CanvasLayoutProvider>
  );
}
