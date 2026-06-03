import { useEffect, useCallback, useState } from "react";
import { Stage, Layer, Rect } from "react-konva";
import { useSimulatorStore } from "../../store";
import { useStageSize } from "./useStageSize";
import { getStageLayout, isNearChainStrip, findNearestChainSlot, CUBE_SIZE } from "./layout";
import { ChainStrip } from "./ChainStrip";
import { CubeShelf } from "./CubeShelf";
import { CubeTooltip, type CubeTooltipData } from "./CubeTooltip";
import { COLORS } from "./design-tokens";

const DEMO_MOTION_INTERVAL_MS = 60_000;

export function FoundryStage() {
  const { width, height } = useStageSize();
  const layout = getStageLayout(width, height);
  const [tooltip, setTooltip] = useState<CubeTooltipData | null>(null);

  const handleCubeHover = useCallback(
    (label: string, description: string, clientX: number, clientY: number) => {
      setTooltip({ label, description, x: clientX, y: clientY });
    },
    [],
  );

  const handleCubeHoverEnd = useCallback(() => {
    setTooltip(null);
  }, []);

  const init = useSimulatorStore((s) => s.init);
  const addCubeToChain = useSimulatorStore((s) => s.addCubeToChain);
  const chain = useSimulatorStore((s) => s.chain);
  const productMode = useSimulatorStore((s) => s.productMode);
  const outputState = useSimulatorStore((s) => s.outputState);
  const triggerMotion = useSimulatorStore((s) => s.triggerMotion);

  const hasMotion = chain.some((c) => c.definitionId === "sensor/motion");
  const ambientTint =
    outputState.powered && outputState.lightBrightness > 0.05
      ? Math.min(0.05, outputState.lightBrightness * 0.04)
      : 0;

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (!productMode || !hasMotion || !outputState.powered) return;

    const pulse = () => {
      triggerMotion();
      setTimeout(() => triggerMotion(), 1500);
    };

    const id = setInterval(pulse, DEMO_MOTION_INTERVAL_MS);
    return () => clearInterval(id);
  }, [productMode, hasMotion, outputState.powered, triggerMotion]);

  const onDropToChain = useCallback(
    (definitionId: string, x: number, y: number) => {
      if (!isNearChainStrip(x + CUBE_SIZE / 2, y + CUBE_SIZE / 2, layout)) {
        return false;
      }
      const index = findNearestChainSlot(
        x + CUBE_SIZE / 2,
        layout,
        chain.length,
        true,
      );
      addCubeToChain(definitionId, index);
      return true;
    },
    [layout, chain.length, addCubeToChain],
  );

  const bgFill =
    ambientTint > 0
      ? `rgb(${245 + ambientTint * 60}, ${245 + ambientTint * 30}, ${243})`
      : COLORS.bg;

  return (
    <>
      <Stage width={width} height={height}>
        <Layer listening={false}>
          <Rect x={0} y={0} width={width} height={height} fill={bgFill} />
        </Layer>
        <Layer>
          <CubeShelf
            layout={layout}
            onDropToChain={onDropToChain}
            onCubeHover={handleCubeHover}
            onCubeHoverEnd={handleCubeHoverEnd}
          />
        </Layer>
        <Layer>
          <ChainStrip
            layout={layout}
            onCubeHover={handleCubeHover}
            onCubeHoverEnd={handleCubeHoverEnd}
          />
        </Layer>
      </Stage>
      <CubeTooltip tooltip={tooltip} />
    </>
  );
}
