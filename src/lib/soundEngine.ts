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
};

function disposeTheme(theme: GameTheme): void {
  try {
    theme.handSynth.dispose();
    theme.footSynths.kick.dispose();
    theme.footSynths.snare.dispose();
    theme.footSynths.hihat.dispose();
    theme.footSynths.tom.dispose();
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
    maxPolyphony: 8,
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
    frequency: 200,
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
      synth.triggerAttackRelease("8n");
    } else if (key === "hihat") {
      synth.triggerAttackRelease("32n");
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
