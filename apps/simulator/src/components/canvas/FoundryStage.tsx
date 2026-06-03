import { useEffect, useState, useCallback } from "react";
import { Stage, Layer, Rect } from "react-konva";
import { useSimulatorStore } from "../../store";
import { useStageSize } from "./useStageSize";
import { getStageLayout, isNearChainStrip, findNearestChainSlot, CUBE_SIZE } from "./layout";
import { ChainStrip } from "./ChainStrip";
import { CubeShelf } from "./CubeShelf";

export function FoundryStage() {
  const { width, height } = useStageSize();
  const layout = getStageLayout(width, height);
  const [animTime, setAnimTime] = useState(0);

  const init = useSimulatorStore((s) => s.init);
  const tick = useSimulatorStore((s) => s.tick);
  const addCubeToChain = useSimulatorStore((s) => s.addCubeToChain);
  const chain = useSimulatorStore((s) => s.chain);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    const interval = setInterval(tick, 50);
    return () => clearInterval(interval);
  }, [tick]);

  useEffect(() => {
    let frame: number;
    const loop = (t: number) => {
      setAnimTime(t);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);

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

  return (
    <Stage width={width} height={height}>
      <Layer>
        <Rect x={0} y={0} width={width} height={height} fill="#f5f5f4" />
        <ChainStrip layout={layout} animTime={animTime} />
        <CubeShelf layout={layout} animTime={animTime} onDropToChain={onDropToChain} />
      </Layer>
    </Stage>
  );
}
