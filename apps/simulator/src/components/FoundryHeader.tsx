import type { ReactNode } from "react";
import { useSimulatorStore, PRESET_CHAINS, HERO_PRESET_IDS } from "../store";

const pillBase =
  "text-xs px-3 py-1.5 rounded-full border transition-colors shrink-0";
const pillIdle =
  "bg-white border-[#E8E8E8] hover:bg-[#FAFAFA] text-foundry-ink";

function ActionPill({
  onClick,
  children,
  className = "",
  title,
}: {
  onClick: () => void;
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`${pillBase} ${pillIdle} ${className}`}
    >
      {children}
    </button>
  );
}

export function FoundryHeader() {
  const productMode = useSimulatorStore((s) => s.productMode);
  const showAdvanced = useSimulatorStore((s) => s.showAdvanced);
  const showCoreDebug = useSimulatorStore((s) => s.showCoreDebug);
  const showAllPresets = useSimulatorStore((s) => s.showAllPresets);
  const useLiveWeather = useSimulatorStore((s) => s.useLiveWeather);
  const selectedPresetId = useSimulatorStore((s) => s.selectedPresetId);
  const activeRecipeName = useSimulatorStore((s) => s.activeRecipeName);
  const outputState = useSimulatorStore((s) => s.outputState);
  const loadPreset = useSimulatorStore((s) => s.loadPreset);
  const toggleProductMode = useSimulatorStore((s) => s.toggleProductMode);
  const toggleAdvanced = useSimulatorStore((s) => s.toggleAdvanced);
  const toggleCoreDebug = useSimulatorStore((s) => s.toggleCoreDebug);
  const toggleLiveWeather = useSimulatorStore((s) => s.toggleLiveWeather);
  const toggleAllPresets = useSimulatorStore((s) => s.toggleAllPresets);
  const toggleValidationPanel = useSimulatorStore((s) => s.toggleValidationPanel);
  const exportChain = useSimulatorStore((s) => s.exportChain);
  const importChain = useSimulatorStore((s) => s.importChain);
  const showShareToast = useSimulatorStore((s) => s.showShareToast);
  const audioUnlocked = useSimulatorStore((s) => s.audioUnlocked);
  const soundEnabled = useSimulatorStore((s) => s.soundEnabled);
  const toggleSound = useSimulatorStore((s) => s.toggleSound);

  const heroPresets = PRESET_CHAINS.filter((p) =>
    (HERO_PRESET_IDS as readonly string[]).includes(p.id),
  );
  const visiblePresets =
    productMode && !showAllPresets ? heroPresets : PRESET_CHAINS;

  const handleExport = () => {
    const json = exportChain();
    const encoded = btoa(unescape(encodeURIComponent(json)));
    const url = `${window.location.origin}${window.location.pathname}?chain=${encoded}`;
    navigator.clipboard.writeText(url).catch(() => {});
    showShareToast("Link copied — send this chain to a friend");
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

  const builderActions = (
    <>
      <ActionPill onClick={toggleProductMode}>Product mode</ActionPill>
      <ActionPill
        onClick={toggleCoreDebug}
        className={
          showCoreDebug ? "bg-[#1D3557] text-white border-[#1D3557]" : ""
        }
      >
        Core Debug
      </ActionPill>
      <ActionPill
        onClick={toggleAdvanced}
        className={
          showAdvanced ? "bg-foundry-ink text-white border-foundry-ink" : ""
        }
      >
        Workshop
      </ActionPill>
      <ActionPill onClick={toggleValidationPanel}>Validate</ActionPill>
      <ActionPill
        onClick={toggleLiveWeather}
        className={
          useLiveWeather ? "bg-[#457B9D] text-white border-[#457B9D]" : ""
        }
      >
        {useLiveWeather ? "Live" : "Mock"}
      </ActionPill>
      <ActionPill onClick={handleExport}>Share</ActionPill>
      <ActionPill onClick={handleImportUrl}>Load URL</ActionPill>
    </>
  );

  return (
    <header className="shrink-0 border-b border-[#E8E8E8] bg-[#f5f5f4]">
      <div className="flex flex-col gap-2.5 px-3 py-2.5 md:px-4 md:py-3">
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span className="text-sm font-medium tracking-tight text-foundry-ink shrink-0">
              Foundry
            </span>
            {outputState.powered ? (
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 shrink-0">
                Powered
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 shrink-0">
                Unpowered
              </span>
            )}
            {!productMode &&
              (activeRecipeName ? (
                <span className="text-xs px-2 py-0.5 rounded-full bg-foundry-ink text-white shrink-0 max-w-[10rem] truncate">
                  {activeRecipeName}
                </span>
              ) : (
                <span className="text-xs text-foundry-muted shrink-0">No recipe</span>
              ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 justify-end">
            <ActionPill
              onClick={toggleSound}
              className={
                audioUnlocked && soundEnabled
                  ? "bg-[#8338EC] text-white border-[#8338EC]"
                  : "border-[#E5E7EB]"
              }
              title={
                !audioUnlocked
                  ? "Tap to enable sound"
                  : soundEnabled
                    ? "Mute sound"
                    : "Unmute sound"
              }
            >
              {!audioUnlocked ? "Sound off" : soundEnabled ? "Sound on" : "Muted"}
            </ActionPill>

            {productMode ? (
              <ActionPill
                onClick={toggleProductMode}
                className="text-foundry-muted"
                title="Show developer tools"
              >
                Advanced
              </ActionPill>
            ) : (
              <>
                <div className="hidden md:contents">{builderActions}</div>
                <details className="relative md:hidden">
                  <summary
                    className={`${pillBase} ${pillIdle} list-none cursor-pointer`}
                  >
                    Menu
                  </summary>
                  <div className="absolute right-0 top-full mt-1 z-20 flex flex-col gap-1 p-2 bg-white border border-foundry-border rounded-lg shadow-lg min-w-[9rem]">
                    {builderActions}
                  </div>
                </details>
              </>
            )}
          </div>
        </div>

        <div className="foundry-hud-presets flex gap-2 overflow-x-auto pb-0.5 -mx-1 px-1">
          {visiblePresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => loadPreset(preset.id)}
              title={preset.description}
              className={`${pillBase} ${
                selectedPresetId === preset.id
                  ? "bg-foundry-ink text-white border-foundry-ink"
                  : pillIdle
              }`}
            >
              {preset.name}
            </button>
          ))}
          {productMode && (
            <button
              type="button"
              onClick={toggleAllPresets}
              className={`${pillBase} ${pillIdle} text-foundry-muted`}
            >
              {showAllPresets ? "Fewer" : "More"}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
