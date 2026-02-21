"use client";

import { useState, useRef, useCallback } from "react";
import { initAudio, triggerNote, disposeAudio, isAudioReady, getAudioDestination } from "@/lib/audioEngine";
import { HAND_HIT_ZONES, FOOT_HIT_ZONES } from "@/lib/hitZones";

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

        const zone = HAND_HIT_ZONES.find((z) => z.id === zoneId) || FOOT_HIT_ZONES.find((z) => z.id === zoneId);
        if (!zone) return false;

        triggerNote(zone.note);
        return true;
    }, []);

    const getAudioStream = useCallback(() => {
        const dest = getAudioDestination();
        if (dest && dest.context) {
            // Create a media stream destination
            const mediaStreamDest = dest.context.createMediaStreamDestination();
            dest.connect(mediaStreamDest);
            return mediaStreamDest.stream;
        }
        return null;
    }, []);

    /**
     * Cleanup — call in useEffect unmount
     */
    const cleanup = useCallback(() => {
        disposeAudio();
    }, []);

    return { startAudio, playZone, getAudioStream, cleanup };
}
