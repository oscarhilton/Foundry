import type { LucideIcon } from "lucide-react";
import { Cloud, CloudOff, CloudRain, Sun } from "lucide-react";
import type { WeatherFaceState, WeatherFaceSymbol } from "@foundry/runtime";
import {
  truncatePlaceLabel,
  WEATHER_FACE_EINK_INK,
} from "@foundry/runtime";
import { COLORS } from "../design-tokens";

interface WeatherVisualProps {
  face: WeatherFaceState | null;
  /** Live rain when no latched face (shelf preview). */
  rain: number | null;
  animTime: number;
}

const SYMBOL_ICONS: Record<WeatherFaceSymbol, LucideIcon> = {
  sun: Sun,
  cloud: Cloud,
  rain: CloudRain,
  unavailable: CloudOff,
};

function ConditionIcon({
  symbol,
  size = 18,
}: {
  symbol: WeatherFaceSymbol;
  size?: number;
}) {
  const Icon = SYMBOL_ICONS[symbol];
  return (
    <Icon
      size={size}
      strokeWidth={1.75}
      color={WEATHER_FACE_EINK_INK}
      aria-hidden
    />
  );
}

function LatchedFace({ face }: { face: WeatherFaceState }) {
  const isThreshold = face.mode === "threshold";

  return (
    <div
      className="pointer-events-none flex h-full w-full select-none flex-col items-center justify-center px-1.5 text-center font-mono leading-tight gap-2"
      style={{ color: WEATHER_FACE_EINK_INK, backgroundColor: COLORS.einkBackground }}
    >
      {/* {!isThreshold && face.placeLabel ? (
        <span className="mb-0.5 max-w-full truncate text-[7px] opacity-70">
          {truncatePlaceLabel(face.placeLabel)}
        </span>
      ) : null} */}
      <ConditionIcon symbol={face.symbol} size={50} />
      {/* {face.detail ? (
        <span className="mt-0.5 text-[5px] opacity-85">{face.detail}</span>
      ) : null} */}
    </div>
  );
}

export function WeatherVisual({ face, rain }: WeatherVisualProps) {
  if (face) {
    return <LatchedFace face={face} />;
  }

  const r = rain ?? 0.3;
  return (
    <div className="pointer-events-none flex h-full w-full items-center justify-center">
      <CloudRain
        size={22}
        strokeWidth={1.75}
        color={COLORS.ledBlue}
        style={{ opacity: 0.25 + r * 0.45 }}
        aria-hidden
      />
    </div>
  );
}
