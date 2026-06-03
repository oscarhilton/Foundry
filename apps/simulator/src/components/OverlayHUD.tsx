import { useSimulatorStore, PRESET_CHAINS } from "../store";
import { SignalLog } from "./SignalLog";
import { CoreDebugPanel } from "./CoreDebugPanel";

export function OverlayHUD() {
  const showAdvanced = useSimulatorStore((s) => s.showAdvanced);
  const showCoreDebug = useSimulatorStore((s) => s.showCoreDebug);
  const useLiveWeather = useSimulatorStore((s) => s.useLiveWeather);
  const selectedPresetId = useSimulatorStore((s) => s.selectedPresetId);
  const activeRecipeName = useSimulatorStore((s) => s.activeRecipeName);
  const outputState = useSimulatorStore((s) => s.outputState);
  const loadPreset = useSimulatorStore((s) => s.loadPreset);
  const toggleAdvanced = useSimulatorStore((s) => s.toggleAdvanced);
  const toggleCoreDebug = useSimulatorStore((s) => s.toggleCoreDebug);
  const toggleLiveWeather = useSimulatorStore((s) => s.toggleLiveWeather);
  const exportChain = useSimulatorStore((s) => s.exportChain);
  const importChain = useSimulatorStore((s) => s.importChain);
  const audioUnlocked = useSimulatorStore((s) => s.audioUnlocked);
  const soundEnabled = useSimulatorStore((s) => s.soundEnabled);
  const toggleSound = useSimulatorStore((s) => s.toggleSound);

  const handleExport = () => {
    const json = exportChain();
    const encoded = btoa(unescape(encodeURIComponent(json)));
    const url = `${window.location.origin}${window.location.pathname}?chain=${encoded}`;
    navigator.clipboard.writeText(url).catch(() => {});
  };

  const handleImportUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const chainParam = params.get("chain");
    if (chainParam) {
      try {
        const json = decodeURIComponent(escape(atob(chainParam)));
        importChain(json);
      } catch {
        // ignore
      }
    }
  };

  return (
    <>
      {!outputState.powered && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <span className="pointer-events-auto text-xs px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800">
            Chain unpowered — add exactly one Core cube
          </span>
        </div>
      )}

      <div className="fixed top-0 left-0 right-0 z-10 pointer-events-none p-4 flex flex-col items-center gap-3">
        <div className="pointer-events-auto flex items-center gap-3 bg-white/90 backdrop-blur-sm border border-foundry-border rounded-full px-4 py-2 shadow-sm">
          <span className="text-sm font-medium tracking-tight pr-2 border-r border-foundry-border">
            Foundry
          </span>
          {outputState.powered ? (
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">
              Powered
            </span>
          ) : (
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
              Unpowered
            </span>
          )}
          {activeRecipeName ? (
            <span className="text-xs px-2 py-0.5 rounded-full bg-foundry-ink text-white">
              {activeRecipeName}
            </span>
          ) : (
            <span className="text-xs text-foundry-muted">No recipe</span>
          )}
        </div>

        <div className="pointer-events-auto flex flex-wrap justify-center gap-2 max-w-5xl max-h-24 overflow-y-auto">
          {PRESET_CHAINS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => loadPreset(preset.id)}
              title={preset.description}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                selectedPresetId === preset.id
                  ? "bg-foundry-ink text-white border-foundry-ink"
                  : "bg-white/90 backdrop-blur-sm border-foundry-border hover:bg-white"
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>

        <div className="pointer-events-auto fixed top-4 right-4 flex items-center gap-2 flex-wrap justify-end max-w-md">
          <button
            type="button"
            onClick={toggleSound}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              audioUnlocked && soundEnabled
                ? "bg-[#8338EC] text-white border-[#8338EC]"
                : "bg-white/90 backdrop-blur-sm border-foundry-border hover:bg-white"
            }`}
            title={
              !audioUnlocked
                ? "Click anywhere to enable sound"
                : soundEnabled
                  ? "Mute sound"
                  : "Unmute sound"
            }
          >
            {!audioUnlocked ? "Sound off" : soundEnabled ? "Sound on" : "Muted"}
          </button>
          <button
            type="button"
            onClick={toggleCoreDebug}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              showCoreDebug
                ? "bg-[#1D3557] text-white border-[#1D3557]"
                : "bg-white/90 backdrop-blur-sm border-foundry-border hover:bg-white"
            }`}
          >
            Core Debug
          </button>
          <button
            type="button"
            onClick={toggleAdvanced}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              showAdvanced
                ? "bg-foundry-ink text-white border-foundry-ink"
                : "bg-white/90 backdrop-blur-sm border-foundry-border hover:bg-white"
            }`}
          >
            Workshop
          </button>
          <button
            type="button"
            onClick={toggleLiveWeather}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              useLiveWeather
                ? "bg-[#457B9D] text-white border-[#457B9D]"
                : "bg-white/90 backdrop-blur-sm border-foundry-border hover:bg-white"
            }`}
          >
            {useLiveWeather ? "Live" : "Mock"}
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="text-xs px-3 py-1.5 rounded-full border border-foundry-border bg-white/90 backdrop-blur-sm hover:bg-white"
          >
            Share
          </button>
          <button
            type="button"
            onClick={handleImportUrl}
            className="text-xs px-3 py-1.5 rounded-full border border-foundry-border bg-white/90 backdrop-blur-sm hover:bg-white"
          >
            Load URL
          </button>
        </div>
      </div>

      <CoreDebugPanel />

      <div
        className={`fixed top-0 right-0 h-full w-80 z-20 bg-white border-l border-foundry-border shadow-lg transition-transform duration-300 pointer-events-auto ${
          showAdvanced ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-4 h-full flex flex-col">
          <SignalLog />
        </div>
      </div>
    </>
  );
}
