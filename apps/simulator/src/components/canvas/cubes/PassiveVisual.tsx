import { CUBE_FACE } from "../design-tokens";
import { CUBE_SIZE } from "../layout";
import { CubeIcon } from "./CubeIcon";

interface PassiveVisualProps {
  active: boolean;
  accent?: string;
  cubeId?: string;
  size?: number;
  strokeWidth?: number;
}

export function PassiveVisual({ active, accent = "#457B9D", cubeId = "core/core", size = CUBE_SIZE, strokeWidth = 1.75 }: PassiveVisualProps) {
  return (
    <CubeIcon 
      cubeId={cubeId}
      accent={accent}
      unpowered={!active}
      size={size}
      strokeWidth={strokeWidth}
    />
  );
}
