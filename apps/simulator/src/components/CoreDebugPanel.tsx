import { useSimulatorStore } from "../store";

function formatValue(value: unknown): string {
  if (typeof value === "number") return value.toFixed(3).replace(/\.?0+$/, "");
  return String(value);
}

export function CoreDebugPanel() {
  const showCoreDebug = useSimulatorStore((s) => s.showCoreDebug);
  const closeCoreDebug = useSimulatorStore((s) => s.closeCoreDebug);
  const snapshot = useSimulatorStore((s) => s.coreDebugSnapshot);
  const chain = useSimulatorStore((s) => s.chain);
  const outputState = useSimulatorStore((s) => s.outputState);
  const signalLog = useSimulatorStore((s) => s.signalLog);

  if (!showCoreDebug) return null;

  const discovered = snapshot?.discovered ?? [];

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
            <div className="flex items-center gap-3 text-sm">
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  outputState.powered
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {outputState.powered ? "POWERED" : "UNPOWERED"}
              </span>
              <span className="text-foundry-muted">
                Core ×{outputState.coreCount} · {chain.length} cubes · USB · WiFi
              </span>
            </div>
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
            <p className="text-sm">
              {outputState.activeRecipeName ?? (
                <span className="text-foundry-muted">No active recipe</span>
              )}
            </p>
          </section>

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
            <div className="border border-foundry-border rounded-lg max-h-40 overflow-y-auto font-mono text-[10px]">
              {signalLog.length === 0 ? (
                <p className="px-3 py-3 text-foundry-muted">Waiting for signals…</p>
              ) : (
                signalLog.slice(0, 20).map((msg, i) => (
                  <div
                    key={`${msg.ts}-${msg.topic}-${i}`}
                    className="flex gap-2 px-3 py-1 border-b border-gray-50"
                  >
                    <span className="text-[#457B9D] shrink-0 w-32 truncate">
                      {msg.topic}
                    </span>
                    <span>{formatValue(msg.value)}</span>
                    <span className="text-foundry-muted truncate ml-auto">
                      {msg.source}
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
