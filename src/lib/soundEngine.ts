/**
 * Sound Engine - Tone.js-based audio for the rhythm game.
 * Handles hand (melody) and foot (percussion) triggers with theme-based instrumentation.
 * Singleton pattern + hot-reload-safe disposal to prevent multiple instances.
 */

import * as Tone from "tone";

// --- Theme Interface ---

export interface GameTheme {
  name: string;
  handSynth: Tone.PolySynth<Tone.Synth>;
  footSynths: {
    kick: Tone.MembraneSynth;
    snare: Tone.NoiseSynth;
    hihat: Tone.MetalSynth;
    tom: Tone.MembraneSynth;
  };
  handNotes: string[];
}

// --- Hot-reload safety: dispose previous theme before creating new one ---

const globalForSound = globalThis as unknown as {
  __soundEngineTheme?: GameTheme;
  __soundEngineMaster?: { reverb: Tone.Reverb; limiter: Tone.Limiter };
  __rockThemeDistortion?: Tone.Distortion;
  __grimyThemeEffects?: {
    distortion: Tone.Distortion;
    delay: Tone.FeedbackDelay;
    chorus: Tone.Chorus;
    phaser: Tone.Phaser;
    filter: Tone.Filter;
  };
};

function disposeTheme(theme: GameTheme): void {
  try {
    theme.handSynth.dispose();
    theme.footSynths.kick.dispose();
    theme.footSynths.snare.dispose();
    theme.footSynths.hihat.dispose();
    theme.footSynths.tom.dispose();
    // Dispose rock theme distortion if it exists
    if (theme.name === "90s Rock" && globalForSound.__rockThemeDistortion) {
      globalForSound.__rockThemeDistortion.dispose();
      globalForSound.__rockThemeDistortion = undefined;
    }
    // Dispose grimy theme effects if they exist
    if (theme.name === "Grimy" && globalForSound.__grimyThemeEffects) {
      const effects = globalForSound.__grimyThemeEffects;
      effects.distortion.dispose();
      effects.delay.dispose();
      effects.chorus.dispose();
      effects.phaser.dispose();
      effects.filter.dispose();
      globalForSound.__grimyThemeEffects = undefined;
    }
  } catch {
    // Ignore disposal errors (e.g. already disposed)
  }
}

function disposeMaster(): void {
  const master = globalForSound.__soundEngineMaster;
  if (master) {
    try {
      master.reverb.dispose();
      master.limiter.dispose();
    } catch {
      // Ignore
    }
    globalForSound.__soundEngineTheme = undefined;
    globalForSound.__soundEngineMaster = undefined;
  }
}

// --- Master Bus (shared reverb + limiter) ---

function getOrCreateMasterBus(): { reverb: Tone.Reverb; limiter: Tone.Limiter } {
  if (globalForSound.__soundEngineMaster) {
    return globalForSound.__soundEngineMaster;
  }
  const reverb = new Tone.Reverb(0.2);
  const limiter = new Tone.Limiter(-6);
  reverb.connect(limiter);
  limiter.toDestination();
  globalForSound.__soundEngineMaster = { reverb, limiter };
  return globalForSound.__soundEngineMaster;
}

// --- Theme Implementation: Piano Jazz ---

function createPianoJazzTheme(): GameTheme {
  // Dispose previous theme on hot-reload
  if (globalForSound.__soundEngineTheme) {
    disposeTheme(globalForSound.__soundEngineTheme);
    globalForSound.__soundEngineTheme = undefined;
  }

  const { reverb } = getOrCreateMasterBus();

  // Hand synth: Grand Piano envelope
  const handSynth = new Tone.PolySynth(Tone.Synth, {
    envelope: {
      attack: 0.005,
      decay: 1,
      sustain: 0.3,
      release: 1,
    },
  }).connect(reverb);

  // Foot synths
  const kick = new Tone.MembraneSynth({
    pitchDecay: 0.05,
    octaves: 4,
    envelope: { attack: 0.001, decay: 0.4, sustain: 0 },
  }).connect(reverb);

  const snare = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.001, decay: 0.2, sustain: 0 },
  }).connect(reverb);

  const hihat = new Tone.MetalSynth({
    envelope: { attack: 0.001, decay: 0.05, sustain: 0 },
    harmonicity: 5.1,
    modulationIndex: 32,
    resonance: 4000,
    octaves: 1,
  }).connect(reverb);

  const tom = new Tone.MembraneSynth({
    pitchDecay: 0.05,
    octaves: 6,
    envelope: { attack: 0.001, decay: 0.5, sustain: 0 },
  }).connect(reverb);

  const theme: GameTheme = {
    name: "Piano Jazz",
    handSynth,
    footSynths: { kick, snare, hihat, tom },
    handNotes: ["C4", "D4", "E4", "G4", "A4", "C5"],
  };

  globalForSound.__soundEngineTheme = theme;
  return theme;
}

export const PIANO_JAZZ_THEME = createPianoJazzTheme();

// --- Theme Implementation: 70s Studio Disco ---

function createDiscoStudioTheme(): GameTheme {
  const { reverb } = getOrCreateMasterBus();

  // Hand synth: brighter, brassy disco lead
  const handSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "sawtooth" },
    envelope: {
      attack: 0.01,
      decay: 0.3,
      sustain: 0.2,
      release: 0.4,
    },
  }).connect(reverb);

  // Foot synths: heavy 4-on-the-floor kit
  const kick = new Tone.MembraneSynth({
    pitchDecay: 0.08,
    octaves: 5,
    envelope: { attack: 0.001, decay: 0.5, sustain: 0 },
  }).connect(reverb);

  const snare = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.001, decay: 0.25, sustain: 0 },
  }).connect(reverb);

  const hihat = new Tone.MetalSynth({
    envelope: { attack: 0.001, decay: 0.03, sustain: 0 },
    harmonicity: 5.0,
    modulationIndex: 20,
    resonance: 6000,
    octaves: 1.5,
  }).connect(reverb);

  const tom = new Tone.MembraneSynth({
    pitchDecay: 0.06,
    octaves: 4,
    envelope: { attack: 0.001, decay: 0.4, sustain: 0 },
  }).connect(reverb);

  const theme: GameTheme = {
    name: "70s Studio Disco",
    handSynth,
    footSynths: { kick, snare, hihat, tom },
    // F# minor pentatonic-ish: funky mid-register
    handNotes: ["F#3", "G#3", "A#3", "C#4", "D#4", "F#4"],
  };

  return theme;
}

export const DISCO_STUDIO_THEME = createDiscoStudioTheme();

// --- Theme Implementation: 90s Rock ---

function createRockTheme(): GameTheme {
  const { reverb } = getOrCreateMasterBus();

  // Hand synth: Electric guitar with heavy distortion
  const distortion = new Tone.Distortion(0.8).connect(reverb);
  globalForSound.__rockThemeDistortion = distortion;
  const handSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "sawtooth" },
    envelope: {
      attack: 0.01,
      decay: 0.5,
      sustain: 0.3,
      release: 0.6,
    },
    volume: 0,
  }).connect(distortion);

  // Foot synths: Heavy rock kit
  const kick = new Tone.MembraneSynth({
    pitchDecay: 0.1,
    octaves: 6,
    envelope: { attack: 0.001, decay: 0.6, sustain: 0 },
  }).connect(reverb);

  const snare = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.001, decay: 0.15, sustain: 0 },
  }).connect(reverb);

  const hihat = new Tone.MetalSynth({
    envelope: { attack: 0.001, decay: 0.08, sustain: 0 },
    harmonicity: 5.1,
    modulationIndex: 16,
    resonance: 3000,
    octaves: 1.2,
  }).connect(reverb);

  // Tom configured as crash symbol (higher pitch, longer decay for crash-like sound)
  const tom = new Tone.MembraneSynth({
    pitchDecay: 0.05,
    octaves: 8,
    envelope: { attack: 0.001, decay: 0.8, sustain: 0 },
  }).connect(reverb);

  const theme: GameTheme = {
    name: "90s Rock",
    handSynth,
    footSynths: { kick, snare, hihat, tom },
    // E flat pentatonic: Eb, F, G, Bb, C
    handNotes: ["Eb3", "F3", "G3", "Bb3", "C4", "Eb4"],
  };

  return theme;
}

export const ROCK_THEME = createRockTheme();

// --- Theme Implementation: Grimy ---

function createGrimyTheme(): GameTheme {
  const { reverb } = getOrCreateMasterBus();

  // Hand synth: Maximum effects chain - distortion -> delay -> chorus -> phaser -> filter -> reverb
  const distortion = new Tone.Distortion(0.9); // Cranked distortion
  const delay = new Tone.FeedbackDelay("8n", 0.4); // Heavy delay
  const chorus = new Tone.Chorus(4, 2.5, 0.5); // Deep chorus
  const phaser = new Tone.Phaser({
    frequency: 1.5,
    octaves: 3,
    baseFrequency: 350,
  });
  const filter = new Tone.Filter({
    type: "lowpass",
    frequency: 2000,
    Q: 5,
  });

  // Chain: synth -> distortion -> delay -> chorus -> phaser -> filter -> reverb
  distortion.connect(delay);
  delay.connect(chorus);
  chorus.connect(phaser);
  phaser.connect(filter);
  filter.connect(reverb);

  // Store effects for disposal
  globalForSound.__grimyThemeEffects = {
    distortion,
    delay,
    chorus,
    phaser,
    filter,
  };

  // Use a cool synth with sawtooth and lots of harmonics
  const handSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "sawtooth" },
    envelope: {
      attack: 0.05,
      decay: 0.3,
      sustain: 0.4,
      release: 0.8,
    },
    volume: -5,
  }).connect(distortion);

  // Foot synths: Heavy drums
  const kick = new Tone.MembraneSynth({
    pitchDecay: 0.12,
    octaves: 7,
    envelope: { attack: 0.001, decay: 0.7, sustain: 0 },
  }).connect(reverb);

  const snare = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.001, decay: 0.3, sustain: 0 },
  }).connect(reverb);

  const hihat = new Tone.MetalSynth({
    envelope: { attack: 0.001, decay: 0.1, sustain: 0 },
    harmonicity: 5.5,
    modulationIndex: 25,
    resonance: 5000,
    octaves: 1.5,
  }).connect(reverb);

  const tom = new Tone.MembraneSynth({
    pitchDecay: 0.08,
    octaves: 5,
    envelope: { attack: 0.001, decay: 0.5, sustain: 0 },
  }).connect(reverb);

  const theme: GameTheme = {
    name: "Grimy",
    handSynth,
    footSynths: { kick, snare, hihat, tom },
    // C pentatonic: C, D, E, G, A
    handNotes: ["C3", "D3", "E3", "G3", "A3", "C4"],
  };

  return theme;
}

export const GRIMEY_THEME = createGrimyTheme();

// --- All Available Themes (for random selection) ---
export const ALL_THEMES = [
  PIANO_JAZZ_THEME,
  DISCO_STUDIO_THEME,
  ROCK_THEME,
  GRIMEY_THEME,
] as const;

// --- SoundEngine Class ---

const FOOT_KEYS = ["kick", "snare", "hihat", "tom"] as const;

/** Pitch mapping for MembraneSynth percussion (kick=low, tom=medium). */
const FOOT_PITCHES: Record<string, string> = {
  kick: "C1",
  tom: "C3",
};

export class SoundEngine {
  private currentTheme: GameTheme;
  private _isDisposed = false;

  constructor(theme: GameTheme = PIANO_JAZZ_THEME) {
    this.currentTheme = theme;
  }

  /** Trigger a hand zone (0–5). Plays the corresponding pentatonic note. */
  triggerHand(index: number): void {
    if (this._isDisposed) return;
    if (index < 0 || index > 5) return;

    const note = this.currentTheme.handNotes[index];
    if (note) {
      this.currentTheme.handSynth.triggerAttackRelease(note, "8n");
    }
  }

  /** Trigger a foot zone: 0=kick, 1=snare, 2=hihat, 3=tom. */
  triggerFoot(index: number): void {
    if (this._isDisposed) return;
    if (index < 0 || index > 3) return;

    const key = FOOT_KEYS[index];
    const synth = this.currentTheme.footSynths[key];

    if (key === "snare") {
      // NoiseSynth: duration + explicit start time
      (synth as Tone.NoiseSynth).triggerAttackRelease(0.2, 0);
    } else if (key === "hihat") {
      // MetalSynth: short metallic tick
      (synth as Tone.MetalSynth).triggerAttackRelease(0.05, 0);
    } else {
      const pitch = FOOT_PITCHES[key] ?? "C2";
      synth.triggerAttackRelease(pitch, "8n");
    }
  }

  /** Set the active theme. */
  setTheme(theme: GameTheme): void {
    if (!this._isDisposed) {
      this.currentTheme = theme;
    }
  }

  /** Get the current theme. */
  getTheme(): GameTheme {
    return this.currentTheme;
  }

  /** Dispose all synths and release resources. Call on unmount. */
  cleanup(): void {
    if (this._isDisposed) return;
    this._isDisposed = true;
    disposeTheme(this.currentTheme);
    disposeMaster();
    if (globalForEngine.__soundEngine === this) {
      globalForEngine.__soundEngine = undefined;
    }
  }
}

// --- Singleton getter (optional, for React/hot-reload safety) ---

const globalForEngine = globalThis as unknown as { __soundEngine?: SoundEngine };

export function getSoundEngine(theme?: GameTheme): SoundEngine {
  if (!globalForEngine.__soundEngine) {
    globalForEngine.__soundEngine = new SoundEngine(theme ?? PIANO_JAZZ_THEME);
  }
  return globalForEngine.__soundEngine;
}
