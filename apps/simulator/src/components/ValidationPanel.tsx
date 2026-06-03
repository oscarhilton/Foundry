import { useState } from "react";
import { useSimulatorStore } from "../store";

type TaskResult = "pass" | "partial" | "fail" | "";

export function ValidationPanel() {
  const showValidationPanel = useSimulatorStore((s) => s.showValidationPanel);
  const toggleValidationPanel = useSimulatorStore((s) => s.toggleValidationPanel);
  const outputState = useSimulatorStore((s) => s.outputState);
  const onboarding = useSimulatorStore((s) => s.onboarding);

  const [sessionId, setSessionId] = useState("");
  const [participantType, setParticipantType] = useState("");
  const [timeToDial, setTimeToDial] = useState("");
  const [task1, setTask1] = useState<TaskResult>("");
  const [task2, setTask2] = useState<TaskResult>("");
  const [task3, setTask3] = useState<TaskResult>("");
  const [delight, setDelight] = useState("");
  const [quote, setQuote] = useState("");
  const [friction, setFriction] = useState("");

  if (!showValidationPanel) return null;

  const dialDiscovered = onboarding.hasUsedDial ? "Yes" : "Not yet";

  return (
    <>
      <div
        className="fixed inset-0 z-30 bg-black/20"
        onClick={toggleValidationPanel}
        aria-hidden
      />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 w-[min(520px,92vw)] max-h-[85vh] overflow-auto bg-white border border-foundry-border rounded-xl shadow-2xl pointer-events-auto">
        <div className="sticky top-0 bg-white border-b border-foundry-border px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-medium">Validation observer</h2>
            <p className="text-xs text-foundry-muted mt-0.5">
              Facilitator checklist — see docs/user-validation.md
            </p>
          </div>
          <button
            type="button"
            onClick={toggleValidationPanel}
            className="text-sm px-3 py-1 rounded-full border border-foundry-border hover:bg-gray-50"
          >
            Close
          </button>
        </div>

        <div className="p-5 space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-foundry-muted">Session #</span>
              <input
                type="text"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                className="border border-foundry-border rounded px-2 py-1 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-foundry-muted">Participant type</span>
              <input
                type="text"
                value={participantType}
                onChange={(e) => setParticipantType(e.target.value)}
                placeholder="tinkerer, gift buyer…"
                className="border border-foundry-border rounded px-2 py-1 text-sm"
              />
            </label>
          </div>

          <div className="rounded-lg border border-foundry-border p-3 bg-gray-50 text-xs space-y-1">
            <p>
              <span className="text-foundry-muted">Powered:</span>{" "}
              {outputState.powered ? "Yes" : "No"}
            </p>
            <p>
              <span className="text-foundry-muted">Active recipe:</span>{" "}
              {outputState.activeRecipeName ?? "None"}
            </p>
            <p>
              <span className="text-foundry-muted">Dial discovered:</span> {dialDiscovered}
            </p>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wider text-foundry-muted">
              Time to dial change (seconds)
            </span>
            <input
              type="text"
              value={timeToDial}
              onChange={(e) => setTimeToDial(e.target.value)}
              className="border border-foundry-border rounded px-2 py-1"
            />
          </label>

          {(
            [
              ["Task 1 — London Weather Light", task1, setTask1],
              ["Task 2 — Dial scaling", task2, setTask2],
              ["Task 3 — Motion Chime", task3, setTask3],
            ] as const
          ).map(([label, value, setter]) => (
            <fieldset key={label} className="space-y-1">
              <legend className="text-xs font-medium text-foundry-muted">{label}</legend>
              <div className="flex gap-2">
                {(["pass", "partial", "fail"] as const).map((opt) => (
                  <label key={opt} className="flex items-center gap-1 text-xs capitalize">
                    <input
                      type="radio"
                      name={label}
                      checked={value === opt}
                      onChange={() => setter(opt)}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}

          <label className="flex flex-col gap-1">
            <span className="text-xs text-foundry-muted">Delight score (1–5)</span>
            <input
              type="text"
              value={delight}
              onChange={(e) => setDelight(e.target.value)}
              className="border border-foundry-border rounded px-2 py-1 w-16"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-foundry-muted">Quote</span>
            <textarea
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              rows={2}
              className="border border-foundry-border rounded px-2 py-1 text-sm"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-foundry-muted">Top friction / suggested fix</span>
            <textarea
              value={friction}
              onChange={(e) => setFriction(e.target.value)}
              rows={2}
              className="border border-foundry-border rounded px-2 py-1 text-sm"
            />
          </label>

          <p className="text-[10px] text-foundry-muted pt-2 border-t border-gray-100">
            Go criteria: ≥80% pass Task 2 · ≥60% pass Task 1 · ≥4/5 delight average.
            Schedule 5–8 sessions before hardware investment.
          </p>
        </div>
      </div>
    </>
  );
}
