import type { LucideIcon } from "lucide-react";
import { Cloud, CloudOff, CloudRain, Sun } from "lucide-react";
import type { WeatherFaceState, WeatherFaceSymbol } from "@foundry/runtime";
import { WEATHER_FACE_EINK_INK } from "@foundry/runtime";
import { COLORS, CUBE_ICON_BADGE_SIZE } from "../design-tokens";

interface WeatherVisualProps {
  face: WeatherFaceState | null;
  /** Live rain when no latched face (shelf preview). */
  rain: number | null;
}

/** Static footer — Weather is a source symbol, not a viewport. */
export function weatherFooterLabel(
  face: WeatherFaceState | null,
  fallbackLabel: string,
): string {
  if (face?.mode === "threshold") {
    return face.detail ?? fallbackLabel;
  }
  return fallbackLabel;
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
      className="pointer-events-none flex select-none flex-col items-center justify-center px-1.5 text-center font-mono leading-tight gap-1 p-2"
      style={{ color: WEATHER_FACE_EINK_INK, backgroundColor: COLORS.einkBackground }}
    >
      <ConditionIcon symbol={face.symbol} size={CUBE_ICON_BADGE_SIZE} />
      <span className="max-w-full truncate text-[6px] font-semibold tracking-wide uppercase">
        {face.headline}
      </span>
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
