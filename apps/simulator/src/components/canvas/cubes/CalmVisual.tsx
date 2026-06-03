import { NoiseFieldVisual } from "./NoiseFieldVisual";

interface CalmVisualProps {
  animTime: number;
  active: boolean;
  noiseValue?: number | null;
}

export function CalmVisual({ animTime, active, noiseValue }: CalmVisualProps) {
  return (
    <NoiseFieldVisual
      animTime={animTime}
      phaseOffset={noiseValue}
      speed={0.4}
      accent="#2A9D8F"
      contrast={0.55}
      active={active}
    />
  );
}
