import type { ReactNode } from "react";
import { formatLightMoodLabel, formatPowerBattery } from "@foundry/runtime";
import { useSimulatorStore } from "../store";

function formatValue(value: unknown): string {
  if (typeof value === "number") return value.toFixed(3).replace(/\.?0+$/, "");
  return String(value);
}

function formatTopicValue(topic: string, value: unknown): string {
  if (topic === "control/button/press" && typeof value === "boolean") {
    return value ? "CLOSED" : "OPEN";
  }
  return formatValue(value);
}

function ViewportSegmentBracket({ segments }: { segments: string[] }) {
  if (segments.length === 0) {
    return (
      <p className="whitespace-pre-line text-foundry-ink">[—]</p>
    );
  }
  return (
    <div className="space-y-1">
      {segments.map((seg, i) => (
        <p key={i} className="whitespace-pre-line text-foundry-ink">
          [{seg}]
        </p>
      ))}
    </div>
  );
}

const OUTPUT_TOPICS = new Set([
  "output/lcd/text",
  "output/light/brightness",
]);

function ViewportRenderedArrow({ rendered }: { rendered: string }) {
  const lines = rendered.split("\n");
  return (
    <div className="pt-1 text-foundry-ink">
      <p className="whitespace-pre-line">
        → {lines[0]}
        {lines.slice(1).map((line, i) => (
          <span key={i} className="block pl-4">
            {line}
          </span>
        ))}
      </p>
    </div>
  );
}

function TopicStreamValue({
  topic,
  value,
}: {
  topic: string;
  value: unknown;
}): ReactNode {
  const text = formatTopicValue(topic, value);
  if (!text.includes("\n")) {
    return <span className="text-foundry-ink">{text}</span>;
  }
  const lines = text.split("\n");
  return (
    <span className="text-foundry-ink whitespace-pre-line">
      {lines[0]}
      {lines.slice(1).map((line, i) => (
        <span key={i} className="block pl-4">
          {line}
        </span>
      ))}
    </span>
  );
}

export function CoreDebugPanel() {
  const showCoreDebug = useSimulatorStore((s) => s.showCoreDebug);
  const closeCoreDebug = useSimulatorStore((s) => s.closeCoreDebug);
  const snapshot = useSimulatorStore((s) => s.coreDebugSnapshot);
  const chain = useSimulatorStore((s) => s.chain);
  const outputState = useSimulatorStore((s) => s.outputState);
  const signalLog = useSimulatorStore((s) => s.signalLog);
  const setPowerSource = useSimulatorStore((s) => s.setPowerSource);
  const setBatteryPercent = useSimulatorStore((s) => s.setBatteryPercent);

  if (!showCoreDebug) return null;

  const discovered = snapshot?.discovered ?? [];
  const powerLabel = formatPowerBattery(
    outputState.powerSource,
    outputState.batteryPercent,
  );

  const lcdEntries = Object.entries(outputState.lcdTexts);
  const recentLog = signalLog.slice(0, 20);
  const streamMessages = recentLog.filter((m) => !OUTPUT_TOPICS.has(m.topic));
  const hasRecentOutputPublish = recentLog.some((m) =>
    OUTPUT_TOPICS.has(m.topic),
  );

  return (
    <>
      <div
        className="fixed inset-0 z-30 bg-black/20"
        onClick={closeCoreDebug}
        aria-hidden
      />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 w-[min(640px,92vw)] max-h-[85vh] overflow-auto bg-white border border-foundry-border rounded-xl shadow-2xl pointer-events-auto">
        <div className="sticky top-0 bg-white border-b border-foundry-border px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-medium">Core Debug</h2>
            <p className="text-xs text-foundry-muted mt-0.5">
              I2C discovery, recipe binding, signal flow
            </p>
          </div>
          <button
            type="button"
            onClick={closeCoreDebug}
            className="text-sm px-3 py-1 rounded-full border border-foundry-border hover:bg-gray-50"
          >
            Close
          </button>
        </div>

        <div className="p-5 space-y-5">
          <section>
            <h3 className="text-xs font-medium uppercase tracking-wider text-foundry-muted mb-2">
              Power bus
            </h3>
            <div className="flex items-center gap-3 text-sm flex-wrap">
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  outputState.powered
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {outputState.powered ? "POWERED" : "UNPOWERED"}
              </span>
              <span className="font-mono text-xs px-2 py-0.5 rounded border border-foundry-border bg-gray-50">
                {powerLabel}
              </span>
              <span className="text-foundry-muted">
                Core ×{outputState.coreCount} · {chain.length} cubes · WiFi
              </span>
            </div>
            {outputState.powered && (
              <div className="mt-3 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-foundry-muted w-14">Source</span>
                  <div className="flex rounded-lg border border-foundry-border overflow-hidden text-xs">
                    <button
                      type="button"
                      onClick={() => setPowerSource("usb")}
                      className={`px-3 py-1.5 transition-colors ${
                        outputState.powerSource === "usb"
                          ? "bg-[#1D3557] text-white"
                          : "bg-white hover:bg-gray-50"
                      }`}
                    >
                      USB
                    </button>
                    <button
                      type="button"
                      onClick={() => setPowerSource("battery")}
                      className={`px-3 py-1.5 transition-colors border-l border-foundry-border ${
                        outputState.powerSource === "battery"
                          ? "bg-[#1D3557] text-white"
                          : "bg-white hover:bg-gray-50"
                      }`}
                    >
                      Battery
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="battery-percent"
                    className="text-xs text-foundry-muted w-14 shrink-0"
                  >
                    Level
                  </label>
                  <input
                    id="battery-percent"
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={outputState.batteryPercent}
                    onChange={(e) => setBatteryPercent(Number(e.target.value))}
                    className="flex-1 accent-[#1D3557]"
                  />
                  <span className="text-xs font-mono w-10 text-right tabular-nums">
                    {outputState.batteryPercent}%
                  </span>
                </div>
                <p className="text-[10px] text-foundry-muted">
                  Publishes <code className="font-mono">core/power</code> · Core
                  + LCD chains mirror this on the LCD
                </p>
              </div>
            )}
          </section>

          <section>
            <h3 className="text-xs font-medium uppercase tracking-wider text-foundry-muted mb-2">
              I2C discovery
            </h3>
            <div className="border border-foundry-border rounded-lg overflow-hidden text-xs font-mono">
              <div className="grid grid-cols-4 gap-2 px-3 py-2 bg-gray-50 text-foundry-muted border-b border-foundry-border">
                <span>Addr</span>
                <span>Label</span>
                <span>ID</span>
                <span>Role</span>
              </div>
              {discovered.length === 0 ? (
                <p className="px-3 py-3 text-foundry-muted">No cubes in chain</p>
              ) : (
                discovered.map((d) => (
                  <div
                    key={d.instanceId}
                    className="grid grid-cols-4 gap-2 px-3 py-2 border-b border-gray-50 last:border-0"
                  >
                    <span className="text-[#1D3557]">{d.address}</span>
                    <span>{d.label}</span>
                    <span className="truncate text-foundry-muted">{d.id}</span>
                    <span>{d.role}</span>
                  </div>
                ))
              )}
            </div>
          </section>

          <section>
            <h3 className="text-xs font-medium uppercase tracking-wider text-foundry-muted mb-2">
              Recipe engine
            </h3>
            <div className="text-sm space-y-1">
              {outputState.powered ? (
                <>
                  <p>
                    Active chain:{" "}
                    <span className="font-medium">
                      {snapshot?.chainMode === "recipe"
                        ? snapshot.activeRecipe ?? "recipe"
                        : "manual composition"}
                    </span>
                  </p>
                  <p>
                    Recipe:{" "}
                    {outputState.activeRecipeName ?? (
                      <span className="text-foundry-muted">none</span>
                    )}
                  </p>
                </>
              ) : (
                <p className="text-foundry-muted">Chain unpowered</p>
              )}
            </div>
          </section>

          {snapshot?.chimeGate && (
            <section>
              <h3 className="text-xs font-medium uppercase tracking-wider text-foundry-muted mb-2">
                Chime condition
              </h3>
              <div className="border border-foundry-border rounded-lg p-3 space-y-1.5 bg-gray-50/50 text-[10px] font-mono">
                <p className="text-foundry-muted">
                  {snapshot.chimeGate.recipeName} ·{" "}
                  {snapshot.chimeGate.chimeInstanceId}
                  {snapshot.chimeGate.chimeAddress
                    ? ` (${snapshot.chimeGate.chimeAddress})`
                    : ""}
                </p>
                <p className="text-foundry-ink">
                  Rain: {snapshot.chimeGate.rainPercent}%
                </p>
                <p className="text-foundry-ink">
                  Threshold: {snapshot.chimeGate.thresholdPercent}%
                  {snapshot.chimeGate.thresholdSource === "dial"
                    ? " (dial)"
                    : ""}
                </p>
                <p className="text-foundry-ink">
                  Gate: {snapshot.chimeGate.gate}
                </p>
                <p className="text-foundry-muted text-[9px] pt-1">
                  {snapshot.chimeGate.hint}
                </p>
              </div>
            </section>
          )}

          {snapshot?.weatherFace && (
            <section>
              <h3 className="text-xs font-medium uppercase tracking-wider text-foundry-muted mb-2">
                Cube faces
              </h3>
              <div className="border border-foundry-border rounded-lg p-3 space-y-1.5 bg-gray-50/50 text-[10px] font-mono">
                <p className="text-foundry-muted">
                  {snapshot.weatherFace.label} · {snapshot.weatherFace.instanceId}
                  {snapshot.weatherFace.address
                    ? ` (${snapshot.weatherFace.address})`
                    : ""}
                </p>
                {snapshot.weatherFace.face.placeLabel ? (
                  <p className="text-foundry-ink">
                    {snapshot.weatherFace.face.placeLabel}
                  </p>
                ) : null}
                <p className="text-foundry-ink font-semibold">
                  {snapshot.weatherFace.face.headline}
                </p>
                {snapshot.weatherFace.face.detail ? (
                  <p className="text-foundry-ink whitespace-pre-line">
                    {snapshot.weatherFace.face.detail}
                  </p>
                ) : null}
                <p className="text-foundry-muted text-[9px] pt-1">
                  Mode: {snapshot.weatherFace.runtime.modeLabel}
                  {" · "}
                  Latched: {snapshot.weatherFace.face.latched ? "yes" : "no"}
                </p>
                {snapshot.weatherFace.face.mode === "threshold" ? (
                  <>
                    <p className="text-foundry-ink">
                      Threshold: {snapshot.weatherFace.runtime.thresholdPercent}%
                    </p>
                    <p className="text-foundry-ink">
                      Current rain: {snapshot.weatherFace.runtime.currentRainPercent}%
                    </p>
                    <p className="text-foundry-ink">
                      Gate: {snapshot.weatherFace.runtime.gate}
                    </p>
                  </>
                ) : (
                  <>
                    {snapshot.weatherFace.runtime.moodLabel ? (
                      <p className="text-foundry-ink">
                        Mood: {snapshot.weatherFace.runtime.moodLabel}
                      </p>
                    ) : null}
                    <p className="text-foundry-ink">
                      Current rain: {snapshot.weatherFace.runtime.currentRainPercent}%
                    </p>
                  </>
                )}
              </div>
            </section>
          )}

          {snapshot?.viewportTrace && snapshot.viewportTrace.length > 0 && (
            <section>
              <h3 className="text-xs font-medium uppercase tracking-wider text-foundry-muted mb-2">
                Viewport consumption
              </h3>
              <div className="space-y-4 text-[10px] font-mono">
                {snapshot.viewportTrace.map((step) => (
                  <div
                    key={step.targetId}
                    className="border border-foundry-border rounded-lg p-3 space-y-1.5 bg-gray-50/50"
                  >
                    {step.motionGate !== undefined && (
                      <div className="pb-1 border-b border-foundry-border/60 mb-1">
                        <p className="text-foundry-muted uppercase tracking-wide text-[9px]">
                          GATE
                        </p>
                        <p className="text-foundry-ink">
                          Motion:{" "}
                          {step.motionGate === "active" ? "active" : "inactive"}
                        </p>
                        {step.motionGate === "inactive" && (
                          <p className="text-foundry-muted">→ --</p>
                        )}
                      </div>
                    )}
                    <p className="text-foundry-muted uppercase tracking-wide text-[9px]">
                      AVAILABLE TO viewport {step.targetId}
                      {step.address ? ` (${step.address})` : ""}
                    </p>
                    <ViewportSegmentBracket segments={step.payloadBefore} />
                    <p className="text-foundry-muted uppercase tracking-wide text-[9px] pt-1">
                      VIEWPORT {step.targetId} CONSUMED
                    </p>
                    <ViewportSegmentBracket segments={step.consumed} />
                    <p className="text-foundry-muted uppercase tracking-wide text-[9px] pt-1">
                      REMAINDER AFTER viewport {step.targetId}
                    </p>
                    <ViewportSegmentBracket segments={step.remainderAfter} />
                    <ViewportRenderedArrow rendered={step.rendered} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {snapshot?.lightOutput && (
            <section>
              <h3 className="text-xs font-medium uppercase tracking-wider text-foundry-muted mb-2">
                Light output
              </h3>
              <div className="border border-foundry-border rounded-lg p-3 space-y-1.5 bg-gray-50/50 text-[10px] font-mono">
                <p className="text-foundry-muted">
                  {snapshot.lightOutput.label} · {snapshot.lightOutput.instanceId}
                  {snapshot.lightOutput.address
                    ? ` (${snapshot.lightOutput.address})`
                    : ""}
                </p>
                <p className="text-foundry-ink">
                  Mode: {snapshot.lightOutput.mode}
                </p>
                <p className="text-foundry-muted text-[9px]">
                  {snapshot.lightOutput.driverSummary}
                </p>
                {snapshot.lightOutput.gate != null && (
                  <>
                    <p className="text-foundry-ink">
                      Rain gate: {snapshot.lightOutput.gate}
                    </p>
                    <p className="text-foundry-ink">
                      Threshold: {snapshot.lightOutput.thresholdPercent}% · Current
                      rain: {snapshot.lightOutput.rainPercent}%
                    </p>
                  </>
                )}
                {snapshot.lightOutput.driverTopic && (
                  <p className="text-foundry-ink">
                    Input: {formatValue(snapshot.lightOutput.driverValue)}
                  </p>
                )}
                {formatLightMoodLabel(snapshot.lightOutput.mood) && (
                  <p className="text-foundry-ink">
                    Mood: {formatLightMoodLabel(snapshot.lightOutput.mood)}
                  </p>
                )}
                <p className="text-foundry-ink">
                  Brightness:{" "}
                  {Math.round(snapshot.lightOutput.brightness * 100)}%
                </p>
              </div>
            </section>
          )}

          <section>
            <h3 className="text-xs font-medium uppercase tracking-wider text-foundry-muted mb-2">
              Signal flow
            </h3>
            <div className="flex flex-wrap items-center gap-1">
              {chain
                .filter((c) => c.definitionId !== "core/core")
                .map((c, i) => {
                  const def = discovered.find((d) => d.instanceId === c.instanceId);
                  return (
                    <span key={c.instanceId} className="flex items-center gap-1">
                      {i > 0 && (
                        <span className="text-foundry-muted text-xs">→</span>
                      )}
                      <span
                        className={`text-xs px-2 py-1 rounded border ${
                          outputState.powered
                            ? "border-foundry-border bg-white"
                            : "border-gray-200 bg-gray-50 text-foundry-muted"
                        }`}
                      >
                        {def?.label ?? c.definitionId}
                      </span>
                    </span>
                  );
                })}
              {chain.some((c) => c.definitionId === "core/core") && (
                <>
                  <span className="text-foundry-muted text-xs">→</span>
                  <span className="text-xs px-2 py-1 rounded border border-[#1D3557] bg-[#1D3557] text-white">
                    Core
                  </span>
                </>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-xs font-medium uppercase tracking-wider text-foundry-muted mb-2">
              Topic stream
            </h3>
            {(lcdEntries.length > 0 || outputState.lightBrightness > 0.02) && (
              <div className="mb-2 border border-foundry-border rounded-lg p-3 space-y-1 font-mono text-[10px] bg-gray-50/50">
                <p className="text-foundry-muted uppercase tracking-wide text-[9px]">
                  Latest outputs
                </p>
                {lcdEntries.map(([id, text]) => (
                  <p key={id} className="whitespace-pre-line text-foundry-ink">
                    LCD {id}: {text}
                  </p>
                ))}
                {chain.some((c) => c.definitionId === "output/light") && (
                  <p className="text-foundry-ink">
                    Light: {Math.round(outputState.lightBrightness * 100)}%
                    {outputState.lightMood
                      ? ` · ${formatLightMoodLabel(outputState.lightMood)}`
                      : ""}
                  </p>
                )}
                {!hasRecentOutputPublish && (
                  <p className="text-foundry-muted text-[9px] pt-1">
                    No new output events
                  </p>
                )}
              </div>
            )}
            <div className="border border-foundry-border rounded-lg max-h-40 overflow-y-auto font-mono text-[10px]">
              {streamMessages.length === 0 ? (
                <p className="px-3 py-3 text-foundry-muted">
                  {signalLog.length === 0
                    ? "Waiting for signals…"
                    : "No input signals in recent log"}
                </p>
              ) : (
                streamMessages.map((msg, i) => (
                  <div
                    key={`${msg.ts}-${msg.topic}-${msg.targetId ?? ""}-${i}`}
                    className="flex flex-wrap gap-x-2 gap-y-0.5 px-3 py-1 border-b border-gray-50"
                  >
                    <span className="text-[#457B9D] shrink-0">
                      {msg.topic}
                      {msg.targetId ? ` → ${msg.targetId}` : ""}
                      {msg.targetAddress ? ` (${msg.targetAddress})` : ""}
                    </span>
                    <TopicStreamValue topic={msg.topic} value={msg.value} />
                    <span className="text-foundry-muted truncate w-full">
                      src {msg.source}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
