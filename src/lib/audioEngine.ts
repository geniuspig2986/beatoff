import * as Tone from "tone";

let isInitialized = false;

/**
 * Initialize the Tone.js AudioContext.
 * MUST be called from a user gesture (click/tap) due to browser autoplay policy.
 * Note: Actual playback uses SoundEngine (themes). This only starts Tone.js.
 */
export async function initAudio(): Promise<void> {
  if (isInitialized) return;

  await Tone.start();
  isInitialized = true;
  console.log("[AudioEngine] Tone.js started.");
}

/**
 * Check if audio context is ready.
 */
export function isAudioReady(): boolean {
  return isInitialized;
}

/**
 * Reset audio state. Call on unmount.
 */
export function disposeAudio(): void {
  isInitialized = false;
}
