import { useRef } from "react";
import type Konva from "konva";
import { Group } from "react-konva";
import type { CubeDefinition } from "@foundry/cube-defs";
import type { FoundryOutputState } from "@foundry/runtime";
import { BaseCubeShell } from "./cubes/BaseCubeShell";
import { LightVisual } from "./cubes/LightVisual";
import { DialVisual } from "./cubes/DialVisual";
import { MotionVisual } from "./cubes/MotionVisual";
import { ChimeVisual } from "./cubes/ChimeVisual";
import { WeatherVisual } from "./cubes/WeatherVisual";
import { CalmVisual } from "./cubes/CalmVisual";
import { GitHubVisual } from "./cubes/GitHubVisual";
import { PassiveVisual } from "./cubes/PassiveVisual";
import { CoreVisual } from "./cubes/CoreVisual";
import { ButtonVisual } from "./cubes/ButtonVisual";
import { SliderVisual } from "./cubes/SliderVisual";
import { MusicVisual } from "./cubes/MusicVisual";
import { DisplayVisual } from "./cubes/DisplayVisual";
import { TemperatureVisual } from "./cubes/TemperatureVisual";
import { TimeVisual } from "./cubes/TimeVisual";
import { RandomVisual } from "./cubes/RandomVisual";
import { COLORS } from "./design-tokens";
import { lerp } from "./animations";
import { useEffectTimestamps } from "./effect-timestamps";

export interface CubeVisualState {
  outputState: FoundryOutputState;
  animTime: number;
  recipeActive: boolean;
  powered: boolean;
  debugOpen: boolean;
  inChain: boolean;
  isPrimaryLight?: boolean;
  isPrimaryDial?: boolean;
  isPrimaryChime?: boolean;
  isPrimaryMusic?: boolean;
  isPrimaryDisplay?: boolean;
  isPrimaryButton?: boolean;
  isPrimarySlider?: boolean;
}

interface CubeNodeProps {
  definition: CubeDefinition;
  x: number;
  y: number;
  draggable?: boolean;
  isDropTarget?: boolean;
  visualState: CubeVisualState;
  onDragStart?: () => void;
  onDragMove?: (x: number, y: number) => void;
  onDragEnd?: (x: number, y: number, node?: Konva.Group) => void;
  onDblClick?: () => void;
  onClick?: () => void;
  opacity?: number;
  dragScale?: number;
  onDialChange?: (value: number) => void;
  onSliderChange?: (value: number) => void;
}

function getStatusLed(
  id: string,
  outputState: FoundryOutputState,
  recipeActive: boolean,
  powered: boolean,
  inChain: boolean,
  animTime: number,
  isPrimary: {
    light?: boolean;
    chime?: boolean;
    music?: boolean;
    button?: boolean;
    motion?: boolean;
  },
): { color: string; active: boolean; pulse: number } {
  const pulse = 0.5 + Math.sin(animTime * 0.004) * 0.5;

  if (inChain && !powered && id !== "core/core") {
    return { color: COLORS.connectorGrey, active: false, pulse: 1 };
  }

  switch (id) {
    case "core/core":
      return {
        color: COLORS.ledGreen,
        active: outputState.powered,
        pulse,
      };
    case "output/light":
      return {
        color: COLORS.ledYellow,
        active: isPrimary.light && outputState.lightBrightness > 0.1,
        pulse: outputState.lightBrightness,
      };
    case "output/chime":
      return {
        color: COLORS.ledPurple,
        active: isPrimary.chime && outputState.chimeTriggered,
        pulse,
      };
    case "output/music":
      return {
        color: COLORS.ledBlue,
        active: isPrimary.music && outputState.musicNote !== null,
        pulse,
      };
    case "control/button":
      return {
        color: COLORS.ledRed,
        active: isPrimary.button && outputState.buttonPressed,
        pulse: 1,
      };
    case "sensor/motion":
      return {
        color: COLORS.ledGreen,
        active: outputState.motionDetected,
        pulse,
      };
    case "sensor/temperature":
      return {
        color: COLORS.ledRed,
        active: outputState.sensorTemp !== null,
        pulse,
      };
    case "identity/weather":
      return {
        color: COLORS.ledBlue,
        active: outputState.weatherRain !== null,
        pulse,
      };
    default:
      return {
        color: COLORS.ledBlue,
        active: recipeActive && powered,
        pulse,
      };
  }
}

export function CubeNode({
  definition,
  x,
  y,
  draggable = false,
  isDropTarget = false,
  visualState,
  onDragStart,
  onDragMove,
  onDragEnd,
  onDblClick,
  onClick,
  opacity = 1,
  dragScale = 1,
  onDialChange,
  onSliderChange,
}: CubeNodeProps) {
  const { outputState, animTime, recipeActive, powered, inChain } = visualState;
  const id = definition.id;
  const showPowered = !inChain || powered;
  const targetOpacity = (inChain && !powered ? 0.35 : opacity) * (dragScale !== 1 ? 0.95 : 1);

  const displayOpacity = useRef(targetOpacity);
  const lastFrame = useRef(animTime);
  const dt = Math.min(50, animTime - lastFrame.current);
  lastFrame.current = animTime;
  displayOpacity.current = lerp(displayOpacity.current, targetOpacity, Math.min(1, dt / 300));

  const effects = useEffectTimestamps();

  const statusLed = getStatusLed(
    id,
    outputState,
    recipeActive,
    powered,
    inChain,
    animTime,
    {
      light: visualState.isPrimaryLight,
      chime: visualState.isPrimaryChime,
      music: visualState.isPrimaryMusic,
      button: visualState.isPrimaryButton,
      motion: id === "sensor/motion",
    },
  );

  const renderVisual = () => {
    if (inChain && !powered && id !== "core/core") return null;

    if (id === "output/light" && visualState.isPrimaryLight) {
      return (
        <LightVisual brightness={outputState.lightBrightness} animTime={animTime} />
      );
    }
    if (id === "control/dial" && visualState.isPrimaryDial && onDialChange) {
      return (
        <DialVisual
          dialPosition={outputState.dialPosition}
          onDialChange={onDialChange}
          animTime={animTime}
        />
      );
    }
    if (id === "control/slider" && visualState.isPrimarySlider && onSliderChange) {
      return (
        <SliderVisual
          position={outputState.sliderPosition}
          onChange={onSliderChange}
          animTime={animTime}
        />
      );
    }
    if (id === "control/button" && visualState.isPrimaryButton) {
      return (
        <ButtonVisual
          pressed={outputState.buttonPressed}
          animTime={animTime}
          buttonFiredAt={effects.buttonFiredAt}
        />
      );
    }
    if (id === "sensor/motion") {
      return (
        <MotionVisual
          motionDetected={outputState.motionDetected}
          animTime={animTime}
          motionFiredAt={effects.motionFiredAt}
        />
      );
    }
    if (id === "output/chime" && visualState.isPrimaryChime) {
      return (
        <ChimeVisual
          triggered={outputState.chimeTriggered}
          animTime={animTime}
          chimeCount={outputState.chimeCount}
          chimeFiredAt={effects.chimeFiredAt}
        />
      );
    }
    if (id === "output/music" && visualState.isPrimaryMusic) {
      return (
        <MusicVisual
          note={outputState.musicNote}
          velocity={outputState.musicVelocity}
          animTime={animTime}
          musicNoteFiredAt={effects.musicNoteFiredAt}
        />
      );
    }
    if (id === "output/display" && visualState.isPrimaryDisplay) {
      return (
        <DisplayVisual
          text={outputState.displayText}
          animTime={animTime}
          displayChangedAt={effects.displayChangedAt}
        />
      );
    }
    if (id === "sensor/temperature") {
      return (
        <TemperatureVisual temp={outputState.sensorTemp} animTime={animTime} />
      );
    }
    if (id === "identity/weather") {
      return (
        <WeatherVisual
          rain={outputState.weatherRain}
          temp={outputState.weatherTemp}
          animTime={animTime}
        />
      );
    }
    if (id === "source/time") {
      return <TimeVisual hour={outputState.timeHour} animTime={animTime} />;
    }
    if (id === "modifier/random") {
      return <RandomVisual animTime={animTime} active={recipeActive && powered} />;
    }
    if (id === "modifier/calm") {
      return <CalmVisual animTime={animTime} active={recipeActive && powered} />;
    }
    if (id === "source/github") {
      return (
        <GitHubVisual
          activity={outputState.githubActivity}
          animTime={animTime}
        />
      );
    }
    if (id === "core/core") {
      return (
        <CoreVisual
          animTime={animTime}
          powered={outputState.powered}
          debugOpen={visualState.debugOpen}
          poweredAt={effects.poweredAt}
        />
      );
    }
    if (definition.role === "place") {
      return <PassiveVisual active={recipeActive && powered} />;
    }
    return null;
  };

  return (
    <Group
      x={x}
      y={y}
      draggable={draggable}
      opacity={displayOpacity.current}
      scaleX={dragScale}
      scaleY={dragScale}
      onDragStart={onDragStart}
      onDragMove={(e) => {
        const node = e.target;
        onDragMove?.(node.x(), node.y());
      }}
      onDragEnd={(e) => {
        const node = e.target as Konva.Group;
        onDragEnd?.(node.x(), node.y(), node);
      }}
      onDblClick={onDblClick}
      onClick={onClick}
      onTap={onClick}
    >
      <BaseCubeShell
        definition={definition}
        highlighted={isDropTarget}
        unpowered={inChain && !showPowered}
        statusLedColor={statusLed.color}
        statusLedActive={statusLed.active}
        statusLedPulse={statusLed.pulse}
      >
        {renderVisual()}
      </BaseCubeShell>
    </Group>
  );
}
