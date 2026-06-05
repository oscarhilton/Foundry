import type { LucideIcon } from "lucide-react";
import { Cloud, CloudOff, CloudRain, Sun } from "lucide-react";
import type { WeatherFaceState, WeatherFaceSymbol } from "@foundry/runtime";
import { WEATHER_FACE_EINK_INK } from "@foundry/runtime";
import { COLORS, CUBE_ICON_BADGE_SIZE } from "../design-tokens";

const WEATHER_FOOTER_CYCLE_MS = 2500;

interface WeatherVisualProps {
  face: WeatherFaceState | null;
  /** Live rain when no latched face (shelf preview). */
  rain: number | null;
  animTime: number;
}

/** Footer alternates temp and rain so neither crowds one line. */
export function weatherFooterLabel(
  animTime: number,
  temp: number | null,
  rain: number | null,
  face: WeatherFaceState | null,
  fallbackLabel: string,
): string {
  if (face?.mode === "threshold") {
    return face.detail ?? fallbackLabel;
  }
  if (temp == null && rain == null && face == null) {
    return fallbackLabel;
  }
  const showRain = Math.floor(animTime / WEATHER_FOOTER_CYCLE_MS) % 2 === 1;
  if (showRain) {
    return `${Math.round((rain ?? 0.3) * 100)}% rain`;
  }
  return `${Math.round(temp ?? 14)}°C`;
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
  return (
    <div
      className="pointer-events-none flex select-none flex-col items-center justify-center px-1.5 text-center font-mono leading-tight gap-2 p-2"
      style={{ color: WEATHER_FACE_EINK_INK, backgroundColor: COLORS.einkBackground }}
    >
      {/* {!isThreshold && face.placeLabel ? (
        <span className="mb-0.5 max-w-full truncate text-[7px] opacity-70">
          {truncatePlaceLabel(face.placeLabel)}
        </span>
      ) : null} */}
      <ConditionIcon symbol={face.symbol} size={CUBE_ICON_BADGE_SIZE} />
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
        size={CUBE_ICON_BADGE_SIZE}
        color={COLORS.ledBlue}
        style={{ opacity: 0.25 + r * 0.45 }}
        aria-hidden
      />
    </div>
  );
}
