import * as Tone from "tone";

// Module-level singleton synth
let synth: Tone.PolySynth | null = null;
let isInitialized = false;

/**
 * Initialize the Tone.js AudioContext. 
 * MUST be called from a user gesture (click/tap) due to browser autoplay policy.
 */
export async function initAudio(): Promise<void> {
  if (isInitialized) return;

  await Tone.start();

  synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: {
      type: "triangle8" as const,
    },
    envelope: {
      attack: 0.02,
      decay: 0.3,
      sustain: 0.2,
      release: 0.8,
    },
    volume: -8,
  }).toDestination();
  synth.maxPolyphony = 6;

  isInitialized = true;
  console.log("[AudioEngine] Tone.js started, synth ready.");
}

/**
 * Trigger a note on the shared PolySynth.
 * @param note - e.g. "C4", "D4"
 * @param duration - Tone.js duration string, default "8n" (eighth note)
 */
export function triggerNote(note: string, duration: string = "8n"): void {
  if (!synth || !isInitialized) {
    console.warn("[AudioEngine] Synth not initialized. Call initAudio() first.");
    return;
  }
  synth.triggerAttackRelease(note, duration);
}

/**
 * Check if audio engine is ready.
 */
export function isAudioReady(): boolean {
  return isInitialized;
}

/**
 * Cleanup: dispose the synth. Call on unmount.
 */
export function disposeAudio(): void {
  if (synth) {
    synth.dispose();
    synth = null;
  }
  isInitialized = false;
}
