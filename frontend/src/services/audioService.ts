import type { SoundId } from '@/types';

// Modular audio service using Web Audio API to generate
// procedural ambient sounds (no external audio files needed).
// This is a placeholder system — real audio assets can be
// dropped in later by replacing the tone generators.

type AudioSource = AudioBufferSourceNode | OscillatorNode;
type AudioInstance = {
  gainNode: GainNode;
  sources: AudioSource[];
  volume: number; // 0-100
  enabled: boolean;
};

class AudioService {
  private ctx: AudioContext | null = null;
  private instances: Map<SoundId, AudioInstance> = new Map();
  private masterGain: GainNode | null = null;
  private masterVolume = 70;
  private muted = false;

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : this.masterVolume / 100;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Generate a noise buffer for white/brown/pink noise
  private createNoiseBuffer(ctx: AudioContext, type: 'white' | 'brown' | 'pink'): AudioBuffer {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    if (type === 'white') {
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    } else if (type === 'brown') {
      let last = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 3.5;
      }
    } else {
      // pink noise (approximation)
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99765 * b0 + white * 0.099046;
        b1 = 0.96300 * b1 + white * 0.2965164;
        b2 = 0.57000 * b2 + white * 1.0526913;
        data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.18;
      }
    }
    return buffer;
  }

  // Create a looping tone with slight frequency variation
  private createTone(ctx: AudioContext, freq: number, type: OscillatorType = 'sine'): OscillatorNode {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    return osc;
  }

  private createSoundSource(soundId: SoundId): { sources: AudioSource[]; gainNode: GainNode } | null {
    if (!this.ctx || !this.masterGain) return null;
    const ctx = this.ctx;
    const gainNode = ctx.createGain();
    gainNode.gain.value = 0;
    gainNode.connect(this.masterGain);

    const noiseSounds: Record<string, 'white' | 'brown' | 'pink'> = {
      whiteNoise: 'white',
      brownNoise: 'brown',
      pinkNoise: 'pink',
    };

    if (noiseSounds[soundId]) {
      const buffer = this.createNoiseBuffer(ctx, noiseSounds[soundId]);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(gainNode);
      source.start();
      return { sources: [source], gainNode };
    }

    // For other sounds, use filtered noise or oscillators as placeholders
    // Rain/thunderstorm/ocean/stream/wind — filtered noise
    const natureSounds: Record<string, { filterFreq: number; filterType: BiquadFilterType; q: number }> = {
      rain: { filterFreq: 1200, filterType: 'lowpass', q: 0.5 },
      thunderstorm: { filterFreq: 200, filterType: 'lowpass', q: 0.3 },
      ocean: { filterFreq: 400, filterType: 'lowpass', q: 0.7 },
      stream: { filterFreq: 800, filterType: 'lowpass', q: 0.5 },
      wind: { filterFreq: 600, filterType: 'lowpass', q: 0.3 },
      night: { filterFreq: 300, filterType: 'lowpass', q: 0.4 },
    };

    if (natureSounds[soundId]) {
      const cfg = natureSounds[soundId];
      const buffer = this.createNoiseBuffer(ctx, 'white');
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = cfg.filterType;
      filter.frequency.value = cfg.filterFreq;
      filter.Q.value = cfg.q;

      source.connect(filter);
      filter.connect(gainNode);
      source.start();
      return { sources: [source], gainNode };
    }

    // Birds — random chirp-like tones
    if (soundId === 'birds') {
      const buffer = this.createNoiseBuffer(ctx, 'white');
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 2500;
      filter.Q.value = 5;
      source.connect(filter);
      filter.connect(gainNode);
      source.start();
      return { sources: [source], gainNode };
    }

    // Cafe, keyboard, library, train, fireplace — low rumble + random
    const ambientSounds: Record<string, { filterFreq: number; filterType: BiquadFilterType }> = {
      cafe: { filterFreq: 500, filterType: 'lowpass' },
      keyboard: { filterFreq: 3000, filterType: 'highpass' },
      library: { filterFreq: 200, filterType: 'lowpass' },
      train: { filterFreq: 150, filterType: 'lowpass' },
      fireplace: { filterFreq: 800, filterType: 'lowpass' },
    };

    if (ambientSounds[soundId]) {
      const cfg = ambientSounds[soundId];
      const buffer = this.createNoiseBuffer(ctx, soundId === 'fireplace' ? 'brown' : 'white');
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = cfg.filterType;
      filter.frequency.value = cfg.filterFreq;
      source.connect(filter);
      filter.connect(gainNode);
      source.start();
      return { sources: [source], gainNode };
    }

    // Lo-fi — soft chord-like tones
    if (soundId === 'lofi') {
      const osc1 = this.createTone(ctx, 220, 'sine');
      const osc2 = this.createTone(ctx, 277, 'sine');
      const osc3 = this.createTone(ctx, 330, 'triangle');
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      osc3.connect(gainNode);
      osc1.start();
      osc2.start();
      osc3.start();
      return { sources: [osc1, osc2, osc3], gainNode };
    }

    return null;
  }

  play(soundId: SoundId, volume = 50): void {
    if (this.instances.has(soundId)) {
      this.setVolume(soundId, volume);
      this.instances.get(soundId)!.enabled = true;
      this.applyVolume(soundId);
      return;
    }

    this.ensureContext();
    const result = this.createSoundSource(soundId);
    if (!result) return;

    this.instances.set(soundId, {
      gainNode: result.gainNode,
      sources: result.sources,
      volume,
      enabled: true,
    });
    this.applyVolume(soundId);
  }

  pause(soundId: SoundId): void {
    const inst = this.instances.get(soundId);
    if (inst) {
      inst.enabled = false;
      this.applyVolume(soundId);
    }
  }

  stop(soundId: SoundId): void {
    const inst = this.instances.get(soundId);
    if (inst) {
      for (const source of inst.sources) {
        try { source.stop(); } catch {}
      }
      this.instances.delete(soundId);
    }
  }

  toggle(soundId: SoundId, volume = 50): boolean {
    const inst = this.instances.get(soundId);
    if (inst && inst.enabled) {
      this.pause(soundId);
      return false;
    } else {
      this.play(soundId, volume);
      return true;
    }
  }

  setVolume(soundId: SoundId, volume: number): void {
    const inst = this.instances.get(soundId);
    if (inst) {
      inst.volume = Math.max(0, Math.min(100, volume));
      this.applyVolume(soundId);
    }
  }

  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(100, volume));
    if (this.masterGain && !this.muted) {
      this.masterGain.gain.value = this.masterVolume / 100;
    }
  }

  muteAll(): void {
    this.muted = true;
    if (this.masterGain) this.masterGain.gain.value = 0;
  }

  unmuteAll(): void {
    this.muted = false;
    if (this.masterGain) this.masterGain.gain.value = this.masterVolume / 100;
  }

  stopAll(): void {
    for (const soundId of Array.from(this.instances.keys())) {
      this.stop(soundId);
    }
  }

  fadeIn(soundId: SoundId, duration = 500): void {
    const inst = this.instances.get(soundId);
    if (!inst || !this.ctx) return;
    const targetVol = (inst.volume / 100) * (this.muted ? 0 : this.masterVolume / 100);
    inst.gainNode.gain.cancelScheduledValues(this.ctx.currentTime);
    inst.gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
    inst.gainNode.gain.linearRampToValueAtTime(targetVol, this.ctx.currentTime + duration / 1000);
  }

  fadeOut(soundId: SoundId, duration = 500): void {
    const inst = this.instances.get(soundId);
    if (!inst || !this.ctx) return;
    inst.gainNode.gain.cancelScheduledValues(this.ctx.currentTime);
    inst.gainNode.gain.setValueAtTime(inst.gainNode.gain.value, this.ctx.currentTime);
    inst.gainNode.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration / 1000);
  }

  private applyVolume(soundId: SoundId): void {
    const inst = this.instances.get(soundId);
    if (!inst || !this.ctx) return;
    const effective = inst.enabled ? (inst.volume / 100) * (this.muted ? 0 : this.masterVolume / 100) : 0;
    inst.gainNode.gain.setTargetAtTime(effective, this.ctx.currentTime, 0.05);
  }

  isPlaying(soundId: SoundId): boolean {
    const inst = this.instances.get(soundId);
    return !!inst && inst.enabled;
  }

  getVolume(soundId: SoundId): number {
    return this.instances.get(soundId)?.volume ?? 50;
  }
}

export const audioService = new AudioService();
