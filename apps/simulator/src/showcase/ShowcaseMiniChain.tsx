import type { ShowcasePresetId } from "./showcase-cards";
import { MiniCube } from "./MiniCube";
import { useShowcaseEngine } from "./useShowcaseEngine";

interface ShowcaseMiniChainProps {
  presetId: ShowcasePresetId;
  wide?: boolean;
}

export function ShowcaseMiniChain({ presetId, wide }: ShowcaseMiniChainProps) {
  const { chain, outputState } = useShowcaseEngine(presetId);

  if (!outputState || chain.length === 0) {
    return (
      <div className="h-[88px] flex items-center justify-center text-xs text-foundry-muted">
        Loading…
      </div>
    );
  }

  const signalChain = chain.filter((c) => c.definitionId !== "core/core");

  return (
    <div
      className="h-[88px] flex items-center justify-center overflow-hidden pointer-events-none select-none"
      aria-hidden
    >
      <div
        className={`flex items-center gap-1 ${wide ? "min-w-max px-2" : ""}`}
      >
        {signalChain.map((cube, i) => (
          <span key={cube.instanceId} className="flex items-center gap-1">
            {i > 0 && (
              <span className="text-foundry-muted text-[10px] px-0.5">→</span>
            )}
            <MiniCube
              definitionId={cube.definitionId}
              instanceId={cube.instanceId}
              outputState={outputState}
            />
          </span>
        ))}
      </div>
    </div>
  );
}
