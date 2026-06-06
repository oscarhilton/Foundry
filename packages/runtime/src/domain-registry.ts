import type { WeatherFact } from "./weather-lens.js";
import type { AxisLayout } from "./axis-layout.js";

export type RenderResult = {
  localTranslations: Partial<Record<keyof AxisLayout, string>>;
  finalOutput: string;
  finalOutputTone: "answer" | "hint" | "warning" | "timer" | "invalid";
  confidence?: number;
  warnings?: string[];
};

export interface DomainRenderer {
  id: string;
  canRender(layout: AxisLayout): boolean;
  render(layout: AxisLayout, fact: WeatherFact): RenderResult;
}

const renderers: DomainRenderer[] = [];

export function registerDomainRenderer(renderer: DomainRenderer): void {
  renderers.push(renderer);
}

export function renderDomainLayout(
  layout: AxisLayout,
  fact: WeatherFact,
): RenderResult | null {
  for (const renderer of renderers) {
    if (renderer.canRender(layout)) {
      return renderer.render(layout, fact);
    }
  }
  return null;
}
