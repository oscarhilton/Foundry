import type { SignalRouter } from "../signal-router.js";
import { smoothValue, weatherToBrightness } from "../signal-router.js";

export interface WeatherData {
  temp: number;
  rain: number;
}

export interface MockAdapterOptions {
  weatherIntervalMs?: number;
  githubIntervalMs?: number;
  initialWeather?: WeatherData;
}

export class MockAdapters {
  private weatherTimer?: ReturnType<typeof setInterval>;
  private githubTimer?: ReturnType<typeof setInterval>;
  private weather: WeatherData;
  private smoothedRain = 0.3;
  private lastMotion = false;
  private router: SignalRouter;
  private running = false;

  constructor(router: SignalRouter, options: MockAdapterOptions = {}) {
    this.router = router;
    this.weather = options.initialWeather ?? { temp: 14, rain: 0.35 };
    this.weatherIntervalMs = options.weatherIntervalMs ?? 3000;
    this.githubIntervalMs = options.githubIntervalMs ?? 4000;
  }

  private weatherIntervalMs: number;
  private githubIntervalMs: number;

  start(): void {
    if (this.running) return;
    this.running = true;
    this.publishWeather();
    this.publishGithub();

    this.weatherTimer = setInterval(() => {
      this.weather = {
        temp: 8 + Math.sin(Date.now() / 20000) * 8 + Math.random() * 2,
        rain: Math.max(0, Math.min(1, 0.3 + Math.sin(Date.now() / 15000) * 0.4)),
      };
      this.publishWeather();
    }, this.weatherIntervalMs);

    this.githubTimer = setInterval(() => {
      this.publishGithub();
    }, this.githubIntervalMs);
  }

  stop(): void {
    this.running = false;
    if (this.weatherTimer) clearInterval(this.weatherTimer);
    if (this.githubTimer) clearInterval(this.githubTimer);
  }

  setWeather(data: WeatherData): void {
    this.weather = data;
    this.publishWeather();
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
    const activity = 0.2 + Math.random() * 0.6;
    this.router.publish("github/activity", activity, "mock/github");
  }

  publishTime(): void {
    const hour = new Date().getHours() + new Date().getMinutes() / 60;
    this.router.publish("time/hour", hour / 24, "mock/time");
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
