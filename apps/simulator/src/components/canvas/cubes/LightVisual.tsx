import { SvgRect } from "../svg/primitives";
import { useRef } from "react";
import { COLORS } from "../design-tokens";
import { CUBE_SIZE } from "../layout";
import { lerp } from "../animations";

export type LightMoodProp = "rain" | "sun" | "overcast" | null;

const MOOD_COLORS: Record<Exclude<LightMoodProp, null>, string> = {
  rain: "#457B9D",
  sun: "#FFD166",
  overcast: "#9CA3AF",
};

const IDLE_GREY = "#e2e2e2";
const WARM_WHITE = "#FFF4E0";

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function lerpColor(from: string, to: string, t: number): string {
  const a = parseHex(from);
  const b = parseHex(to);
  const mix = (i: number) => Math.round(a[i] + (b[i] - a[i]) * t);
  const r = mix(0);
  const g = mix(1);
  const bl = mix(2);
  return `rgb(${r},${g},${bl})`;
}

function peakColor(mood: LightMoodProp): string {
  return mood != null ? MOOD_COLORS[mood] : WARM_WHITE;
}

export function panelFill(brightness: number, mood: LightMoodProp = null): string {
  return lerpColor(IDLE_GREY, peakColor(mood), clamp01(brightness));
}

interface LightVisualProps {
  brightness: number;
  animTime: number;
  mood?: LightMoodProp;
}

export function LightVisual({ brightness, animTime, mood = null }: LightVisualProps) {
  const displayBrightness = useRef(brightness);
  const lastFrame = useRef(animTime);

  const dt = Math.min(50, animTime - lastFrame.current);
  lastFrame.current = animTime;
  displayBrightness.current = lerp(
    displayBrightness.current,
    brightness,
    Math.min(1, dt / 250),
  );

  const fill = panelFill(displayBrightness.current, mood);

  return (
    <SvgRect
      x={0}
      y={0}
      width={CUBE_SIZE}
      height={CUBE_SIZE}
      fill={fill}
      stroke={COLORS.stroke}
      strokeWidth={1}
    />
  );
}
