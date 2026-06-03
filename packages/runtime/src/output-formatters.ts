export interface OutputFormatState {
  timeHour: number | null;
  sensorTemp: number | null;
  weatherTemp: number | null;
  weatherRain: number | null;
  githubActivity: number | null;
  dialPosition: number;
  sliderPosition: number;
}

export function formatTime(timeHour: number | null | undefined): string {
  const hourFrac = timeHour ?? 0.5;
  const totalMinutes = Math.floor(hourFrac * 24 * 60);
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function formatTemp(sensorTemp: number | null | undefined): string {
  return `${Math.round(sensorTemp ?? 20)}°C`;
}

export function formatWeather(
  weatherTemp: number | null | undefined,
  weatherRain: number | null | undefined,
): string {
  const temp = Math.round(weatherTemp ?? 14);
  const rain = Math.round((weatherRain ?? 0.3) * 100);
  return `${temp}°C ${rain}%`;
}

export function formatWeatherCompact(weatherTemp: number | null | undefined): string {
  return `${Math.round(weatherTemp ?? 14)}°C`;
}

export function formatGithub(githubActivity: number | null | undefined): string {
  return `${Math.round((githubActivity ?? 0) * 20)}/hr`;
}

export function formatControlPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function combineLine(
  primary: string,
  secondary: string,
  maxLen = 16,
): string {
  const combined = `${primary} ${secondary}`;
  return combined.length <= maxLen ? combined : primary;
}

export interface LcdSegmentContext {
  fmt: OutputFormatState;
  hasTemperatureSensor: boolean;
  hasWeatherSource: boolean;
  hasGithub: boolean;
  hasTimeSource: boolean;
  hasDial: boolean;
  hasSlider: boolean;
  placeLabel: string | null;
}

export function resolveLcdSegments(ctx: LcdSegmentContext): string[] {
  const { fmt } = ctx;
  const segments: string[] = [];

  if (ctx.hasTemperatureSensor) segments.push(formatTemp(fmt.sensorTemp));
  if (ctx.hasWeatherSource) {
    segments.push(formatWeather(fmt.weatherTemp, fmt.weatherRain));
  }
  if (ctx.hasGithub) segments.push(formatGithub(fmt.githubActivity));
  if (ctx.hasTimeSource) segments.push(formatTime(fmt.timeHour));
  if (ctx.hasDial) segments.push(formatControlPercent(fmt.dialPosition));
  if (ctx.hasSlider) segments.push(formatControlPercent(fmt.sliderPosition));
  if (ctx.placeLabel && segments.length === 0) segments.push(ctx.placeLabel);

  return segments;
}

export function concatLcdSegments(segments: string[]): string {
  return segments.join(" ");
}

export function distributeSegmentsToLcds(
  segments: string[],
  lcdCount: number,
): string[] {
  if (lcdCount === 0) return [];
  if (lcdCount === 1) {
    return segments.length > 0 ? [concatLcdSegments(segments)] : ["--"];
  }
  if (segments.length === 0) {
    return Array.from({ length: lcdCount }, () => "--");
  }
  if (segments.length <= lcdCount) {
    const result = [...segments];
    while (result.length < lcdCount) result.push("--");
    return result;
  }

  const perBucket = Math.ceil(segments.length / lcdCount);
  const result: string[] = [];
  for (let i = 0; i < lcdCount; i++) {
    const chunk = segments.slice(i * perBucket, (i + 1) * perBucket);
    result.push(chunk.length > 0 ? concatLcdSegments(chunk) : "--");
  }
  return result;
}
