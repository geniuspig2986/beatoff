"use client";

import { useState, useRef, useCallback } from "react";
import { initAudio, triggerNote, disposeAudio, isAudioReady } from "@/lib/audioEngine";
import { HAND_HIT_ZONES, KICK_ZONES } from "@/lib/hitZones";

// No time-based cooldown; notes trigger ONCE upon entering a zone

export function useAudioEngine() {
    /**
     * Start the Tone.js AudioContext. Must be called from a user gesture.
     */
    const startAudio = useCallback(async () => {
        try {
            await initAudio();
        } catch (err) {
            console.error("[useAudioEngine] Failed to start audio:", err);
        }
    }, []);

    /**
     * Play the note mapped to a zone immediately.
     * Returns true if the note was successfully triggered.
     */
    const playZone = useCallback((zoneId: string): boolean => {
        if (!isAudioReady()) return false;

        // Try hand zones first
        const handZone = HAND_HIT_ZONES.find((z) => z.id === zoneId);
        if (handZone) {
            triggerNote(handZone.note);
            return true;
        }

        // Try kick mapping
        const kickNote = KICK_ZONES[zoneId];
        if (kickNote) {
            triggerNote(kickNote);
            return true;
        }

        return false;
    }, []);

    /**
     * Cleanup — call in useEffect unmount
     */
    const cleanup = useCallback(() => {
        disposeAudio();
    }, []);

    return { startAudio, playZone, cleanup };
}
