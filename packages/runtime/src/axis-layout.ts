import type { TrayCompileContext } from "./intent-resolver.js";

export type AxisLayout = {
  place?: string;
  moment?: string;
  phenomenon?: string;
  response?: string;
};

export function extractAxisLayout(ctx: TrayCompileContext): AxisLayout {
  const layout: AxisLayout = {};

  for (const slot of ctx.slots) {
    if (!slot.role || !slot.modeId) continue;
    switch (slot.role) {
      case "place":
        layout.place = slot.modeId;
        break;
      case "moment":
        layout.moment = slot.modeId;
        break;
      case "phenomenon":
        layout.phenomenon = slot.modeId;
        break;
      case "response":
        layout.response = slot.modeId;
        break;
    }
  }

  return layout;
}

export function hasWeatherPackLayout(layout: AxisLayout): boolean {
  return layout.phenomenon !== undefined || layout.response !== undefined;
}
