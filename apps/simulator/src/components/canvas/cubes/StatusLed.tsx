import { CUBE_FACE, COLORS } from "../design-tokens";

interface StatusLedProps {
  color?: string;
  active?: boolean;
  pulse?: number;
  inChain?: boolean;
}

export function StatusLed({
  color = COLORS.ledBlue,
  active = false,
  pulse = 1,
  inChain = false,
}: StatusLedProps) {
  const opacity = active ? 0.55 + pulse * 0.45 : inChain ? 0.2 : 0.15;
  const size = inChain ? 3 : CUBE_FACE.ledRadius * 2;

  return (
    <div className="w-full h-full absolute">
      <div
        className="rounded-full shrink-0 absolute bottom-0 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: size,
          height: size,
          backgroundColor: active ? color : COLORS.connectorGrey,
          opacity,
        }}
      />
    </div>
  );
}
