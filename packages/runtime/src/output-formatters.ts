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
