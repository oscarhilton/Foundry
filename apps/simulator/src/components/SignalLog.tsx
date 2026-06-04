import { useSimulatorStore } from "../store";

function formatValue(value: unknown): string {
  if (typeof value === "number") return value.toFixed(3).replace(/\.?0+$/, "");
  return String(value);
}

export function SignalLog() {
  const signalLog = useSimulatorStore((s) => s.signalLog);
  const warnings = useSimulatorStore((s) => s.warnings);

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-xs font-medium uppercase tracking-wider text-foundry-muted mb-2">
        Signal Log
      </h2>

      {warnings.length > 0 && (
        <div className="mb-2 space-y-1">
          {warnings.map((w) => (
            <p key={w} className="text-[10px] text-amber-700 bg-amber-50 px-2 py-1 rounded">
              {w}
            </p>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-0.5 max-h-64">
        {signalLog.length === 0 && (
          <p className="text-foundry-muted">No signals yet</p>
        )}
        {signalLog.map((msg, i) => (
          <div
            key={`${msg.ts}-${msg.topic}-${i}`}
            className="flex gap-2 py-0.5 border-b border-gray-50"
          >
            <span className="text-foundry-muted shrink-0 w-14">
              {new Date(msg.ts).toLocaleTimeString([], {
                hour12: false,
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
            <span className="text-[#457B9D] shrink-0">
              {msg.topic}
              {msg.targetId ? ` → ${msg.targetId}` : ""}
            </span>
            <span className="text-foundry-ink">{formatValue(msg.value)}</span>
            <span className="text-foundry-muted truncate">
              {msg.targetAddress ? `${msg.targetAddress} · ` : ""}
              {msg.source}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
