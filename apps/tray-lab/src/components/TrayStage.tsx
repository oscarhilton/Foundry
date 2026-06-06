import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { getWordDie, TRAY_SLOT_COUNT } from "@foundry/cube-defs";
import { useState } from "react";
import { useTrayLabStore } from "../store";
import { morningLeavingScenario } from "../scenarios/morning-leaving";
import { DiePool } from "./DiePool";
import { ScenarioPrompt } from "./ScenarioPrompt";
import { TrayDisplay } from "./TrayDisplay";
import { TraySlot } from "./TraySlot";
import { WordDieView } from "./WordDie";

export function TrayStage() {
  const tray = useTrayLabStore((s) => s.tray);
  const trayTranslation = useTrayLabStore((s) => s.trayTranslation);
  const silentMode = useTrayLabStore((s) => s.silentMode);
  const poolDice = useTrayLabStore((s) => s.poolDice);
  const placeDie = useTrayLabStore((s) => s.placeDie);
  const removeDie = useTrayLabStore((s) => s.removeDie);
  const rotateDie = useTrayLabStore((s) => s.rotateDie);
  const resetScenario = useTrayLabStore((s) => s.resetScenario);

  const [activeDieId, setActiveDieId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const dieId = event.active.data.current?.dieId as string | undefined;
    if (dieId) setActiveDieId(dieId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDieId(null);
    const dieId = event.active.data.current?.dieId as string | undefined;
    if (!dieId) return;

    const overId = event.over?.id;
    if (typeof overId !== "string" || !overId.startsWith("slot:")) return;

    const slotIndex = Number.parseInt(overId.slice("slot:".length), 10);
    if (slotIndex < 0 || slotIndex >= TRAY_SLOT_COUNT) return;

    const existing = tray.slots[slotIndex];
    if (existing) removeDie(slotIndex);

    placeDie(slotIndex, dieId);
  };

  const activeDie = activeDieId ? getWordDie(activeDieId) : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col items-center gap-10 py-8 px-4">
        <ScenarioPrompt
          prompt={morningLeavingScenario.prompt}
          silent={silentMode}
        />

        <div
          className={[
            "w-full max-w-[780px] rounded-2xl bg-tray-surface shadow-tray p-6 md:p-8",
            "border border-black/5",
          ].join(" ")}
        >
          <div className="flex justify-center gap-3 mb-6">
            {Array.from({ length: TRAY_SLOT_COUNT }, (_, i) => (
              <TraySlot
                key={i}
                index={i}
                placed={tray.slots[i] ?? null}
                silent={silentMode}
                onRotate={() => rotateDie(i)}
                onRemove={() => removeDie(i)}
              />
            ))}
          </div>

          <TrayDisplay translation={trayTranslation} />
        </div>

        <DiePool dice={poolDice} silent={silentMode} />

        {!silentMode && (
          <button
            type="button"
            onClick={resetScenario}
            className="text-xs text-tray-muted hover:text-tray-ink underline-offset-2 hover:underline"
          >
            Reset tray
          </button>
        )}
      </div>

      <DragOverlay>
        {activeDie ? (
          <WordDieView
            die={activeDie}
            activeModeId={activeDie.modes[0]!.id}
            isDragging
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
