import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Bell,
  Circle,
  Clock,
  Cloud,
  Cpu,
  CircleDot,
  GitBranch,
  Lightbulb,
  MapPin,
  Monitor,
  Music,
  Shuffle,
  SlidersHorizontal,
  Thermometer,
  Wind,
} from "lucide-react";
import { COLORS, CUBE_ICON_SIZE, CUBE_ICON_STROKE } from "../design-tokens";

interface CubeIconProps {
  cubeId: string;
  accent: string;
  unpowered?: boolean;
  opacity?: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

const ICONS: Record<string, LucideIcon> = {
  "identity/london": MapPin,
  "identity/tokyo": MapPin,
  "identity/weather": Cloud,
  "transform/split": Shuffle,
  "source/time": Clock,
  "source/github": GitBranch,
  "modifier/calm": Wind,
  "modifier/random": Shuffle,
  "control/dial": CircleDot,
  "control/slider": SlidersHorizontal,
  "control/button": Circle,
  "sensor/motion": Activity,
  "sensor/temperature": Thermometer,
  "output/light": Lightbulb,
  "output/music": Music,
  "output/lcd": Monitor,
  "output/chime": Bell,
  "core/core": Cpu,
};

function iconColor(accent: string, unpowered: boolean) {
  return unpowered ? COLORS.muted : accent;
}

function iconOpacity(unpowered: boolean, opacity: number) {
  return unpowered ? opacity * 0.45 : opacity;
}

export function CubeIcon({
  cubeId,
  accent,
  unpowered = false,
  opacity = 1,
  size = CUBE_ICON_SIZE,
  strokeWidth = CUBE_ICON_STROKE,
  className = "",
}: CubeIconProps) {
  const Icon = ICONS[cubeId];
  if (!Icon) return null;

  return (
    <div
      className={`flex items-center justify-center pointer-events-none ${className}`}
    >
      <Icon
        size={size}
        strokeWidth={strokeWidth}
        color={iconColor(accent, unpowered)}
        style={{ opacity: iconOpacity(unpowered, opacity) }}
        aria-hidden
      />
    </div>
  );
}
