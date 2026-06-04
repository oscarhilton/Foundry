import { NoiseFieldVisual } from "./NoiseFieldVisual";

interface RandomVisualProps {
  animTime: number;
  active: boolean;
  noiseValue?: number | null;
}

export function RandomVisual({ animTime, active, noiseValue }: RandomVisualProps) {
  const label =
    active && noiseValue != null ? `${Math.round(noiseValue * 100)}%` : undefined;

  return (
    <NoiseFieldVisual
      animTime={animTime}
      phaseOffset={noiseValue}
      speed={2}
      accent="#9B59B6"
      contrast={0.9}
      active={active}
      centerLabel={label}
    />
  );
}
