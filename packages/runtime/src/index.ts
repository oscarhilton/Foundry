import type { ChainCubeInput, ParsedChain } from "./chain-parser.js";
import {
  parseChain,
  isChainPowered,
  hasDisplayOutput,
  hasLcdOutput,
  hasMotionSensor,
  hasTemperatureSensor,
  hasWeatherSource,
  hasTimeSource,
} from "./chain-parser.js";
import type { RecipeContext } from "./recipes.js";
import { buildRecipeContext, matchRecipe, RECIPES } from "./recipes.js";
import { MockAdapters, LiveWeatherAdapter, fetchLiveWeather } from "./adapters/mock.js";
import {
  combineLine,
  formatControlPercent,
  formatGithub,
  formatTemp,
  formatTime,
  formatWeather,
  formatWeatherCompact,
} from "./output-formatters.js";
import {
  SignalRouter,
  smoothValue,
  weatherToBrightness,
  type SignalMessage,
} from "./signal-router.js";

export interface FoundryEngineOptions {
  onSignal?: (message: SignalMessage) => void;
  dialDefault?: number;
  sliderDefault?: number;
}

export interface FoundryOutputState {
  powered: boolean;
  coreCount: number;
  lightBrightness: number;
  chimeTriggered: boolean;
  chimeCount: number;
  activeRecipeId: string | null;
  activeRecipeName: string | null;
  warnings: string[];
  placeLabel: string | null;
  weatherTemp: number | null;
  weatherRain: number | null;
  dialPosition: number;
  sliderPosition: number;
  motionDetected: boolean;
  buttonPressed: boolean;
  githubActivity: number | null;
  musicNote: number | null;
  musicVelocity: number | null;
  displayText: string | null;
  lcdText: string | null;
  sensorTemp: number | null;
  timeHour: number | null;
}

export interface CoreDebugSnapshot {
  powered: boolean;
  coreCount: number;
  chainLength: number;
  discovered: Array<{
    instanceId: string;
    label: string;
    id: string;
    role: string;
    index: number;
    address: string;
  }>;
  activeRecipe: string | null;
  bindings: Array<{ topic: string; value: string | number | boolean; source: string }>;
}

const I2C_BASE = 0x50;

export class FoundryEngine {
  readonly router: SignalRouter;
  readonly mockAdapters: MockAdapters;

  private chain: ChainCubeInput[] = [];
  private parsed: ParsedChain | null = null;
  private context: RecipeContext | null = null;
  private unsubscribers: Array<() => void> = [];
  private liveWeather: LiveWeatherAdapter | null = null;
  private useLiveWeather = false;
  private dialPosition: number;
  private sliderPosition: number;
  private smoothedRain = 0.3;
  private lastMotion = false;
  private chimeCount = 0;
  private outputState: FoundryOutputState;
  private timeTimer?: ReturnType<typeof setInterval>;
  private tempTimer?: ReturnType<typeof setInterval>;

  constructor(options: FoundryEngineOptions = {}) {
    this.dialPosition = options.dialDefault ?? 0.65;
    this.sliderPosition = options.sliderDefault ?? 0.5;
    this.router = new SignalRouter({ onPublish: options.onSignal });
    this.mockAdapters = new MockAdapters(this.router);
    this.outputState = this.defaultOutputState();
  }

  private defaultOutputState(): FoundryOutputState {
    return {
      powered: false,
      coreCount: 0,
      lightBrightness: 0.02,
      chimeTriggered: false,
      chimeCount: 0,
      activeRecipeId: null,
      activeRecipeName: null,
      warnings: [],
      placeLabel: null,
      weatherTemp: null,
      weatherRain: null,
      dialPosition: this.dialPosition,
      sliderPosition: this.sliderPosition,
      motionDetected: false,
      buttonPressed: false,
      githubActivity: null,
      musicNote: null,
      musicVelocity: null,
      displayText: null,
      lcdText: null,
      sensorTemp: null,
      timeHour: null,
    };
  }

  setChain(cubes: ChainCubeInput[]): void {
    this.chain = cubes;
    this.rebind();
  }

  getChain(): ChainCubeInput[] {
    return [...this.chain];
  }

  getOutputState(): FoundryOutputState {
    return { ...this.outputState };
  }

  getCoreDebugSnapshot(): CoreDebugSnapshot {
    const parsed = this.parsed ?? parseChain(this.chain);
    const log = this.router.getLog(20);

    return {
      powered: this.outputState.powered,
      coreCount: parsed.coreCount,
      chainLength: parsed.cubes.length,
      discovered: parsed.cubes.map((c, index) => ({
        instanceId: c.instanceId,
        label: c.definition.label,
        id: c.definition.id,
        role: c.definition.role,
        index,
        address: `0x${(I2C_BASE + index).toString(16).toUpperCase()}`,
      })),
      activeRecipe: this.outputState.activeRecipeName,
      bindings: log.map((m) => ({
        topic: m.topic,
        value: m.value,
        source: m.source,
      })),
    };
  }

  setDialPosition(value: number): void {
    this.dialPosition = Math.max(0, Math.min(1, value));
    this.router.publish("control/dial", this.dialPosition, "ui/dial");
    this.recalculateOutputs();
  }

  setSliderPosition(value: number): void {
    this.sliderPosition = Math.max(0, Math.min(1, value));
    this.router.publish("control/slider", this.sliderPosition, "ui/slider");
    this.recalculateOutputs();
  }

  getDialPosition(): number {
    return this.dialPosition;
  }

  setLiveWeather(enabled: boolean, lat = 51.5074, lon = -0.1278): void {
    this.useLiveWeather = enabled;
    this.liveWeather?.stop();
    this.liveWeather = null;

    if (enabled) {
      this.liveWeather = new LiveWeatherAdapter(this.router, { lat, lon });
      this.liveWeather.start();
    }
  }

  start(): void {
    if (!this.useLiveWeather) {
      this.mockAdapters.start();
    }
    this.router.publish("control/dial", this.dialPosition, "ui/dial");
    this.router.publish("control/slider", this.sliderPosition, "ui/slider");
    this.startAuxAdapters();
    this.recalculateOutputs();
  }

  stop(): void {
    this.mockAdapters.stop();
    this.liveWeather?.stop();
    if (this.timeTimer) clearInterval(this.timeTimer);
    if (this.tempTimer) clearInterval(this.tempTimer);
  }

  destroy(): void {
    this.stop();
    this.clearBindings();
  }

  triggerMotion(): void {
    if (!this.outputState.powered) return;
    this.mockAdapters.toggleMotion();
  }

  triggerButton(): void {
    if (!this.outputState.powered) return;
    this.router.publish("control/button/press", true, "ui/button");
    this.outputState.buttonPressed = true;
    if (this.context?.recipe.id === "button-chime") {
      this.fireChime();
    }
    setTimeout(() => {
      this.outputState.buttonPressed = false;
      this.router.publish("control/button/press", false, "ui/button");
    }, 200);
  }

  private startAuxAdapters(): void {
    if (this.timeTimer) clearInterval(this.timeTimer);
    if (this.tempTimer) clearInterval(this.tempTimer);
    this.mockAdapters.publishTime();
    this.mockAdapters.publishTemperature();
    this.timeTimer = setInterval(() => this.mockAdapters.publishTime(), 5000);
    this.tempTimer = setInterval(
      () => this.mockAdapters.publishTemperature(),
      4000,
    );
  }

  private rebind(): void {
    this.clearBindings();
    this.parsed = parseChain(this.chain);
    this.context = buildRecipeContext(this.parsed);

    this.outputState.powered = this.parsed.powered;
    this.outputState.coreCount = this.parsed.coreCount;
    this.outputState.warnings = [...this.parsed.warnings];

    if (!this.parsed.powered) {
      this.outputState.activeRecipeId = null;
      this.outputState.activeRecipeName = null;
      this.resetOutputs();
      return;
    }

    this.outputState.activeRecipeId = this.context?.recipe.id ?? null;
    this.outputState.activeRecipeName = this.context?.recipe.name ?? null;
    this.outputState.placeLabel = this.context?.placeLabel ?? null;

    if (this.context?.placeLabel) {
      this.router.publish("place/name", this.context.placeLabel, "chain/place");
    }

    this.unsubscribers.push(
      this.router.subscribe("weather/temp", (msg) => {
        this.outputState.weatherTemp = msg.value as number;
        this.recalculateOutputs();
      }),
    );

    this.unsubscribers.push(
      this.router.subscribe("weather/rain", (msg) => {
        this.outputState.weatherRain = msg.value as number;
        if (this.context?.useCalm) {
          this.smoothedRain = smoothValue(msg.value as number, this.smoothedRain);
          this.router.publish(
            "weather/rain/smoothed",
            this.smoothedRain,
            "runtime/calm",
          );
        }
        this.recalculateOutputs();
      }),
    );

    this.unsubscribers.push(
      this.router.subscribe("control/dial", (msg) => {
        this.dialPosition = msg.value as number;
        this.outputState.dialPosition = this.dialPosition;
        this.recalculateOutputs();
      }),
    );

    this.unsubscribers.push(
      this.router.subscribe("control/slider", (msg) => {
        this.sliderPosition = msg.value as number;
        this.outputState.sliderPosition = this.sliderPosition;
        this.recalculateOutputs();
      }),
    );

    this.unsubscribers.push(
      this.router.subscribe("sensor/motion", (msg) => {
        const detected = msg.value as boolean;
        this.outputState.motionDetected = detected;
        if (
          this.context?.recipe.id === "room-motion-chime" &&
          detected &&
          !this.lastMotion
        ) {
          this.fireChime();
        }
        this.lastMotion = detected;
        this.recalculateOutputs();
      }),
    );

    this.unsubscribers.push(
      this.router.subscribe("github/activity", (msg) => {
        this.outputState.githubActivity = msg.value as number;
        this.recalculateOutputs();
      }),
    );

    this.unsubscribers.push(
      this.router.subscribe("time/hour", (msg) => {
        this.outputState.timeHour = msg.value as number;
        this.recalculateOutputs();
      }),
    );

    this.unsubscribers.push(
      this.router.subscribe("sensor/temp", (msg) => {
        this.outputState.sensorTemp = msg.value as number;
        this.recalculateOutputs();
      }),
    );

    this.recalculateOutputs();
  }

  private applyRandom(value: number): number {
    if (!this.context?.useRandom) return value;
    const jitter = (Math.random() - 0.5) * 0.15;
    return Math.max(0, Math.min(1, value + jitter));
  }

  private recalculateOutputs(): void {
    if (!this.parsed?.powered) {
      this.resetOutputs();
      return;
    }

    if (!this.context) {
      this.resetOutputs();
      this.syncDisplayFromChain();
      this.syncLcdFromChain();
      return;
    }

    const { recipe, useCalm } = this.context;
    const temp = this.outputState.weatherTemp ?? 14;
    const rain = useCalm
      ? this.smoothedRain
      : (this.outputState.weatherRain ?? 0.3);

    switch (recipe.id) {
      case "london-weather-light": {
        const brightness = this.applyRandom(weatherToBrightness(temp, rain));
        this.setLightBrightness(brightness);
        break;
      }
      case "weather-dial-light": {
        const base = weatherToBrightness(temp, rain);
        const scaled = base * (0.15 + this.dialPosition * 0.85);
        this.setLightBrightness(this.applyRandom(scaled));
        break;
      }
      case "time-calm-light": {
        const hour = this.outputState.timeHour ?? 0.5;
        const base = 0.2 + hour * 0.6;
        this.setLightBrightness(this.applyRandom(base * 0.85 + 0.1));
        break;
      }
      case "github-activity-light": {
        const activity = this.outputState.githubActivity ?? 0.3;
        this.setLightBrightness(this.applyRandom(activity));
        break;
      }
      case "temperature-light": {
        const sensorTemp = this.outputState.sensorTemp ?? 20;
        const norm = Math.max(0, Math.min(1, (sensorTemp - 10) / 25));
        this.setLightBrightness(this.applyRandom(norm));
        break;
      }
      case "tokyo-weather-music": {
        const note = 48 + Math.round(((temp + 10) / 40) * 24);
        const velocity = Math.round(40 + (1 - rain) * 60);
        this.setMusicOutput(note, velocity);
        break;
      }
      case "github-display": {
        break;
      }
      default:
        break;
    }

    this.syncDisplayFromChain();
    this.syncLcdFromChain();
  }

  private formatState() {
    return {
      timeHour: this.outputState.timeHour,
      sensorTemp: this.outputState.sensorTemp,
      weatherTemp: this.outputState.weatherTemp,
      weatherRain: this.outputState.weatherRain,
      githubActivity: this.outputState.githubActivity,
      dialPosition: this.outputState.dialPosition,
      sliderPosition: this.outputState.sliderPosition,
    };
  }

  private resolveDisplayText(): string | null {
    if (!this.parsed) return null;

    const chain = this.parsed;
    const recipeId = this.context?.recipe.id;
    const fmt = this.formatState();

    switch (recipeId) {
      case "temperature-light":
        return formatTemp(fmt.sensorTemp);
      case "london-weather-light":
      case "weather-dial-light":
        return formatWeather(fmt.weatherTemp, fmt.weatherRain);
      case "github-display":
        return formatGithub(fmt.githubActivity);
      case "time-calm-light":
        return formatTime(fmt.timeHour);
      default:
        break;
    }

    if (hasTemperatureSensor(chain)) return formatTemp(fmt.sensorTemp);
    if (hasWeatherSource(chain)) return formatWeather(fmt.weatherTemp, fmt.weatherRain);
    if (chain.cubes.some((c) => c.definition.id === "source/github")) {
      return formatGithub(fmt.githubActivity);
    }
    if (hasTimeSource(chain)) return formatTime(fmt.timeHour);

    return null;
  }

  private resolveLcdText(): string | null {
    if (!this.parsed) return null;

    const chain = this.parsed;
    const fmt = this.formatState();

    if (hasMotionSensor(chain) && this.outputState.motionDetected) {
      return "MOTION";
    }

    const hasTime = hasTimeSource(chain);
    const timeStr = hasTime ? formatTime(fmt.timeHour) : null;
    const hasDial = chain.cubes.some((c) => c.definition.id === "control/dial");
    const hasSlider = chain.cubes.some((c) => c.definition.id === "control/slider");
    const hasGithub = chain.cubes.some((c) => c.definition.id === "source/github");

    if (hasTemperatureSensor(chain)) {
      const primary = formatTemp(fmt.sensorTemp);
      return timeStr ? combineLine(primary, timeStr) : primary;
    }

    if (hasWeatherSource(chain)) {
      if (timeStr) {
        return combineLine(formatWeatherCompact(fmt.weatherTemp), timeStr);
      }
      return formatWeather(fmt.weatherTemp, fmt.weatherRain);
    }

    if (hasGithub) {
      const primary = formatGithub(fmt.githubActivity);
      return timeStr ? combineLine(primary, timeStr) : primary;
    }

    if (hasTime) return formatTime(fmt.timeHour);

    if (hasDial) return formatControlPercent(fmt.dialPosition);
    if (hasSlider) return formatControlPercent(fmt.sliderPosition);

    if (chain.place) return chain.place.definition.label;

    return null;
  }

  private syncDisplayFromChain(): void {
    if (!this.parsed?.powered || !hasDisplayOutput(this.parsed)) {
      return;
    }

    const text = this.resolveDisplayText();
    if (text !== null) {
      this.setDisplayText(text);
    } else {
      this.outputState.displayText = null;
    }
  }

  private syncLcdFromChain(): void {
    if (!this.parsed?.powered || !hasLcdOutput(this.parsed)) {
      return;
    }

    const text = this.resolveLcdText();
    if (text !== null) {
      this.setLcdText(text);
    } else {
      this.outputState.lcdText = null;
    }
  }

  private resetOutputs(): void {
    this.outputState.lightBrightness = 0.02;
    this.outputState.musicNote = null;
    this.outputState.musicVelocity = null;
    this.outputState.displayText = null;
    this.outputState.lcdText = null;
    this.outputState.chimeTriggered = false;
  }

  private setLightBrightness(value: number): void {
    if (!this.outputState.powered) {
      this.outputState.lightBrightness = 0.02;
      return;
    }
    const brightness = Math.max(0.02, Math.min(1, value));
    this.outputState.lightBrightness = brightness;
    this.router.publish(
      "output/light/brightness",
      brightness,
      this.context?.outputInstanceId ?? "runtime",
    );
  }

  private setMusicOutput(note: number, velocity: number): void {
    this.outputState.musicNote = note;
    this.outputState.musicVelocity = velocity;
    this.router.publish("output/music/note", note, "runtime");
    this.router.publish("output/music/velocity", velocity, "runtime");
  }

  private setDisplayText(text: string): void {
    this.outputState.displayText = text;
    this.router.publish("output/display/text", text, "runtime");
  }

  private setLcdText(text: string): void {
    this.outputState.lcdText = text;
    this.router.publish("output/lcd/text", text, "runtime");
  }

  private fireChime(): void {
    if (!this.outputState.powered) return;
    this.chimeCount++;
    this.outputState.chimeTriggered = true;
    this.outputState.chimeCount = this.chimeCount;
    this.router.publish(
      "output/chime/trigger",
      true,
      this.context?.outputInstanceId ?? "runtime",
    );
    setTimeout(() => {
      this.outputState.chimeTriggered = false;
      this.router.publish("output/chime/trigger", false, "runtime");
    }, 300);
  }

  private clearBindings(): void {
    for (const unsub of this.unsubscribers) {
      unsub();
    }
    this.unsubscribers = [];
  }
}

export {
  SignalRouter,
  smoothValue,
  weatherToBrightness,
  parseChain,
  isChainPowered,
  buildRecipeContext,
  matchRecipe,
  RECIPES,
  MockAdapters,
  fetchLiveWeather,
};
export type { SignalMessage, ChainCubeInput, ParsedChain, RecipeContext };
