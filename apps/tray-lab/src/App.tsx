import { useTrayLabStore } from "./store";
import { TrayStage } from "./components/TrayStage";
import { ObserverPanel } from "./components/ObserverPanel";

export function App() {
  const silentMode = useTrayLabStore((s) => s.silentMode);
  const observerMode = useTrayLabStore((s) => s.observerMode);

  return (
    <div className={silentMode ? "silent" : ""} data-silent={silentMode}>
      {!silentMode && (
        <nav className="px-4 py-3 text-center border-b border-black/5 bg-tray-surface/50">
          <span className="text-sm font-medium text-tray-ink">Tray Lab</span>
          <span className="text-tray-muted text-sm mx-2">·</span>
          <span className="text-xs text-tray-muted">
            A sentence made of dice, resolved by a tray
          </span>
        </nav>
      )}
      <TrayStage />
      {observerMode && <ObserverPanel />}
    </div>
  );
}
