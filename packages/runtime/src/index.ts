import type { ChainCubeInput, ParsedChain } from "./chain-parser.js";
import {
  parseChain,
  isChainPowered,
  hasLcdOutput,
  hasLcdSignalModules,
  hasMotionSensor,
  hasCalmModifier,
  hasTemperatureSensor,
  hasLightOutput,
  hasWeatherSource,
  hasTimeSource,
} from "./chain-parser.js";
import type { RecipeContext } from "./recipes.js";
import { buildRecipeContext, matchRecipe, RECIPES } from "./recipes.js";
import { MockAdapters, LiveWeatherAdapter, fetchLiveWeather } from "./adapters/mock.js";
import { formatPowerBattery } from "./output-formatters.js";
import {
  compileChainToGraph,
  getRemainderEdges,
  hasRemainderEdge,
} from "./capability-graph.js";
import {
  buildDeviceRegistry,
  debugAddressFor,
  registryToDiscoveredList,
  type DiscoveredDevice,
} from "./device-registry.js";
import {
  resolveViewportTextsForChain,
  shouldBroadcastMotionToLcds,
  traceViewportConsumption,
  type ViewportConsumptionStep,
} from "./segment-pipeline.js";
import {
  resolveLightBehaviour,
  resolvePrimaryRecipeLabel,
  matchLegacyRecipe,
  type LightBehaviourId,
} from "./output-bindings.js";
import {
  weatherToLightMood,
  type LightMood,
} from "./weather-light.js";
import {
  defaultLiveWeatherCoords,
  resolvePlaceProfile,
  hourFractionInTimezone,
  type PlaceProfile,
} from "./place-profile.js";
import {
  SignalRouter,
  smoothValue,
  weatherToBrightness,
  latestKey,
  type SignalMessage,
} from "./signal-router.js";
import { perlin1D, perlin2D, perlinNormalized1D } from "./perlin.js";

export interface FoundryEngineOptions {
  onSignal?: (message: SignalMessage) => void;
  dialDefault?: number;
  sliderDefault?: number;
}

export interface FoundryOutputState {
  powered: boolean;
  coreCount: number;
  lightBrightness: number;
  lightMood: LightMood | null;
  chimeTriggered: boolean;
  chimeCount: number;
  activeRecipeId: string | null;
  activeRecipeName: string | null;
  warnings: string[];
  placeLabel: string | null;
  placeId: string | null;
  placeTimezone: string | null;
  weatherTemp: number | null;
  weatherRain: number | null;
  dialPosition: number;
  sliderPosition: number;
  motionDetected: boolean;
  buttonPressed: boolean;
  githubActivity: number | null;
  musicNote: number | null;
  musicVelocity: number | null;
  lcdText: string | null;
  lcdTexts: Record<string, string>;
  sensorTemp: number | null;
  timeHour: number | null;
  modifierRandom: number | null;
  modifierCalmNoise: number | null;
  powerSource: "usb" | "battery";
  batteryPercent: number;
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
  chainMode: string;
  viewportTrace: ViewportConsumptionStep[];
  bindings: Array<{
    topic: string;
    value: string | number | boolean;
    source: string;
    targetId?: string;
    targetAddress?: string;
  }>;
}

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
  private noiseTime = 0;
  private outputState: FoundryOutputState;
  private devices = new Map<string, DiscoveredDevice>();
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
      lightMood: null,
      chimeTriggered: false,
      chimeCount: 0,
      activeRecipeId: null,
      activeRecipeName: null,
      warnings: [],
      placeLabel: null,
      placeId: null,
      placeTimezone: null,
      weatherTemp: null,
      weatherRain: null,
      dialPosition: this.dialPosition,
      sliderPosition: this.sliderPosition,
      motionDetected: false,
      buttonPressed: false,
      githubActivity: null,
      musicNote: null,
      musicVelocity: null,
      lcdText: null,
      lcdTexts: {},
      sensorTemp: null,
      timeHour: null,
      modifierRandom: null,
      modifierCalmNoise: null,
      powerSource: "usb",
      batteryPercent: 100,
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

  getDevice(instanceId: string): DiscoveredDevice | undefined {
    return this.devices.get(instanceId);
  }

  getCoreDebugSnapshot(): CoreDebugSnapshot {
    const parsed = this.parsed ?? parseChain(this.chain);
    const log = this.router.getLog(20);
    const resolveAddress = (targetId: string) =>
      this.devices.get(targetId)?.address;

    const viewportTrace =
      parsed.powered && hasLcdOutput(parsed)
        ? traceViewportConsumption(parsed, this.formatState(), resolveAddress, {
            motionDetected: this.outputState.motionDetected,
          })
        : [];

    const chainMode = this.outputState.powered
      ? this.outputState.activeRecipeName
        ? "recipe"
        : "manual"
      : "unpowered";

    return {
      powered: this.outputState.powered,
      coreCount: parsed.coreCount,
      chainLength: parsed.cubes.length,
      discovered: registryToDiscoveredList(this.devices).map((d) => ({
        instanceId: d.instanceId,
        label: d.label,
        id: d.cubeId,
        role: d.role,
        index: d.chainIndex,
        address: d.address ?? debugAddressFor(d.instanceId),
      })),
      activeRecipe: this.outputState.activeRecipeName,
      chainMode,
      viewportTrace,
      bindings: log.map((m) => ({
        topic: m.topic,
        value: m.value,
        source: m.source,
        targetId: m.targetId,
        targetAddress: m.targetAddress,
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

  setPowerSource(source: "usb" | "battery"): void {
    this.outputState.powerSource = source;
    this.syncCorePower();
    this.syncLcdFromChain();
  }

  setBatteryPercent(percent: number): void {
    this.outputState.batteryPercent = Math.max(0, Math.min(100, percent));
    this.syncCorePower();
    this.syncLcdFromChain();
  }

  getDialPosition(): number {
    return this.dialPosition;
  }

  setLiveWeather(enabled: boolean): void {
    this.useLiveWeather = enabled;
    this.liveWeather?.stop();
    this.liveWeather = null;

    if (enabled) {
      this.mockAdapters.stop();
    } else {
      this.mockAdapters.start();
    }

    if (this.parsed?.powered) {
      this.syncPlaceAdapters();
    }
  }

  start(): void {
    if (!this.useLiveWeather) {
      this.mockAdapters.start();
    }
    this.router.publish("control/dial", this.dialPosition, "ui/dial");
    this.router.publish("control/slider", this.sliderPosition, "ui/slider");
    if (this.parsed?.powered) {
      this.syncPlaceAdapters();
    }
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

  private syncPlaceAdapters(): void {
    if (!this.parsed?.powered) {
      if (this.timeTimer) clearInterval(this.timeTimer);
      if (this.tempTimer) clearInterval(this.tempTimer);
      this.timeTimer = undefined;
      this.tempTimer = undefined;
      return;
    }

    const chain = this.parsed;
    const place = resolvePlaceProfile(chain);

    this.outputState.placeId = place?.id ?? null;
    this.outputState.placeTimezone = place?.timezone ?? null;

    if (!this.useLiveWeather) {
      this.mockAdapters.setPlaceProfile(place);
      this.mockAdapters.setWeatherEnabled(hasWeatherSource(chain));
    }

    this.syncTimePublishing(place, hasTimeSource(chain));
    this.syncLiveWeatherFromPlace(place);

    if (hasTemperatureSensor(chain)) {
      if (this.tempTimer) clearInterval(this.tempTimer);
      this.mockAdapters.publishTemperature();
      this.tempTimer = setInterval(
        () => this.mockAdapters.publishTemperature(),
        4000,
      );
    } else if (this.tempTimer) {
      clearInterval(this.tempTimer);
      this.tempTimer = undefined;
    }
  }

  private syncTimePublishing(
    place: PlaceProfile | null,
    hasTimeCube: boolean,
  ): void {
    if (this.timeTimer) clearInterval(this.timeTimer);
    this.timeTimer = undefined;

    if (place) {
      this.mockAdapters.setTimeTimezone(place.timezone);
      this.mockAdapters.publishTime(place.timezone);
      this.timeTimer = setInterval(
        () => this.mockAdapters.publishTime(place.timezone),
        5000,
      );
    } else if (hasTimeCube) {
      this.mockAdapters.setTimeTimezone(undefined);
      this.mockAdapters.publishTime();
      this.timeTimer = setInterval(() => this.mockAdapters.publishTime(), 5000);
    }
  }

  private syncLiveWeatherFromPlace(place: PlaceProfile | null): void {
    if (!this.useLiveWeather || !this.parsed || !hasWeatherSource(this.parsed)) {
      return;
    }

    const coords = place ?? defaultLiveWeatherCoords();
    if (this.liveWeather) {
      this.liveWeather.updateCoords(coords.lat, coords.lon);
    } else {
      this.liveWeather = new LiveWeatherAdapter(this.router, coords);
      this.liveWeather.start();
    }
  }

  private rebind(): void {
    this.clearBindings();
    this.parsed = parseChain(this.chain);
    this.devices = buildDeviceRegistry(this.parsed);
    this.context = buildRecipeContext(this.parsed);

    this.outputState.powered = this.parsed.powered;
    this.outputState.coreCount = this.parsed.coreCount;
    this.outputState.warnings = [...this.parsed.warnings];

    if (!this.parsed.powered) {
      this.outputState.activeRecipeId = null;
      this.outputState.activeRecipeName = null;
      this.outputState.placeId = null;
      this.outputState.placeTimezone = null;
      this.resetOutputs();
      return;
    }

    const lightBehaviour = resolveLightBehaviour(this.parsed);
    const legacy = matchLegacyRecipe(this.parsed);
    this.outputState.activeRecipeId =
      legacy?.id ?? lightBehaviour ?? this.context?.recipe?.id ?? null;
    this.outputState.activeRecipeName =
      legacy?.name ??
      resolvePrimaryRecipeLabel(this.parsed, lightBehaviour) ??
      this.context?.recipe?.name ??
      (this.parsed.powered ? "manual composition" : null);
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
    this.syncCorePower();
    this.syncPlaceAdapters();
  }

  private applyRandom(value: number): number {
    const useRandom =
      this.context?.useRandom ??
      this.parsed?.cubes.some((c) => c.definition.id === "modifier/random");
    if (!useRandom) return value;
    const jitter = perlin1D(this.noiseTime * 2.5) * 0.15;
    return Math.max(0, Math.min(1, value + jitter));
  }

  private syncModifierNoise(): void {
    if (!this.parsed?.powered) {
      this.outputState.modifierRandom = null;
      this.outputState.modifierCalmNoise = null;
      return;
    }

    const useRandom = this.parsed.cubes.some(
      (c) => c.definition.id === "modifier/random",
    );
    const useCalm = hasCalmModifier(this.parsed);

    this.noiseTime += 0.016;

    if (useRandom) {
      const normalized = perlinNormalized1D(this.noiseTime * 2.5);
      this.outputState.modifierRandom = normalized;
      const randomCube = this.parsed.cubes.find(
        (c) => c.definition.id === "modifier/random",
      );
      const source =
        randomCube?.instanceId ??
        this.context?.randomInstanceId ??
        this.context?.outputInstanceId ??
        "runtime";
      this.router.publish("modifier/random", normalized, source);
    } else {
      this.outputState.modifierRandom = null;
    }

    if (useCalm) {
      this.outputState.modifierCalmNoise =
        perlin1D(this.noiseTime * 0.35) * 0.5 + 0.5;
    } else {
      this.outputState.modifierCalmNoise = null;
    }
  }

  private recalculateOutputs(): void {
    if (!this.parsed?.powered) {
      this.resetOutputs();
      return;
    }

    const useCalm =
      this.context?.useCalm ?? hasCalmModifier(this.parsed);
    const temp = this.outputState.weatherTemp ?? 14;
    const rain = useCalm
      ? this.smoothedRain
      : (this.outputState.weatherRain ?? 0.3);

    const lightBehaviour = resolveLightBehaviour(this.parsed);
    this.applyLightBehaviour(lightBehaviour, temp, rain);

    const legacyRecipe = matchLegacyRecipe(this.parsed);
    if (legacyRecipe?.id === "tokyo-weather-music") {
      const note = 48 + Math.round(((temp + 10) / 40) * 24);
      const velocity = Math.round(40 + (1 - rain) * 60);
      this.setMusicOutput(note, velocity);
    }

    this.syncModifierNoise();
    this.syncLcdFromChain();
  }

  private applyLightBehaviour(
    behaviour: LightBehaviourId | null,
    temp: number,
    rain: number,
  ): void {
    if (!hasLightOutput(this.parsed!)) {
      this.outputState.lightMood = null;
      return;
    }
    if (!behaviour) {
      this.setLightOutput(0.02, null);
      return;
    }

    switch (behaviour) {
      case "london-weather-light": {
        const brightness = this.applyRandom(weatherToBrightness(temp, rain));
        this.setLightOutput(brightness, weatherToLightMood(temp, rain));
        break;
      }
      case "weather-dial-light": {
        const base = weatherToBrightness(temp, rain);
        const scaled = base * (0.15 + this.dialPosition * 0.85);
        this.setLightOutput(
          this.applyRandom(scaled),
          weatherToLightMood(temp, rain),
        );
        break;
      }
      case "time-calm-light": {
        const hour = this.outputState.timeHour ?? 0.5;
        const base = 0.2 + hour * 0.6;
        this.setLightOutput(this.applyRandom(base * 0.85 + 0.1), "overcast");
        break;
      }
      case "github-activity-light": {
        const activity = this.outputState.githubActivity ?? 0.3;
        this.setLightOutput(this.applyRandom(activity), null);
        break;
      }
      case "temperature-light": {
        const sensorTemp = this.outputState.sensorTemp ?? 20;
        const norm = Math.max(0, Math.min(1, (sensorTemp - 10) / 25));
        this.setLightOutput(this.applyRandom(norm), norm > 0.55 ? "sun" : "overcast");
        break;
      }
    }
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
      lightBrightness: this.outputState.lightBrightness,
      modifierRandom: this.outputState.modifierRandom,
      modifierCalmNoise: this.outputState.modifierCalmNoise,
    };
  }

  private syncCorePower(): void {
    if (!this.outputState.powered) return;

    const text = formatPowerBattery(
      this.outputState.powerSource,
      this.outputState.batteryPercent,
    );
    this.router.publish("core/power", text, "core");
  }

  private syncLcdFromChain(): void {
    if (!this.parsed?.powered || !hasLcdOutput(this.parsed)) {
      return;
    }

    const chain = this.parsed;
    const lcdOutputs = chain.cubes.filter((c) => c.definition.id === "output/lcd");
    const texts: Record<string, string> = {};

    const publishViewport = (instanceId: string, text: string) => {
      const prev = this.router.getLatest("output/lcd/text", instanceId);
      if (prev?.value === text) return;

      const device = this.getDevice(instanceId);
      this.router.publish("output/lcd/text", text, {
        source: "core",
        targetId: instanceId,
        targetAddress: device?.address ?? debugAddressFor(instanceId),
      });
    };

    if (!hasLcdSignalModules(chain)) {
      const text = formatPowerBattery(
        this.outputState.powerSource,
        this.outputState.batteryPercent,
      );
      for (const lcd of lcdOutputs) {
        texts[lcd.instanceId] = text;
      }
    } else if (
      hasMotionSensor(chain) &&
      this.outputState.motionDetected &&
      shouldBroadcastMotionToLcds(chain)
    ) {
      for (const lcd of lcdOutputs) {
        texts[lcd.instanceId] = "MOTION";
      }
    } else {
      compileChainToGraph(chain);
      Object.assign(
        texts,
        resolveViewportTextsForChain(chain, this.formatState(), {
          motionDetected: this.outputState.motionDetected,
        }),
      );
    }

    this.outputState.lcdTexts = texts;
    this.outputState.lcdText = lcdOutputs[0]
      ? (texts[lcdOutputs[0].instanceId] ?? null)
      : null;

    for (const [instanceId, text] of Object.entries(texts)) {
      publishViewport(instanceId, text);
    }
  }

  private resetOutputs(): void {
    this.outputState.lightBrightness = 0.02;
    this.outputState.lightMood = null;
    this.outputState.musicNote = null;
    this.outputState.musicVelocity = null;
    this.outputState.lcdText = null;
    this.outputState.lcdTexts = {};
    this.outputState.chimeTriggered = false;
    this.outputState.modifierRandom = null;
    this.outputState.modifierCalmNoise = null;
  }

  private setLightOutput(brightness: number, mood: LightMood | null): void {
    if (!this.outputState.powered) {
      this.outputState.lightBrightness = 0.02;
      this.outputState.lightMood = null;
      return;
    }
    const b = Math.max(0.02, Math.min(1, brightness));
    this.outputState.lightBrightness = b;
    this.outputState.lightMood = mood;
    const source =
      this.context?.lightInstanceId ??
      this.parsed?.cubes.find((c) => c.definition.id === "output/light")
        ?.instanceId ??
      "runtime";
    this.router.publish("output/light/brightness", b, source);
  }

  private setMusicOutput(note: number, velocity: number): void {
    this.outputState.musicNote = note;
    this.outputState.musicVelocity = velocity;
    const source =
      this.context?.musicInstanceId ?? this.context?.outputInstanceId ?? "runtime";
    this.router.publish("output/music/note", note, source);
    this.router.publish("output/music/velocity", velocity, source);
  }

  private fireChime(): void {
    if (!this.outputState.powered) return;
    this.chimeCount++;
    this.outputState.chimeTriggered = true;
    this.outputState.chimeCount = this.chimeCount;
    const source =
      this.context?.chimeInstanceId ?? this.context?.outputInstanceId ?? "runtime";
    this.router.publish("output/chime/trigger", true, source);
    setTimeout(() => {
      this.outputState.chimeTriggered = false;
      this.router.publish("output/chime/trigger", false, source);
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
  weatherToLightMood,
  LIGHT_MOOD_COLORS,
} from "./weather-light.js";
export type { LightMood } from "./weather-light.js";
export {
  resolveLightBehaviour,
  resolvePrimaryRecipeLabel,
} from "./output-bindings.js";
export {
  shouldBroadcastMotionToLcds,
} from "./segment-pipeline.js";
export {
  SignalRouter,
  smoothValue,
  weatherToBrightness,
  latestKey,
  parseChain,
  isChainPowered,
  buildRecipeContext,
  matchRecipe,
  RECIPES,
  MockAdapters,
  fetchLiveWeather,
  formatPowerBattery,
  resolvePlaceProfile,
  hourFractionInTimezone,
  perlin1D,
  perlin2D,
  perlinNormalized1D,
  compileChainToGraph,
  hasRemainderEdge,
  getRemainderEdges,
  resolveViewportTextsForChain,
  traceViewportConsumption,
  buildDeviceRegistry,
  debugAddressFor,
};
export { resolveLcdTextsForChain } from "./segment-pipeline.js";
export {
  buildSegments,
  buildSegmentContext,
  distributePayloadToViewports,
} from "./segment-pipeline.js";
export type {
  Segment,
  ConsumablePayload,
  ConsumerResult,
  SegmentBuildContext,
  ViewportConsumptionStep,
} from "./segment-pipeline.js";
export type { DiscoveredDevice } from "./device-registry.js";
export type { PublishOptions } from "./signal-router.js";
export type {
  CapabilityGraph,
  GraphNode,
  GraphEdge,
  GraphEdgeChannel,
  GraphNodeKind,
} from "./capability-graph.js";
export type {
  SignalMessage,
  ChainCubeInput,
  ParsedChain,
  RecipeContext,
  PlaceProfile,
};
