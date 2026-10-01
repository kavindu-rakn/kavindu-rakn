/**
 * Generative Ambient Soundscape & Interactive Micro-Haptics
 * - Ambient music button ONLY controls background generative music.
 * - Interactive micro-haptic clicks are ALWAYS active and responsive.
 * - Ambient music is genuinely serene, warm, tape-filtered ambient chords (Eno / Yoshimura style).
 */

class AudioSynthesizer {
  private ctx: AudioContext | null = null;
  private ambientEnabled: boolean = false;
  private ambientTimer: ReturnType<typeof setTimeout> | null = null;
  private isAmbientPlaying: boolean = false;
  private activeVoices: { osc: OscillatorNode; gain: GainNode }[] = [];
  // Browsers refuse to start audio before a user gesture and log a warning if
  // asked to. Nothing creates an AudioContext until this flips.
  private unlocked = false;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.ambientEnabled = localStorage.getItem('ambient-music-enabled') === 'true';
      } catch {
        this.ambientEnabled = false;
      }

      // Unlock Web Audio on the first real gesture.
      const unlockAudio = () => {
        this.unlocked = true;
        this.initCtx();
        if (this.ambientEnabled && !this.isAmbientPlaying) {
          this.startAmbient();
        }
        window.removeEventListener('pointerdown', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
      };

      window.addEventListener('pointerdown', unlockAudio, { passive: true, once: true });
      window.addEventListener('keydown', unlockAudio, { passive: true, once: true });
    }
  }

  public isAmbientEnabled(): boolean {
    return this.ambientEnabled;
  }

  private initCtx(): boolean {
    if (typeof window === 'undefined' || !this.unlocked) return false;

    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return false;
      this.ctx = new AudioCtx();
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => { });
    }

    return this.ctx.state === 'running' || this.ctx.state === 'suspended';
  }

  /**
   * Sound toggle controls ONLY the background ambient music
   */
  public toggleAmbient(): boolean {
    this.ambientEnabled = !this.ambientEnabled;
    this.unlocked = true; // toggling is itself a click
    try {
      localStorage.setItem('ambient-music-enabled', String(this.ambientEnabled));
    } catch {}

    if (this.ambientEnabled) {
      this.initCtx();
      this.startAmbient();
      // Gentle confirmation tone
      this.playTone(523.25, 0.12, 'sine', 0.015);
    } else {
      this.stopAmbient();
    }

    return this.ambientEnabled;
  }

  /**
   * Generative Calm Ambient Music (Brian Eno / Japanese Minimalist Ambient)
   * Warm, soft acoustic-like sine chords with slow 3s attack and 5s decay.
   * Gentle, serene, non-intrusive (F major / D minor pentatonic).
   */
  public startAmbient() {
    if (!this.ambientEnabled || this.isAmbientPlaying || !this.initCtx() || !this.ctx) return;
    this.isAmbientPlaying = true;
    this.scheduleNextAmbientChord();
  }

  private scheduleNextAmbientChord() {
    if (!this.ambientEnabled || !this.isAmbientPlaying) return;

    this.playAmbientChord();

    // Random relaxed spacing between chord swells (every 6 to 9 seconds)
    const nextInterval = 6500 + Math.random() * 3000;
    this.ambientTimer = setTimeout(() => {
      if (this.ambientEnabled && this.isAmbientPlaying) {
        this.scheduleNextAmbientChord();
      }
    }, nextInterval);
  }

  private playAmbientChord() {
    if (!this.ambientEnabled || !this.ctx || this.ctx.state !== 'running') return;

    try {
      const now = this.ctx.currentTime;

      // Soft, meditative chord clusters in F-major / D-minor
      const chordPalettes = [
        [174.61, 261.63, 329.63], // F3, C4, E4 (Fmaj7)
        [220.00, 261.63, 392.00], // A3, C4, G4 (Am7)
        [196.00, 293.66, 349.23], // G3, D4, F4 (G7sus)
        [146.83, 220.00, 261.63], // D3, A3, C4 (Dm7)
        [174.61, 220.00, 329.63, 392.00], // F3, A3, E4, G4 (Fmaj9)
      ];

      const chord = chordPalettes[Math.floor(Math.random() * chordPalettes.length)];

      // Warm tape filter (lowpass at 320Hz to eliminate all harshness)
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, now);
      filter.Q.setValueAtTime(1.0, now);

      const masterGain = this.ctx.createGain();
      // Very soft, relaxing volume
      masterGain.gain.setValueAtTime(0.0001, now);
      masterGain.gain.setTargetAtTime(0.014, now, 1.8); // 3-second gentle swell
      masterGain.gain.setTargetAtTime(0.0001, now + 3.5, 2.2); // long soothing release

      filter.connect(masterGain);
      masterGain.connect(this.ctx.destination);

      chord.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const voiceGain = this.ctx.createGain();

        // Slight micro-detune for organic warmth
        const detune = (idx - 1) * 3 + (Math.random() - 0.5) * 2;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        osc.detune.setValueAtTime(detune, now);

        voiceGain.gain.setValueAtTime(0.25 / chord.length, now);

        osc.connect(voiceGain);
        voiceGain.connect(filter);

        osc.start(now);
        osc.stop(now + 9.0);

        this.activeVoices.push({ osc, gain: voiceGain });
      });

      // Cleanup finished voices
      setTimeout(() => {
        this.activeVoices = this.activeVoices.filter(v => {
          try {
            v.osc.disconnect();
            v.gain.disconnect();
          } catch { }
          return false;
        });
      }, 9500);

    } catch { }
  }

  public stopAmbient() {
    if (!this.isAmbientPlaying) return;

    if (this.ambientTimer) {
      clearTimeout(this.ambientTimer);
      this.ambientTimer = null;
    }

    this.activeVoices.forEach(v => {
      try {
        if (this.ctx) {
          v.gain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.4);
          v.osc.stop(this.ctx.currentTime + 0.5);
        }
      } catch { }
    });

    this.activeVoices = [];
    this.isAmbientPlaying = false;
  }

  /**
   * Micro-Haptic Click - ALWAYS ACTIVE regardless of ambient music toggle
   */
  public playClick(freq = 1200, duration = 0.02, volume = 0.018) {
    this.initCtx();
    if (!this.ctx || this.ctx.state !== 'running') return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'highpass';
      filter.frequency.setValueAtTime(600, now);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.setTargetAtTime(freq * 0.35, now, 0.01);

      gain.gain.setValueAtTime(volume, now);
      gain.gain.setTargetAtTime(0.0001, now + 0.005, 0.015);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration + 0.05);
    } catch { }
  }

  /**
   * Micro-Haptic Tone - ALWAYS ACTIVE regardless of ambient music toggle
   */
  public playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.02) {
    this.initCtx();
    if (!this.ctx || this.ctx.state !== 'running') return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(volume, now);
      gain.gain.setTargetAtTime(0.0001, now + duration * 0.5, duration * 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration + 0.05);
    } catch { }
  }
}

export const sound = new AudioSynthesizer();
