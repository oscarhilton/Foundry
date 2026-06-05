import type { PlaceProfile } from "../place-profile.js";
import type { SignalRouter } from "../signal-router.js";
import { smoothValue, weatherToBrightness } from "../signal-router.js";
import { hourFractionInTimezone } from "../place-profile.js";

export interface WeatherData {
  temp: number;
  rain: number;
}

export interface MockAdapterOptions {
  weatherIntervalMs?: number;
  githubIntervalMs?: number;
  initialWeather?: WeatherData;
  /** Skip random weather ticks; publish initialWeather only. */
  auditMode?: boolean;
}

export class MockAdapters {
  private weatherTimer?: ReturnType<typeof setInterval>;
  private githubTimer?: ReturnType<typeof setInterval>;
  private weather: WeatherData;
  private smoothedRain = 0.3;
  private lastMotion = false;
  private router: SignalRouter;
  private running = false;
  private placeProfile: PlaceProfile | null = null;
  private weatherEnabled = true;
  private githubEnabled = false;
  private timeTimezone: string | undefined;
  private auditMode: boolean;

  constructor(router: SignalRouter, options: MockAdapterOptions = {}) {
    this.router = router;
    this.weather = options.initialWeather ?? { temp: 14, rain: 0.35 };
    this.weatherIntervalMs = options.weatherIntervalMs ?? 3000;
    this.githubIntervalMs = options.githubIntervalMs ?? 4000;
    this.auditMode = options.auditMode ?? false;
  }

  private weatherIntervalMs: number;
  private githubIntervalMs: number;

  setPlaceProfile(profile: PlaceProfile | null): void {
    this.placeProfile = profile;
    this.timeTimezone = profile?.timezone;
    if (this.weatherEnabled && !this.auditMode) {
      this.weather = this.generateWeatherSample();
      if (this.running) this.publishWeather();
    }
  }

  setWeatherEnabled(enabled: boolean): void {
    this.weatherEnabled = enabled;
    if (!enabled && this.weatherTimer) {
      clearInterval(this.weatherTimer);
      this.weatherTimer = undefined;
    } else if (enabled && this.running && !this.weatherTimer) {
      this.weather = this.generateWeatherSample();
      this.publishWeather();
      this.weatherTimer = setInterval(() => {
        this.weather = this.generateWeatherSample();
        this.publishWeather();
      }, this.weatherIntervalMs);
    }
  }

  setGithubEnabled(enabled: boolean): void {
    this.githubEnabled = enabled;
    if (!enabled && this.githubTimer) {
      clearInterval(this.githubTimer);
      this.githubTimer = undefined;
    } else if (enabled && this.running && !this.githubTimer) {
      this.publishGithub();
      this.githubTimer = setInterval(() => {
        this.publishGithub();
      }, this.githubIntervalMs);
    }
  }

  setTimeTimezone(timezone: string | undefined): void {
    this.timeTimezone = timezone;
  }

  start(): void {
    if (this.running) return;
    this.running = true;

    if (this.weatherEnabled) {
      if (!this.auditMode) {
        this.weather = this.generateWeatherSample();
      }
      this.publishWeather();
      if (!this.auditMode) {
        this.weatherTimer = setInterval(() => {
          this.weather = this.generateWeatherSample();
          this.publishWeather();
        }, this.weatherIntervalMs);
      }
    }

    if (this.githubEnabled && !this.auditMode) {
      this.publishGithub();
      this.githubTimer = setInterval(() => {
        this.publishGithub();
      }, this.githubIntervalMs);
    }
  }

  stop(): void {
    this.running = false;
    if (this.weatherTimer) clearInterval(this.weatherTimer);
    if (this.githubTimer) clearInterval(this.githubTimer);
    this.weatherTimer = undefined;
    this.githubTimer = undefined;
  }

  private generateWeatherSample(): WeatherData {
    const base = this.placeProfile?.mockBaseTemp ?? 14;
    const rainBase = this.placeProfile?.mockRainBias ?? 0.35;
    const t = Date.now();
    return {
      temp: base + Math.sin(t / 20000) * 6 + Math.random() * 2,
      rain: Math.max(0, Math.min(1, rainBase + Math.sin(t / 15000) * 0.3)),
    };
  }

  setWeather(data: WeatherData): void {
    this.weather = data;
    if (this.weatherEnabled) this.publishWeather();
  }

  getWeather(): WeatherData {
    return { ...this.weather };
  }

  triggerMotion(detected = true): void {
    this.lastMotion = detected;
    this.router.publish("sensor/motion", detected, "mock/motion");
  }

  toggleMotion(): void {
    this.triggerMotion(!this.lastMotion);
  }

  private publishWeather(): void {
    if (!this.weatherEnabled) return;
    this.router.publish("weather/temp", this.weather.temp, "mock/weather");
    this.router.publish("weather/rain", this.weather.rain, "mock/weather");
    this.smoothedRain = smoothValue(this.weather.rain, this.smoothedRain);
    this.router.publish(
      "weather/rain/smoothed",
      this.smoothedRain,
      "mock/calm",
    );
    const brightness = weatherToBrightness(this.weather.temp, this.weather.rain);
    this.router.publish("weather/brightness", brightness, "mock/weather");
  }

  private publishGithub(): void {
    if (!this.githubEnabled) return;
    const activity = 0.2 + Math.random() * 0.6;
    this.router.publish("github/activity", activity, "mock/github");
  }

  publishTime(timezone?: string): void {
    const tz = timezone ?? this.timeTimezone;
    const hourFrac = tz
      ? hourFractionInTimezone(tz)
      : (new Date().getHours() + new Date().getMinutes() / 60) / 24;
    this.router.publish("time/hour", hourFrac, "mock/time");
  }

  publishTemperature(): void {
    const temp = 18 + Math.sin(Date.now() / 30000) * 4;
    this.router.publish("sensor/temp", temp, "mock/temperature");
  }

  startTime(intervalMs = 5000): void {
    this.publishTime();
    setInterval(() => this.publishTime(), intervalMs);
  }

  startTemperature(intervalMs = 4000): void {
    this.publishTemperature();
    setInterval(() => this.publishTemperature(), intervalMs);
  }
}

export interface LiveWeatherOptions {
  lat: number;
  lon: number;
}

export async function fetchLiveWeather(
  options: LiveWeatherOptions,
): Promise<WeatherData | null> {
  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(options.lat));
    url.searchParams.set("longitude", String(options.lon));
    url.searchParams.set("current", "temperature_2m,precipitation");
    url.searchParams.set("timezone", "auto");

    const res = await fetch(url.toString());
    if (!res.ok) return null;

    const data = (await res.json()) as {
      current?: { temperature_2m?: number; precipitation?: number };
    };

    const temp = data.current?.temperature_2m ?? 15;
    const precip = data.current?.precipitation ?? 0;
    const rain = Math.max(0, Math.min(1, precip / 5));

    return { temp, rain };
  } catch {
    return null;
  }
}

export class LiveWeatherAdapter {
  private timer?: ReturnType<typeof setInterval>;
  private router: SignalRouter;
  private options: LiveWeatherOptions;
  private running = false;

  constructor(router: SignalRouter, options: LiveWeatherOptions) {
    this.router = router;
    this.options = options;
  }

  updateCoords(lat: number, lon: number): void {
    this.options = { lat, lon };
    if (this.running) void this.poll();
  }

  start(intervalMs = 900_000): void {
    if (this.running) return;
    this.running = true;
    void this.poll();
    this.timer = setInterval(() => void this.poll(), intervalMs);
  }

  stop(): void {
    this.running = false;
    if (this.timer) clearInterval(this.timer);
  }

  private async poll(): Promise<void> {
    const data = await fetchLiveWeather(this.options);
    if (!data) return;
    this.router.publish("weather/temp", data.temp, "live/weather");
    this.router.publish("weather/rain", data.rain, "live/weather");
    const brightness = weatherToBrightness(data.temp, data.rain);
    this.router.publish("weather/brightness", brightness, "live/weather");
  }
}
