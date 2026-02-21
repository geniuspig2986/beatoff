"use client";

import { useState, useRef, useCallback } from "react";
import { initAudio, triggerNote, disposeAudio } from "@/lib/audioEngine";
import { HAND_HIT_ZONES } from "@/lib/hitZones";

const COOLDOWN_MS = 300; // Minimum ms between re-triggers of the same zone

export function useAudioEngine() {
    const [isReady, setIsReady] = useState(false);

    // Map of zone ID → last trigger timestamp
    const cooldownMap = useRef<Map<string, number>>(new Map());

    /**
     * Start the Tone.js AudioContext. Must be called from a user gesture.
     */
    const startAudio = useCallback(async () => {
        try {
            await initAudio();
            setIsReady(true);
        } catch (err) {
            console.error("[useAudioEngine] Failed to start audio:", err);
        }
    }, []);

    /**
     * Play the note mapped to a zone, respecting cooldown.
     * Returns true if the note was actually played (not on cooldown).
     */
    const playZone = useCallback((zoneId: string): boolean => {
        if (!isReady) return false;

        const now = performance.now();
        const lastPlayed = cooldownMap.current.get(zoneId) ?? 0;

        if (now - lastPlayed < COOLDOWN_MS) {
            return false; // Still on cooldown
        }

        const zone = HAND_HIT_ZONES.find((z) => z.id === zoneId);
        if (!zone) return false;

        triggerNote(zone.note);
        cooldownMap.current.set(zoneId, now);
        return true;
    }, [isReady]);

    /**
     * Cleanup — call in useEffect unmount
     */
    const cleanup = useCallback(() => {
        disposeAudio();
        setIsReady(false);
    }, []);

    return { isReady, startAudio, playZone, cleanup };
}
