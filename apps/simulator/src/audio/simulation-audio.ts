import { midiToFreq } from "./midi-to-freq";

const MUTE_KEY = "foundry-sound-muted";

class SimulationAudio {
  private ctx: AudioContext | null = null;
  private muted = false;
  private unlocked = false;

  constructor() {
    try {
      this.muted = sessionStorage.getItem(MUTE_KEY) === "true";
    } catch {
      this.muted = false;
    }
  }

  isUnlocked(): boolean {
    return this.unlocked;
  }

  isMuted(): boolean {
    return this.muted;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    try {
      sessionStorage.setItem(MUTE_KEY, String(muted));
    } catch {
      // ignore
    }
  }

  async unlock(): Promise<boolean> {
    if (this.unlocked) return true;
    try {
      if (!this.ctx) {
        this.ctx = new AudioContext();
      }
      if (this.ctx.state === "suspended") {
        await this.ctx.resume();
      }
      this.unlocked = true;
      return true;
    } catch {
      return false;
    }
  }

  private getCtx(): AudioContext | null {
    if (!this.unlocked || this.muted || !this.ctx) return null;
    return this.ctx;
  }

  private now(): number {
    return this.ctx?.currentTime ?? 0;
  }

  playChime(chimeCount = 0): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = this.now();
    const pitch = [880, 988, 784][chimeCount % 3];

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    osc1.type = "sine";
    osc2.type = "sine";
    osc1.frequency.value = pitch;
    osc2.frequency.value = pitch * 2.01;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.35, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.6);
    osc2.stop(t + 0.6);
  }

  playButtonClick(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = this.now();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.type = "square";
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.03);
    filter.type = "highpass";
    filter.frequency.value = 800;
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  playMotionPing(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = this.now();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(900, t + 0.04);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.2, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  playMusicNote(note: number, velocity = 64): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = this.now();
    const freq = midiToFreq(note);
    const vol = Math.max(0.05, Math.min(0.35, velocity / 127));

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  playConnectSnap(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = this.now();
    const bufferSize = ctx.sampleRate * 0.06;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.12, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);

    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 120;
    oscGain.gain.setValueAtTime(0.15, t);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);

    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    noise.start(t);
    osc.start(t);
    noise.stop(t + 0.07);
    osc.stop(t + 0.07);
  }

  playPowerOn(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = this.now();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.linearRampToValueAtTime(120, t + 0.15);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.08, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.3);
  }
}

export const simulationAudio = new SimulationAudio();
