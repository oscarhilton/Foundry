import { create } from "zustand";

export interface EffectTimestamps {
  chimeFiredAt: number;
  buttonFiredAt: number;
  motionFiredAt: number;
  lcdChangedAt: number;
  musicNoteFiredAt: number;
  lastMusicNote: number | null;
  poweredAt: number;
}

export const EMPTY_EFFECT_TIMESTAMPS: EffectTimestamps = {
  chimeFiredAt: 0,
  buttonFiredAt: 0,
  motionFiredAt: 0,
  lcdChangedAt: 0,
  musicNoteFiredAt: 0,
  lastMusicNote: null,
  poweredAt: 0,
};

interface EffectTimestampState extends EffectTimestamps {
  markChime: () => void;
  markButton: () => void;
  markMotion: () => void;
  markLcdChange: () => void;
  markMusicNote: (note: number) => void;
  markPowered: () => void;
}

const now = () => performance.now();

export const useEffectTimestamps = create<EffectTimestampState>((set) => ({
  chimeFiredAt: 0,
  buttonFiredAt: 0,
  motionFiredAt: 0,
  lcdChangedAt: 0,
  musicNoteFiredAt: 0,
  lastMusicNote: null,
  poweredAt: 0,

  markChime: () => set({ chimeFiredAt: now() }),
  markButton: () => set({ buttonFiredAt: now() }),
  markMotion: () => set({ motionFiredAt: now() }),
  markLcdChange: () => set({ lcdChangedAt: now() }),
  markMusicNote: (note) =>
    set({ musicNoteFiredAt: now(), lastMusicNote: note }),
  markPowered: () => set({ poweredAt: now() }),
}));
