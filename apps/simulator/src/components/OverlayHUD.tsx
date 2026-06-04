import { lazy, Suspense } from "react";
import { useSimulatorStore } from "../store";

const SignalLog = lazy(() =>
  import("./SignalLog").then((m) => ({ default: m.SignalLog })),
);
const CoreDebugPanel = lazy(() =>
  import("./CoreDebugPanel").then((m) => ({ default: m.CoreDebugPanel })),
);
const ValidationPanel = lazy(() =>
  import("./ValidationPanel").then((m) => ({ default: m.ValidationPanel })),
);

/** Modals, toast, and workshop drawer — fixed only where overlay behavior is required. */
export function OverlayHUD() {
  const productMode = useSimulatorStore((s) => s.productMode);
  const showAdvanced = useSimulatorStore((s) => s.showAdvanced);
  const showCoreDebug = useSimulatorStore((s) => s.showCoreDebug);
  const shareToast = useSimulatorStore((s) => s.shareToast);

  const builderMode = !productMode;

  return (
    <>
      {shareToast && (
        <div
          className="pointer-events-none fixed bottom-8 left-1/2 z-50 -translate-x-1/2 pb-[env(safe-area-inset-bottom)]"
          role="status"
        >
          <span className="pointer-events-auto text-sm px-4 py-2 rounded-full bg-foundry-ink text-white shadow-lg">
            {shareToast}
          </span>
        </div>
      )}

      {showCoreDebug && (
        <Suspense fallback={null}>
          <CoreDebugPanel />
        </Suspense>
      )}
      <Suspense fallback={null}>
        <ValidationPanel />
      </Suspense>

      <div
        className={`pointer-events-auto fixed inset-y-0 right-0 z-20 h-full w-full max-w-[100vw] border-l border-foundry-border bg-white shadow-lg transition-transform duration-300 md:w-80 ${
          builderMode && showAdvanced ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!(builderMode && showAdvanced)}
      >
        <div className="flex h-full flex-col p-4">
          <Suspense fallback={null}>
            <SignalLog />
          </Suspense>
        </div>
      </div>
    </>
  );
}
