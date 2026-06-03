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
  const prevDialPosition = useRef(outputState.dialPosition);
  const prevLcdTexts = useRef(outputState.lcdTexts);
  const prevMusicNote = useRef<number | null>(null);
  const seenSignalIds = useRef(new Set<string>());

  const markChime = useEffectTimestamps((s) => s.markChime);
  const markButton = useEffectTimestamps((s) => s.markButton);
  const markMotion = useEffectTimestamps((s) => s.markMotion);
  const markLcdChange = useEffectTimestamps((s) => s.markLcdChange);
  const markMusicNote = useEffectTimestamps((s) => s.markMusicNote);
  const markPowered = useEffectTimestamps((s) => s.markPowered);

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
    if (
      Math.abs(outputState.dialPosition - prevDialPosition.current) > 0.015 &&
      outputState.powered
    ) {
      if (audioUnlocked && soundEnabled) simulationAudio.playDialTick();
    }
    prevDialPosition.current = outputState.dialPosition;
  }, [outputState.dialPosition, outputState.powered, audioUnlocked, soundEnabled]);

  useEffect(() => {
    if (outputState.motionDetected && !prevMotion.current) {
      markMotion();
      if (audioUnlocked && soundEnabled) simulationAudio.playMotionPing();
    }
    prevMotion.current = outputState.motionDetected;
  }, [outputState.motionDetected, audioUnlocked, soundEnabled, markMotion]);

  useEffect(() => {
    const serialized = JSON.stringify(outputState.lcdTexts);
    if (serialized !== JSON.stringify(prevLcdTexts.current)) {
      markLcdChange();
    }
    prevLcdTexts.current = outputState.lcdTexts;
  }, [outputState.lcdTexts, markLcdChange]);

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
