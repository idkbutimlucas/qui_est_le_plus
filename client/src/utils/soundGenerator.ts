// Générateur de sons synthétisés avec Web Audio API
// Évite d'avoir à charger des fichiers audio externes

export type SoundType =
  | 'join'          // Rejoindre une room
  | 'vote'          // Vote enregistré
  | 'tick'          // Timer tick (dernières secondes)
  | 'reveal'        // Révélation des votes
  | 'winner'        // Résultats/gagnant
  | 'error'         // Erreur
  | 'click'         // Click interface
  | 'whoosh'        // Transition
  | 'countdown';    // Countdown 3-2-1

class SoundGenerator {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initAudioContext();
    }
  }

  private initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  private ensureAudioContext() {
    if (!this.audioContext) {
      this.initAudioContext();
    }
    // Resume context if suspended (autoplay policy)
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  setVolume(volume: number) {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  play(type: SoundType) {
    this.ensureAudioContext();
    if (!this.audioContext || !this.masterGain) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    switch (type) {
      case 'join':
        this.playJoinSound(ctx, now);
        break;
      case 'vote':
        this.playVoteSound(ctx, now);
        break;
      case 'tick':
        this.playTickSound(ctx, now);
        break;
      case 'reveal':
        this.playRevealSound(ctx, now);
        break;
      case 'winner':
        this.playWinnerSound(ctx, now);
        break;
      case 'error':
        this.playErrorSound(ctx, now);
        break;
      case 'click':
        this.playClickSound(ctx, now);
        break;
      case 'whoosh':
        this.playWhooshSound(ctx, now);
        break;
      case 'countdown':
        this.playCountdownSound(ctx, now);
        break;
    }
  }

  private playJoinSound(ctx: AudioContext, now: number) {
    // Son positif: montée harmonieuse
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  private playVoteSound(ctx: AudioContext, now: number) {
    // Click doux et court
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.05);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  private playTickSound(ctx: AudioContext, now: number) {
    // Tick court et sec
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.frequency.setValueAtTime(1000, now);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  private playRevealSound(ctx: AudioContext, now: number) {
    // Whoosh ascendant
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  private playWinnerSound(ctx: AudioContext, now: number) {
    // Fanfare courte (3 notes ascendantes)
    const frequencies = [523, 659, 784]; // Do, Mi, Sol

    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.frequency.setValueAtTime(freq, now + i * 0.1);

      gain.gain.setValueAtTime(0.2, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.15);

      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.15);
    });
  }

  private playErrorSound(ctx: AudioContext, now: number) {
    // Son descendant négatif
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  private playClickSound(ctx: AudioContext, now: number) {
    // Click très court
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.frequency.setValueAtTime(600, now);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.03);

    osc.start(now);
    osc.stop(now + 0.03);
  }

  private playWhooshSound(ctx: AudioContext, now: number) {
    // Whoosh rapide
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.12);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  private playCountdownSound(ctx: AudioContext, now: number) {
    // Son de countdown (différent du tick)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(700, now + 0.1);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.start(now);
    osc.stop(now + 0.12);
  }
}

export const soundGenerator = new SoundGenerator();
