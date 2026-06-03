import { useEffect, useRef } from "react";
import { simulationAudio } from "../audio/simulation-audio";
import { useSimulatorStore } from "../store";
import { useEffectTimestamps } from "./canvas/effect-timestamps";

export function SimulationAudioBridge() {
  const signalLog = useSimulatorStore((s) => s.signalLog);
  const outputState = useSimulatorStore((s) => s.outputState);
  const layoutVersion = useSimulatorStore((s) => s.layoutVersion);
  const audioUnlocked = useSimulatorStore((s) => s.audioUnlocked);
  const soundEnabled = useSimulatorStore((s) => s.soundEnabled);
  const setAudioUnlocked = useSimulatorStore((s) => s.setAudioUnlocked);

  const prevLayoutVersion = useRef(layoutVersion);
  const prevPowered = useRef(outputState.powered);
  const prevMotion = useRef(outputState.motionDetected);
  const prevDisplayText = useRef(outputState.displayText);
  const prevLcdText = useRef(outputState.lcdText);
  const prevMusicNote = useRef<number | null>(null);
  const seenSignalIds = useRef(new Set<string>());

  const {
    markChime,
    markButton,
    markMotion,
    markDisplayChange,
    markLcdChange,
    markMusicNote,
    markPowered,
  } = useEffectTimestamps();

  useEffect(() => {
    const unlock = async () => {
      const ok = await simulationAudio.unlock();
      if (ok) setAudioUnlocked(true);
    };

    const onGesture = () => {
      void unlock();
    };

    document.addEventListener("pointerdown", onGesture, { once: true });
    document.addEventListener("keydown", onGesture, { once: true });
    return () => {
      document.removeEventListener("pointerdown", onGesture);
      document.removeEventListener("keydown", onGesture);
    };
  }, [setAudioUnlocked]);

  useEffect(() => {
    if (layoutVersion !== prevLayoutVersion.current) {
      prevLayoutVersion.current = layoutVersion;
      if (audioUnlocked && soundEnabled) simulationAudio.playConnectSnap();
    }
  }, [layoutVersion, audioUnlocked, soundEnabled]);

  useEffect(() => {
    if (outputState.powered && !prevPowered.current) {
      markPowered();
      if (audioUnlocked && soundEnabled) simulationAudio.playPowerOn();
    }
    prevPowered.current = outputState.powered;
  }, [outputState.powered, audioUnlocked, soundEnabled, markPowered]);

  useEffect(() => {
    if (outputState.motionDetected && !prevMotion.current) {
      markMotion();
      if (audioUnlocked && soundEnabled) simulationAudio.playMotionPing();
    }
    prevMotion.current = outputState.motionDetected;
  }, [outputState.motionDetected, audioUnlocked, soundEnabled, markMotion]);

  useEffect(() => {
    if (outputState.displayText !== prevDisplayText.current) {
      markDisplayChange();
    }
    prevDisplayText.current = outputState.displayText;
  }, [outputState.displayText, markDisplayChange]);

  useEffect(() => {
    if (outputState.lcdText !== prevLcdText.current) {
      markLcdChange();
    }
    prevLcdText.current = outputState.lcdText;
  }, [outputState.lcdText, markLcdChange]);

  useEffect(() => {
    const note = outputState.musicNote;
    if (
      outputState.powered &&
      note !== null &&
      note !== prevMusicNote.current
    ) {
      markMusicNote(note);
      if (audioUnlocked && soundEnabled) {
        simulationAudio.playMusicNote(note, outputState.musicVelocity ?? 64);
      }
    }
    prevMusicNote.current = note;
  }, [
    outputState.musicNote,
    outputState.musicVelocity,
    outputState.powered,
    audioUnlocked,
    soundEnabled,
    markMusicNote,
  ]);

  useEffect(() => {
    const newest = signalLog[0];
    if (!newest) return;

    const key = `${newest.ts}-${newest.topic}-${String(newest.value)}`;
    if (seenSignalIds.current.has(key)) return;
    seenSignalIds.current.add(key);
    if (seenSignalIds.current.size > 300) {
      const entries = [...seenSignalIds.current];
      seenSignalIds.current = new Set(entries.slice(-150));
    }

    if (!audioUnlocked || !soundEnabled) return;

    switch (newest.topic) {
      case "output/chime/trigger":
        markChime();
        simulationAudio.playChime(outputState.chimeCount);
        break;
      case "control/button/press":
        markButton();
        simulationAudio.playButtonClick();
        break;
      default:
        break;
    }
  }, [signalLog, audioUnlocked, soundEnabled, outputState.chimeCount, markChime, markButton]);

  return null;
}
