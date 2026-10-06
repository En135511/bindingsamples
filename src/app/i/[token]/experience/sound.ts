// All sounds are synthesized with the Web Audio API, so there are no audio files to load.
// Browsers only allow audio after a tap, so `unlock()` is called from the envelope tap.

const BPM = 84;
const BEAT = 60 / BPM;
const BAR = 3 * BEAT; // a gentle waltz

// An original music-box melody in D major: [midi note, beat, length in beats].
const MELODY: [number, number, number][][] = [
  [[78, 0, 1], [81, 1, 1], [86, 2, 1]],
  [[85, 0, 1], [83, 1, 2]],
  [[79, 0, 1], [83, 1, 1], [86, 2, 1]],
  [[88, 0, 2], [85, 2, 1]],
  [[86, 0, 1], [90, 1, 1], [88, 2, 1]],
  [[86, 0, 1], [83, 1, 1], [81, 2, 1]],
  [[79, 0, 1], [76, 1, 1], [85, 2, 1]],
  [[86, 0, 3]],
];
// Accompaniment per bar: [bass note, [chord tones on beats 2 and 3]]
const CHORDS: [number, number[], number[]][] = [
  [50, [66, 69], [66, 69]], // D
  [47, [62, 66], [62, 66]], // Bm
  [43, [59, 62], [59, 62]], // G
  [45, [61, 64], [61, 64]], // A
  [50, [66, 69], [66, 69]], // D
  [47, [62, 66], [62, 66]], // Bm
  [40, [59, 64], [61, 64]], // Em → A
  [50, [66, 69], [62, 66]], // D
];

const midiToHz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
const MUTE_KEY = "invite-muted";

class SoundEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private reverb!: GainNode;
  private musicBus!: GainNode;
  private noise!: AudioBuffer;
  private timer: ReturnType<typeof setInterval> | null = null;
  private nextBar = 0;
  private nextBarTime = 0;
  private listeners = new Set<() => void>();
  muted = false;

  constructor() {
    try {
      this.muted = typeof localStorage !== "undefined" && localStorage.getItem(MUTE_KEY) === "1";
    } catch {
      // storage can be blocked; default to sound on
    }
  }

  /** Must be called from a tap/click. Safe to call more than once. */
  unlock() {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      this.ctx = ctx;

      const compressor = ctx.createDynamicsCompressor();
      compressor.connect(ctx.destination);
      this.master = ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 1;
      this.master.connect(compressor);

      // A soft hall reverb from a generated impulse response.
      const convolver = ctx.createConvolver();
      const length = Math.floor(ctx.sampleRate * 2.8);
      const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const data = impulse.getChannelData(ch);
        for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3;
      }
      convolver.buffer = impulse;
      this.reverb = ctx.createGain();
      this.reverb.gain.value = 0.4;
      this.reverb.connect(convolver).connect(this.master);

      this.musicBus = ctx.createGain();
      this.musicBus.gain.value = 0;
      this.musicBus.connect(this.master);
      this.musicBus.connect(this.reverb);

      this.noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const n = this.noise.getChannelData(0);
      for (let i = 0; i < n.length; i++) n[i] = Math.random() * 2 - 1;

      document.addEventListener("visibilitychange", () => {
        if (document.hidden) this.ctx?.suspend();
        else this.ctx?.resume();
      });
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    try {
      localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
    } catch {}
    if (this.ctx) this.master.gain.setTargetAtTime(muted ? 0 : 1, this.ctx.currentTime, 0.08);
    this.listeners.forEach((l) => l());
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // ── Sound effects ────────────────────────────────────────────────────────

  private noiseBurst(start: number, duration: number, filter: BiquadFilterNode, peak: number, toReverb = 0) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + Math.min(0.01, duration / 4));
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    src.connect(filter).connect(gain).connect(this.master);
    if (toReverb) {
      const send = ctx.createGain();
      send.gain.value = toReverb;
      gain.connect(send).connect(this.reverb);
    }
    src.start(start, Math.random() * 0.5, duration + 0.05);
    return gain;
  }

  /** The wax seal cracking. */
  crack() {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    for (const [offset, peak] of [[0, 0.8], [0.03, 0.45], [0.07, 0.25]]) {
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 2200 + Math.random() * 1200;
      filter.Q.value = 0.9;
      this.noiseBurst(t + offset, 0.06, filter, peak);
    }
    const thump = ctx.createOscillator();
    const gain = ctx.createGain();
    thump.frequency.setValueAtTime(150, t);
    thump.frequency.exponentialRampToValueAtTime(50, t + 0.18);
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    thump.connect(gain).connect(this.master);
    thump.start(t);
    thump.stop(t + 0.25);
  }

  /** Paper sliding: the flap opening or the card coming out. */
  swoosh(duration = 0.8) {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.value = 1.1;
    filter.frequency.setValueAtTime(350, t);
    filter.frequency.exponentialRampToValueAtTime(2400, t + duration);
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.28, t + duration * 0.3);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    src.connect(filter).connect(gain).connect(this.master);
    src.start(t, Math.random() * 0.1, duration + 0.05);
  }

  private bell(freq: number, start: number, peak: number, decay = 2.8, out: AudioNode = this.master) {
    const ctx = this.ctx!;
    for (const [ratio, level] of [[1, 1], [2.756, 0.3], [5.404, 0.1]]) {
      const osc = ctx.createOscillator();
      osc.frequency.value = freq * ratio;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(peak * level, start + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + decay / ratio);
      osc.connect(gain);
      gain.connect(out);
      if (out === this.master) gain.connect(this.reverb);
      osc.start(start);
      osc.stop(start + decay + 0.1);
    }
  }

  /** A sparkling chime as the invitation appears. */
  chime() {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    [86, 90, 93, 98].forEach((midi, i) => this.bell(midiToHz(midi), t + i * 0.09, 0.16));
  }

  // ── Music ────────────────────────────────────────────────────────────────

  get musicPlaying() {
    return this.timer !== null;
  }

  startMusic() {
    const ctx = this.ctx;
    if (!ctx || this.timer) return;
    this.nextBar = 0;
    this.nextBarTime = ctx.currentTime + 0.6;
    this.musicBus.gain.cancelScheduledValues(ctx.currentTime);
    this.musicBus.gain.setValueAtTime(0.0001, ctx.currentTime);
    this.musicBus.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + 3);
    this.schedule();
    this.timer = setInterval(() => this.schedule(), 150);
  }

  private schedule() {
    const ctx = this.ctx!;
    while (this.nextBarTime < ctx.currentTime + 0.8) {
      this.scheduleBar(this.nextBar % MELODY.length, this.nextBarTime);
      this.nextBar++;
      this.nextBarTime += BAR;
    }
  }

  private scheduleBar(bar: number, start: number) {
    // Slight timing and velocity variation makes it feel hand-wound.
    const human = () => (Math.random() - 0.5) * 0.012;
    for (const [midi, beat, len] of MELODY[bar]) {
      this.bell(midiToHz(midi), start + beat * BEAT + human(), 0.22 + Math.random() * 0.04, 1.4 + len * 0.5, this.musicBus);
    }
    const [bass, beat2, beat3] = CHORDS[bar];
    this.bell(midiToHz(bass + 12), start + human(), 0.14, 2.2, this.musicBus);
    for (const midi of beat2) this.bell(midiToHz(midi), start + BEAT + human(), 0.07, 1.2, this.musicBus);
    for (const midi of beat3) this.bell(midiToHz(midi), start + 2 * BEAT + human(), 0.07, 1.2, this.musicBus);
  }
}

export const sound = new SoundEngine();
