"use client";

import { useRef, useCallback } from "react";
import { initAudio, disposeAudio, isAudioReady } from "@/lib/audioEngine";
import { HAND_HIT_ZONES } from "@/lib/hitZones";
import { getSoundEngine, GRIMEY_THEME, type SoundEngine } from "@/lib/soundEngine";

// Zone ID -> hand index (0-5) for SoundEngine.triggerHand
const ZONE_ID_TO_INDEX: Record<string, number> = {
  L0: 0,
  L1: 1,
  L2: 2,
  R0: 3,
  R1: 4,
  R2: 5,
};

export function useAudioEngine() {
  const engineRef = useRef<SoundEngine | null>(null);

  /**
   * Start the Tone.js AudioContext. Must be called from a user gesture.
   */
  const startAudio = useCallback(async () => {
    try {
      await initAudio();
      engineRef.current = getSoundEngine(GRIMEY_THEME);
    } catch (err) {
      console.error("[useAudioEngine] Failed to start audio:", err);
    }
  }, []);

  /**
   * Play the grimy theme's note for the zone. Returns true if triggered.
   */
  const playZone = useCallback((zoneId: string): boolean => {
    if (!isAudioReady()) return false;

    const index = ZONE_ID_TO_INDEX[zoneId];
    if (index === undefined || index < 0 || index > 5) return false;

    const engine = engineRef.current ?? getSoundEngine(GRIMEY_THEME);
    engineRef.current = engine;
    engine.setTheme(GRIMEY_THEME);
    engine.triggerHand(index);
    return true;
  }, []);

  /**
   * Cleanup — call in useEffect unmount
   */
  const cleanup = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.cleanup();
      engineRef.current = null;
    }
    disposeAudio();
  }, []);

  return { startAudio, playZone, cleanup };
}
