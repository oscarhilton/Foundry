import { NoiseFieldVisual } from "./NoiseFieldVisual";

interface RandomVisualProps {
  animTime: number;
  active: boolean;
  noiseValue?: number | null;
}

export function RandomVisual({ animTime, active, noiseValue }: RandomVisualProps) {
  return (
    <NoiseFieldVisual
      animTime={animTime}
      phaseOffset={noiseValue}
      speed={2}
      accent="#9B59B6"
      contrast={0.9}
      active={active}
    />
  );
}
