/**
 * Sound Engine for Army Kids Adventure
 * Built with Web Audio API for zero-latency, 100% offline, kid-friendly sound effects
 * and cheerful procedural background music.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isSoundMuted: boolean = false;
  private isMusicMuted: boolean = false;
  private soundVolume: number = 0.8;
  private musicVolume: number = 0.5;
  private musicInterval: number | null = null;
  private musicStep: number = 0;
  private isMusicPlaying: boolean = false;

  private initCtx(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setSoundMuted(muted: boolean) {
    this.isSoundMuted = muted;
  }

  public setMusicMuted(muted: boolean) {
    this.isMusicMuted = muted;
    if (muted) {
      this.stopMusic();
    } else {
      this.startMusic();
    }
  }

  public setSoundVolume(vol: number) {
    this.soundVolume = Math.max(0, Math.min(1, vol));
  }

  public setMusicVolume(vol: number) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
  }

  public playJump() {
    if (this.isSoundMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(450, ctx.currentTime + 0.16);

      gain.gain.setValueAtTime(0.25 * this.soundVolume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } catch {
      // Audio safety fallback
    }
  }

  public playCoin() {
    if (this.isSoundMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(987.77, now); // B5
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1318.51, now + 0.08); // E6

      gain.gain.setValueAtTime(0.25 * this.soundVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.08);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.28);
    } catch {}
  }

  public playStar() {
    if (this.isSoundMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0.18 * this.soundVolume, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.18);
      });
    } catch {}
  }

  public playPop() {
    if (this.isSoundMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);

      gain.gain.setValueAtTime(0.3 * this.soundVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch {}
  }

  public playCardFlip() {
    if (this.isSoundMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.06);

      gain.gain.setValueAtTime(0.15 * this.soundVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.07);
    } catch {}
  }

  public playSnap() {
    if (this.isSoundMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);

      gain.gain.setValueAtTime(0.2 * this.soundVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch {}
  }

  public playVictory() {
    if (this.isSoundMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Joyful cartoon fanfare notes (C4, E4, G4, C5, E5)
      const melody = [
        { f: 261.63, t: 0.0, d: 0.12 },
        { f: 329.63, t: 0.12, d: 0.12 },
        { f: 392.0, t: 0.24, d: 0.14 },
        { f: 523.25, t: 0.38, d: 0.25 },
        { f: 659.25, t: 0.64, d: 0.4 },
      ];

      melody.forEach((note) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.f, now + note.t);

        gain.gain.setValueAtTime(0.3 * this.soundVolume, now + note.t);
        gain.gain.exponentialRampToValueAtTime(0.001, now + note.t + note.d);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + note.t);
        osc.stop(now + note.t + note.d);
      });
    } catch {}
  }

  public playTryAgain() {
    if (this.isSoundMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Gentle, friendly bouncy cartoon boing (never harsh or scary)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.2);

      gain.gain.setValueAtTime(0.2 * this.soundVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {}
  }

  public startMusic() {
    if (this.isMusicPlaying || this.isMusicMuted) return;
    this.isMusicPlaying = true;

    // Cheerful cartoon camp rhythm (Major Pentatonic in C: C, D, E, G, A)
    const pattern = [
      261.63, 0, 329.63, 392.0, 440.0, 392.0, 329.63, 0,
      293.66, 0, 329.63, 392.0, 523.25, 440.0, 392.0, 0,
    ];

    const bassPattern = [
      130.81, 130.81, 196.0, 130.81, 146.83, 146.83, 196.0, 146.83,
    ];

    const stepDuration = 220; // ms per beat

    this.musicInterval = window.setInterval(() => {
      if (this.isMusicMuted || !this.isMusicPlaying) return;
      const ctx = this.initCtx();
      if (!ctx || ctx.state === 'suspended') return;

      try {
        const now = ctx.currentTime;
        const noteFreq = pattern[this.musicStep % pattern.length];
        const bassFreq = bassPattern[Math.floor((this.musicStep % 16) / 2)];

        if (noteFreq > 0) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(noteFreq, now);

          gain.gain.setValueAtTime(0.08 * this.musicVolume, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 0.18);
        }

        // Subdued marimba bass pulse
        if (this.musicStep % 2 === 0 && bassFreq > 0) {
          const bassOsc = ctx.createOscillator();
          const bassGain = ctx.createGain();
          bassOsc.type = 'triangle';
          bassOsc.frequency.setValueAtTime(bassFreq, now);

          bassGain.gain.setValueAtTime(0.06 * this.musicVolume, now);
          bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

          bassOsc.connect(bassGain);
          bassGain.connect(ctx.destination);

          bassOsc.start(now);
          bassOsc.stop(now + 0.22);
        }

        this.musicStep = (this.musicStep + 1) % pattern.length;
      } catch {}
    }, stepDuration);
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval !== null) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}

export const sound = new SoundEngine();
