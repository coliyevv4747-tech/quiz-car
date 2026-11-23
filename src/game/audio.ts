import { SoundSettings } from '../types/game';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private engineGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;

  private oscMain: OscillatorNode | null = null;
  private oscSub: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;

  private hornOsc1: OscillatorNode | null = null;
  private hornOsc2: OscillatorNode | null = null;
  private hornGain: GainNode | null = null;

  private skidGain: GainNode | null = null;
  private ambientSource: AudioBufferSourceNode | null = null;

  private settings: SoundSettings = {
    master: true,
    engine: true,
    sfx: true,
    ambient: true,
  };
  private initialized = false;
  private engineActive = false;

  public unlock(): void {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.engineGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.ambientGain = this.ctx.createGain();

      this.engineGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.ambientGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.setupEngineOscillators();
      this.setupSkidNoise();
      this.setupAmbientCity();
      this.initialized = true;
      this.applySettings();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  private setupEngineOscillators(): void {
    if (!this.ctx || !this.engineGain) return;
    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.value = 180;
    this.engineFilter.Q.value = 2.2;

    this.oscMain = this.ctx.createOscillator();
    this.oscMain.type = 'sawtooth';
    this.oscMain.frequency.value = 48;

    this.oscSub = this.ctx.createOscillator();
    this.oscSub.type = 'triangle';
    this.oscSub.frequency.value = 24;

    const mainLevel = this.ctx.createGain();
    mainLevel.gain.value = 0.25;
    const subLevel = this.ctx.createGain();
    subLevel.gain.value = 0.45;

    this.oscMain.connect(mainLevel);
    this.oscSub.connect(subLevel);
    mainLevel.connect(this.engineFilter);
    subLevel.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);

    this.oscMain.start();
    this.oscSub.start();
    this.engineGain.gain.value = 0;
  }

  private setupSkidNoise(): void {
    if (!this.ctx || !this.sfxGain) return;
    const bufferSize = this.ctx.sampleRate * 1.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1350;
    filter.Q.value = 5.5;

    this.skidGain = this.ctx.createGain();
    this.skidGain.gain.value = 0;

    noise.connect(filter);
    filter.connect(this.skidGain);
    this.skidGain.connect(this.sfxGain);
    noise.start();
  }

  private setupAmbientCity(): void {
    if (!this.ctx || !this.ambientGain) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 2.5;
    }

    this.ambientSource = this.ctx.createBufferSource();
    this.ambientSource.buffer = buffer;
    this.ambientSource.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 320;

    this.ambientSource.connect(filter);
    filter.connect(this.ambientGain);
    this.ambientSource.start();
  }

  public updateSettings(next: SoundSettings): void {
    this.settings = { ...next };
    this.applySettings();
  }

  private applySettings(): void {
    if (!this.initialized || !this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.settings.master ? 0.65 : 0, now, 0.05);
    }
    if (this.sfxGain) {
      this.sfxGain.gain.setTargetAtTime(this.settings.sfx ? 0.85 : 0, now, 0.05);
    }
    if (this.ambientGain) {
      this.ambientGain.gain.setTargetAtTime(
        this.settings.ambient && this.engineActive ? 0.14 : 0,
        now,
        0.15
      );
    }
    if (this.engineGain && (!this.settings.engine || !this.engineActive)) {
      this.engineGain.gain.setTargetAtTime(0, now, 0.06);
    }
  }

  public setDrivingActive(active: boolean): void {
    this.engineActive = active;
    if (!this.initialized || !this.ctx) return;
    const now = this.ctx.currentTime;
    if (!active) {
      this.engineGain?.gain.setTargetAtTime(0, now, 0.08);
      this.skidGain?.gain.setTargetAtTime(0, now, 0.05);
      this.ambientGain?.gain.setTargetAtTime(0, now, 0.12);
      this.setHorn(false);
    } else {
      this.applySettings();
    }
  }

  public updateEngine(rpmRatio: number, throttle: number, skidAmount: number): void {
    if (!this.initialized || !this.ctx || !this.engineActive) return;
    const now = this.ctx.currentTime;

    if (this.settings.engine && this.oscMain && this.oscSub && this.engineFilter && this.engineGain) {
      const clampedRpm = Math.max(0, Math.min(1, rpmRatio));
      const baseFreq = 42 + clampedRpm * 115 + throttle * 14;
      this.oscMain.frequency.setTargetAtTime(baseFreq, now, 0.04);
      this.oscSub.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.04);
      this.engineFilter.frequency.setTargetAtTime(160 + clampedRpm * 640 + throttle * 260, now, 0.05);
      this.engineGain.gain.setTargetAtTime(0.16 + throttle * 0.14 + clampedRpm * 0.08, now, 0.06);
    }

    if (this.skidGain) {
      const targetSkid = this.settings.sfx ? Math.max(0, Math.min(0.24, skidAmount * 0.24)) : 0;
      this.skidGain.gain.setTargetAtTime(targetSkid, now, 0.04);
    }
  }

  public setHorn(active: boolean): void {
    this.unlock();
    if (!this.initialized || !this.ctx || !this.sfxGain) return;
    if (!this.settings.master || !this.settings.sfx) active = false;

    const now = this.ctx.currentTime;
    if (active && !this.hornOsc1) {
      this.hornGain = this.ctx.createGain();
      this.hornGain.gain.setValueAtTime(0.001, now);
      this.hornGain.gain.exponentialRampToValueAtTime(0.22, now + 0.03);
      this.hornGain.connect(this.sfxGain);

      this.hornOsc1 = this.ctx.createOscillator();
      this.hornOsc1.type = 'sawtooth';
      this.hornOsc1.frequency.value = 392; // G4

      this.hornOsc2 = this.ctx.createOscillator();
      this.hornOsc2.type = 'sawtooth';
      this.hornOsc2.frequency.value = 493.88; // B4

      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 1600;

      this.hornOsc1.connect(lp);
      this.hornOsc2.connect(lp);
      lp.connect(this.hornGain);

      this.hornOsc1.start();
      this.hornOsc2.start();
    } else if (!active && this.hornOsc1 && this.hornGain) {
      const g = this.hornGain;
      const o1 = this.hornOsc1;
      const o2 = this.hornOsc2;
      this.hornOsc1 = null;
      this.hornOsc2 = null;
      this.hornGain = null;
      g.gain.setTargetAtTime(0.0001, now, 0.03);
      window.setTimeout(() => {
        try {
          o1.stop();
          o2?.stop();
          o1.disconnect();
          o2?.disconnect();
          g.disconnect();
        } catch {
          // ignore
        }
      }, 120);
    }
  }

  public playClick(): void {
    this.unlock();
    if (!this.initialized || !this.ctx || !this.sfxGain || !this.settings.sfx || !this.settings.master) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(640, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.045);
    g.gain.setValueAtTime(0.14, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.055);
  }

  public playGearShift(): void {
    this.unlock();
    if (!this.initialized || !this.ctx || !this.sfxGain || !this.settings.sfx || !this.settings.master) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.07);
    g.gain.setValueAtTime(0.2, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  public playCollision(intensity: number): void {
    if (!this.initialized || !this.ctx || !this.sfxGain || !this.settings.sfx || !this.settings.master) return;
    const now = this.ctx.currentTime;
    const clamped = Math.max(0.15, Math.min(1, intensity));
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(135, now);
    osc.frequency.exponentialRampToValueAtTime(34, now + 0.18);
    g.gain.setValueAtTime(0.42 * clamped, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.23);
  }

  public playCheckpoint(): void {
    if (!this.initialized || !this.ctx || !this.sfxGain || !this.settings.sfx || !this.settings.master) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25].forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      g.gain.setValueAtTime(0.18, now + idx * 0.08);
      g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.22);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.24);
    });
  }

  public playSuccess(): void {
    if (!this.initialized || !this.ctx || !this.sfxGain || !this.settings.sfx || !this.settings.master) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);
      g.gain.setValueAtTime(0.22, now + idx * 0.09);
      g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.35);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.38);
    });
  }
}

export const soundEngine = new SoundEngine();
