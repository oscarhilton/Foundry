import type { LightBehaviourId } from "./output-bindings.js";
import type { LightMood } from "./weather-light.js";

export interface LightDebugInput {
  githubActivity: number | null;
  weatherTemp: number | null;
  weatherRain: number | null;
  sensorTemp: number | null;
  timeHour: number | null;
  dialPosition: number;
  lightBrightness: number;
  lightMood: LightMood | null;
}

export interface LightDebugOutput {
  instanceId: string;
  label: string;
  address: string;
  mode: string;
  behaviourId: LightBehaviourId | null;
  brightness: number;
  mood: LightMood | null;
  driverTopic: string | null;
  driverValue: number | null;
  driverSummary: string;
}

const MODE_LABELS: Record<LightBehaviourId, string> = {
  "github-activity-light": "GitHub Activity",
  "london-weather-light": "Weather Mood",
  "weather-dial-light": "Weather Dial",
  "temperature-light": "Temperature",
  "time-calm-light": "Time Calm",
  "button-light": "Button Circuit",
};

function moodLabel(mood: LightMood | null): string | null {
  if (!mood) return null;
  return mood.charAt(0).toUpperCase() + mood.slice(1);
}

export function buildLightDebugOutput(
  behaviour: LightBehaviourId | null,
  state: LightDebugInput,
  light: { instanceId: string; label: string },
  address: string,
): LightDebugOutput | null {
  if (!behaviour) return null;

  const mode = MODE_LABELS[behaviour];
  let driverTopic: string | null = null;
  let driverValue: number | null = null;
  let driverSummary = "";

  switch (behaviour) {
    case "github-activity-light":
      driverTopic = "github/activity";
      driverValue = state.githubActivity ?? 0.3;
      driverSummary = "github/activity → brightness";
      break;
    case "london-weather-light":
      driverTopic = "weather/temp";
      driverValue = state.weatherTemp ?? 14;
      driverSummary = "weather (temp, rain) → mood + brightness";
      break;
    case "weather-dial-light":
      driverTopic = "control/dial";
      driverValue = state.dialPosition;
      driverSummary = "weather + dial → scaled brightness";
      break;
    case "temperature-light":
      driverTopic = "sensor/temp";
      driverValue = state.sensorTemp ?? 20;
      driverSummary = "sensor/temp → brightness";
      break;
    case "time-calm-light":
      driverTopic = "time/hour";
      driverValue = state.timeHour ?? 0.5;
      driverSummary = "time/hour + calm → brightness";
      break;
    case "button-light":
      driverTopic = "control/button/press";
      driverValue = null;
      driverSummary = "circuit CLOSED → full brightness, OPEN → dim";
      break;
  }

  return {
    instanceId: light.instanceId,
    label: light.label,
    address,
    mode,
    behaviourId: behaviour,
    brightness: state.lightBrightness,
    mood: state.lightMood,
    driverTopic,
    driverValue,
    driverSummary,
  };
}

export function formatLightMoodLabel(mood: LightMood | null): string | null {
  return moodLabel(mood);
}
