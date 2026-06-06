import { useState } from "react";
import {
  exportSessionJson,
  getElapsedMs,
  getSessionEvents,
  getSessionMilestones,
  useTrayLabStore,
  type TrayMilestoneId,
} from "../store";

const MILESTONE_LABELS: Record<TrayMilestoneId, string> = {
  placement_started: "Placement started",
  sentence_complete: "Sentence complete (HOME·MORNING·WEATHER·lens)",
  umbrella_decision_visible: "Umbrella decision visible",
  hero_moment: "Hero moment (lens changed, weather stable)",
  lens_rotated_before_complete: "Lens rotated before sentence complete",
};

export function ObserverPanel() {
  const [sessionId, setSessionId] = useState("");
  const [firstQuestion, setFirstQuestion] = useState("");
  const [participantType, setParticipantType] = useState("");
  const [copied, setCopied] = useState(false);

  const trayTranslation = useTrayLabStore((s) => s.trayTranslation);
  const milestones = getSessionMilestones();
  const eventCount = getSessionEvents().length;
  const elapsed = Math.round(getElapsedMs() / 1000);

  const handleCopy = async () => {
    const json = exportSessionJson({
      sessionId,
      participantType,
      firstQuestion,
      finalOutput: trayTranslation.finalOutput,
      localTranslations: trayTranslation.localTranslations,
      slotTexts: trayTranslation.slots,
    });
    await navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    if (new URLSearchParams(window.location.search).has("debug")) {
      console.info("[tray-lab session]", JSON.parse(json));
    }
  };

  return (
    <aside className="fixed bottom-4 right-4 z-50 w-[min(320px,90vw)] max-h-[70vh] overflow-auto rounded-xl border border-black/10 bg-white/95 shadow-xl backdrop-blur text-sm">
      <div className="sticky top-0 border-b border-black/5 bg-white/95 px-4 py-3">
        <h2 className="font-medium text-tray-ink">Observer</h2>
        <p className="text-xs text-tray-muted mt-0.5">
          Facilitator only — not visible to participant
        </p>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex gap-4 text-xs text-tray-muted">
          <span>{elapsed}s elapsed</span>
          <span>{eventCount} events</span>
        </div>

        <section>
          <h3 className="text-xs uppercase tracking-wide text-tray-muted mb-2">
            Milestones
          </h3>
          <ul className="space-y-1">
            {(Object.keys(MILESTONE_LABELS) as TrayMilestoneId[]).map((id) => (
              <li key={id} className="flex items-center gap-2 text-xs">
                <span
                  className={[
                    "w-3 h-3 rounded-full border",
                    milestones.includes(id)
                      ? "bg-tray-ink border-tray-ink"
                      : "border-tray-hint",
                  ].join(" ")}
                />
                {MILESTONE_LABELS[id]}
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-2">
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-tray-muted">Session #</span>
            <input
              type="text"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              className="border border-black/10 rounded px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-tray-muted">Participant type</span>
            <input
              type="text"
              value={participantType}
              onChange={(e) => setParticipantType(e.target.value)}
              className="border border-black/10 rounded px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-tray-muted">First question (verbatim)</span>
            <textarea
              value={firstQuestion}
              onChange={(e) => setFirstQuestion(e.target.value)}
              rows={2}
              className="border border-black/10 rounded px-2 py-1 resize-none"
            />
          </label>
        </section>

        <button
          type="button"
          onClick={handleCopy}
          className="w-full rounded-lg bg-tray-ink text-white py-2 text-xs font-medium hover:bg-tray-ink/90"
        >
          {copied ? "Copied" : "Copy session JSON"}
        </button>
      </div>
    </aside>
  );
}
