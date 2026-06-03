import { Rect } from "react-konva";
import { COLORS, CUBE_FACE } from "../design-tokens";

interface GitHubVisualProps {
  activity: number | null;
  animTime: number;
}

export function GitHubVisual({ activity, animTime }: GitHubVisualProps) {
  const a = activity ?? 0.3;
  const flicker = 0.5 + Math.sin(animTime * 0.008 + a * 10) * 0.2;
  const baseY = CUBE_FACE.stateBottom - 4;

  return (
    <>
      {[0, 1, 2].map((i) => (
        <Rect
          key={i}
          x={28 + i * 12}
          y={baseY - (6 + a * 10 * flicker) * (0.8 + i * 0.15)}
          width={6}
          height={6 + a * 10 * flicker}
          fill={COLORS.ink}
          opacity={0.2 + a * 0.35}
          cornerRadius={1}
        />
      ))}
    </>
  );
}
