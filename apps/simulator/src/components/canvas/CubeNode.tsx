import { memo, useRef, type CSSProperties } from "react";
import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import type { CubeDefinition } from "@foundry/cube-defs";
import type { FoundryOutputState } from "@foundry/runtime";
import { BaseCubeShell } from "./cubes/BaseCubeShell";
import { CubeIcon } from "./cubes/CubeIcon";
import { LightVisual } from "./cubes/LightVisual";
import { WheelVisual } from "./cubes/WheelVisual";
import { MotionVisual } from "./cubes/MotionVisual";
import { ChimeVisual } from "./cubes/ChimeVisual";
import { WeatherVisual, weatherFooterLabel } from "./cubes/WeatherVisual";
import { CalmVisual } from "./cubes/CalmVisual";
import { GitHubVisual } from "./cubes/GitHubVisual";
import { CoreVisual } from "./cubes/CoreVisual";
import { ButtonVisual } from "./cubes/ButtonVisual";
import { SliderVisual } from "./cubes/SliderVisual";
import { MusicVisual } from "./cubes/MusicVisual";
import { LcdVisual } from "./cubes/LcdVisual";
import { TemperatureVisual } from "./cubes/TemperatureVisual";
import { TimeVisual, formatTimeDisplay } from "./cubes/TimeVisual";
import { RandomVisual } from "./cubes/RandomVisual";
import { COLORS, CUBE_ICON_BADGE_SIZE } from "./design-tokens";
import { CUBE_SIZE } from "./layout";
import { lerp } from "./animations";
import { EMPTY_EFFECT_TIMESTAMPS, type EffectTimestamps } from "./effect-timestamps";

export interface CubeVisualState {
  outputState: FoundryOutputState;
  animTime: number;
  recipeActive: boolean;
  powered: boolean;
  debugOpen: boolean;
  inChain: boolean;
  effectTimestamps?: EffectTimestamps;
  isPrimaryLight?: boolean;
  isPrimaryDial?: boolean;
  isPrimaryChime?: boolean;
  isPrimaryMusic?: boolean;
  lcdText?: string | null;
  isPrimaryButton?: boolean;
  isPrimarySlider?: boolean;
  isInactiveLight?: boolean;
  isInactiveMusic?: boolean;
  isInactiveChime?: boolean;
  dialHintPulse?: boolean;
}

interface CubeNodeProps {
  definition: CubeDefinition;
  visualState: CubeVisualState;
  isDropTarget?: boolean;
  dragScale?: number;
  opacity?: number;
  style?: CSSProperties;
  dragListeners?: SyntheticListenerMap;
  dragAttributes?: DraggableAttributes;
  onDblClick?: () => void;
  onClick?: () => void;
  onDialChange?: (value: number) => void;
  onSliderChange?: (value: number) => void;
  onHoverStart?: (definition: CubeDefinition, clientX: number, clientY: number) => void;
  onHoverEnd?: () => void;
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
        active: Boolean(isPrimary.light && outputState.lightBrightness > 0.1),
        pulse: outputState.lightBrightness,
      };
    case "output/chime":
      return {
        color: COLORS.ledPurple,
        active: Boolean(isPrimary.chime && outputState.chimeTriggered),
        pulse,
      };
    case "output/music":
      return {
        color: COLORS.ledBlue,
        active: Boolean(isPrimary.music && outputState.musicNote !== null),
        pulse,
      };
    case "control/button":
      return {
        color: COLORS.ledRed,
        active: Boolean(isPrimary.button && outputState.buttonPressed),
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

function CubeNodeInner({
  definition,
  isDropTarget = false,
  visualState,
  onDblClick,
  onClick,
  opacity = 1,
  dragScale = 1,
  style,
  dragListeners,
  dragAttributes,
  onDialChange,
  onSliderChange,
  onHoverStart,
  onHoverEnd,
}: CubeNodeProps) {
  const { outputState, animTime, recipeActive, powered, inChain } = visualState;
  const effects = visualState.effectTimestamps ?? EMPTY_EFFECT_TIMESTAMPS;
  const id = definition.id;
  const showPowered = !inChain || powered;
  const inactiveOutput =
    visualState.isInactiveLight === true ||
    visualState.isInactiveMusic === true ||
    visualState.isInactiveChime === true;
  const baseOpacity = inactiveOutput ? 0.42 : opacity;
  const targetOpacity = (inChain && !powered ? 0.35 : baseOpacity) * (dragScale !== 1 ? 0.95 : 1);

  const displayOpacity = useRef(targetOpacity);
  const lastFrame = useRef(animTime);
  const dt = Math.min(50, animTime - lastFrame.current);
  lastFrame.current = animTime;
  displayOpacity.current = lerp(displayOpacity.current, targetOpacity, Math.min(1, dt / 300));

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
    if (!inChain) return null;
    if (
      inChain &&
      !powered &&
      id !== "core/core" &&
      !(id === "identity/weather" && outputState.weatherFace)
    ) {
      return null;
    }

    if (id === "output/light") {
      if (visualState.isPrimaryLight) {
        return (
          <LightVisual
            brightness={outputState.lightBrightness}
            animTime={animTime}
            mood={outputState.lightMood}
          />
        );
      }
      return <LightVisual brightness={0.03} animTime={animTime} />;
    }
    if (id === "control/dial" && visualState.isPrimaryDial && onDialChange) {
      return (
        <WheelVisual
          dialPosition={outputState.dialPosition}
          onDialChange={onDialChange}
          animTime={animTime}
          hintPulse={visualState.dialHintPulse}
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
    if (id === "output/chime" && inChain && powered) {
      return (
        <ChimeVisual
          triggered={
            visualState.isPrimaryChime ? outputState.chimeTriggered : false
          }
          animTime={animTime}
          chimeCount={visualState.isPrimaryChime ? outputState.chimeCount : 0}
          chimeFiredAt={effects.chimeFiredAt}
        />
      );
    }
    if (id === "output/music" && inChain && powered) {
      return (
        <MusicVisual
          note={visualState.isPrimaryMusic ? outputState.musicNote : null}
          velocity={visualState.isPrimaryMusic ? outputState.musicVelocity : null}
          animTime={animTime}
          musicNoteFiredAt={effects.musicNoteFiredAt}
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
          face={outputState.weatherFace}
          rain={outputState.weatherRain}
          animTime={animTime}
        />
      );
    }
    if (id === "source/time") {
      return <TimeVisual hour={outputState.timeHour} animTime={animTime} />;
    }
    if (id === "modifier/random") {
      return (
        <RandomVisual
          animTime={animTime}
          active={recipeActive && powered}
          noiseValue={outputState.modifierRandom}
        />
      );
    }
    if (id === "modifier/calm") {
      return (
        <CalmVisual
          animTime={animTime}
          active={recipeActive && powered}
          noiseValue={outputState.modifierCalmNoise}
        />
      );
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
    // if (definition.role === "place") {
    //   return (
    //     <PassiveVisual
    //       active={recipeActive && powered}
    //       accent={definition.colorAccent}
    //       cubeId={definition.id}
    //     />
    //   );
    // }
    return null;
  };

  const buildStateSlot = () => {
    if (!inChain) return null;
    if (inChain && !powered && id !== "core/core") return null;

    if (id === "output/lcd" && visualState.lcdText != null) {
      return (
        <LcdVisual
          text={visualState.lcdText}
          animTime={animTime}
          lcdChangedAt={effects.lcdChangedAt}
        />
      );
    }

    const visual = renderVisual();
    if (!visual) return null;

    if (["identity/weather", "source/time"].includes(id)) {
      return visual;
    }

    return (
      <svg
        width={CUBE_SIZE}
        height={CUBE_SIZE}
        viewBox={`0 0 ${CUBE_SIZE} ${CUBE_SIZE}`}
        className="relative z-10 block h-full w-full max-h-full max-w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {visual}
      </svg>
    );
  };

  const stateSlot = buildStateSlot();
  const identityFooter =
    id === "identity/weather"
      ? weatherFooterLabel(
          animTime,
          outputState.weatherTemp,
          outputState.weatherRain,
          outputState.weatherFace,
          definition.label,
        )
      : id === "source/time"
        ? outputState.timeHour != null
          ? formatTimeDisplay(outputState.timeHour)
          : definition.label
        : ["identity/london", "identity/tokyo", "identity/foundry"].includes(id)
          ? definition.label
          : null;
  const iconSlot = stateSlot ? null : (
    <CubeIcon
      cubeId={definition.id}
      accent={COLORS.ink}
      unpowered={inChain && !showPowered}
    />
  );
  const badgeSlot =
    stateSlot && inChain ? (
      <CubeIcon
        cubeId={definition.id}
        accent={definition.colorAccent}
        unpowered={inChain && !showPowered}
        size={CUBE_ICON_BADGE_SIZE}
        strokeWidth={1.75}
      />
    ) : null;

  return (
    <div
      {...dragAttributes}
      {...dragListeners}
      style={{
        width: id === "output/lcd" ? CUBE_SIZE * 2 : CUBE_SIZE,
        height: CUBE_SIZE,
        opacity: displayOpacity.current,
        transform: `scale(${dragScale})`,
        outline: isDropTarget ? `2px solid ${COLORS.ink}` : undefined,
        outlineOffset: 2,
        borderRadius: inChain ? 8 : 6,
        touchAction: "none",
        cursor: dragListeners ? "grab" : undefined,
        ...style,
      }}
      onDoubleClick={onDblClick}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (!onHoverStart) return;
        const rect = e.currentTarget.getBoundingClientRect();
        onHoverStart(definition, rect.left + CUBE_SIZE / 2, rect.top);
      }}
      onMouseLeave={() => onHoverEnd?.()}
    >
      <BaseCubeShell
        definition={definition}
        highlighted={isDropTarget}
        unpowered={inChain && !showPowered}
        inChain={inChain}
        statusLedColor={statusLed.color}
        statusLedActive={statusLed.active}
        statusLedPulse={statusLed.pulse}
        iconSlot={iconSlot}
        badgeSlot={badgeSlot}
        stateSlot={stateSlot}
        identityFooter={identityFooter}
        width={id === "output/lcd" ? CUBE_SIZE * 2 : CUBE_SIZE}
      />
    </div>
  );
}

export const CubeNode = memo(CubeNodeInner, (prev, next) => {
  if (!next.visualState.inChain) {
    return (
      prev.definition.id === next.definition.id &&
      prev.dragScale === next.dragScale &&
      prev.opacity === next.opacity &&
      prev.visualState === next.visualState
    );
  }
  return false;
});
