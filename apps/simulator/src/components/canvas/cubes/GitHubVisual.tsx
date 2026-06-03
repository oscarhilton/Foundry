import { Rect } from "react-konva";

interface GitHubVisualProps {
  activity: number | null;
  animTime: number;
}

export function GitHubVisual({ activity, animTime }: GitHubVisualProps) {
  const a = activity ?? 0.3;
  const flicker = 0.5 + Math.sin(animTime * 0.008 + a * 10) * 0.3;

  return (
    <>
      {[0, 1, 2, 3].map((i) => (
        <Rect
          key={i}
          x={18 + i * 16}
          y={52 - (a * 12 + (i % 2) * 4) * flicker}
          width={10}
          height={8 + a * 12 * flicker}
          fill="#6E5494"
          opacity={0.35 + a * 0.5}
          cornerRadius={1}
        />
      ))}
    </>
  );
}
