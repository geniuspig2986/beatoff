/**
 * Hit Zone definitions for the hand (melody) zones.
 *
 * All coordinates are in NORMALIZED 0–1 space matching MediaPipe landmark output.
 * These are UN-MIRRORED coordinates — the rendering layer handles the visual flip.
 *
 * Layout: 3 zones on the left side, 3 on the right side, stacked vertically (high/mid/low).
 * Note: Labels are for display only. Actual notes played come from the active theme's handNotes.
 */

import { GRIMEY_THEME } from "./soundEngine";

export interface HitZone {
    id: string;
    label: string;
    /** Normalized X position (0 = left edge, 1 = right edge, un-mirrored) */
    x: number;
    /** Normalized Y position (0 = top, 1 = bottom) */
    y: number;
    /** Size (width and height) in normalized space */
    size: number;
    /** Musical note to play when hit */
    note: string;
    /** Display color (CSS) */
    color: string;
    /** Glow color for active state */
    glowColor: string;
}

// C pentatonic from GRIMEY_THEME: C3, D3, E3, G3, A3, C4
const GRIMEY_NOTES = GRIMEY_THEME.handNotes;

export const HAND_HIT_ZONES: HitZone[] = [
    // Left side (MediaPipe right, since un-mirrored) — positioned at ~75% X
    {
        id: "L0",
        label: GRIMEY_NOTES[0],
        x: 0.78,
        y: 0.22,
        size: 0.14,
        note: GRIMEY_NOTES[0],
        color: "rgba(168, 85, 247, 0.4)",   // Purple
        glowColor: "rgba(168, 85, 247, 0.9)",
    },
    {
        id: "L1",
        label: GRIMEY_NOTES[1],
        x: 0.78,
        y: 0.45,
        size: 0.14,
        note: GRIMEY_NOTES[1],
        color: "rgba(139, 92, 246, 0.4)",   // Indigo
        glowColor: "rgba(139, 92, 246, 0.9)",
    },
    {
        id: "L2",
        label: GRIMEY_NOTES[2],
        x: 0.78,
        y: 0.68,
        size: 0.14,
        note: GRIMEY_NOTES[2],
        color: "rgba(99, 102, 241, 0.4)",   // Blue-indigo
        glowColor: "rgba(99, 102, 241, 0.9)",
    },
    // Right side (MediaPipe left, since un-mirrored) — positioned at ~25% X
    {
        id: "R0",
        label: GRIMEY_NOTES[3],
        x: 0.22,
        y: 0.22,
        size: 0.14,
        note: GRIMEY_NOTES[3],
        color: "rgba(236, 72, 153, 0.4)",   // Pink
        glowColor: "rgba(236, 72, 153, 0.9)",
    },
    {
        id: "R1",
        label: GRIMEY_NOTES[4],
        x: 0.22,
        y: 0.45,
        size: 0.14,
        note: GRIMEY_NOTES[4],
        color: "rgba(244, 63, 94, 0.4)",    // Rose
        glowColor: "rgba(244, 63, 94, 0.9)",
    },
    {
        id: "R2",
        label: GRIMEY_NOTES[5],
        x: 0.22,
        y: 0.68,
        size: 0.14,
        note: GRIMEY_NOTES[5],
        color: "rgba(251, 113, 133, 0.4)",  // Light rose
        glowColor: "rgba(251, 113, 133, 0.9)",
    },
];

/**
 * Check if a point (wrist) is inside a hit zone.
 * Both coordinates in normalized 0–1 space.
 */
export function checkZoneHit(
    wx: number,
    wy: number,
    zone: HitZone
): boolean {
    const halfSize = zone.size / 2;
    return (
        wx >= zone.x - halfSize &&
        wx <= zone.x + halfSize &&
        wy >= zone.y - halfSize &&
        wy <= zone.y + halfSize
    );
}

/**
 * Find the first zone that a wrist position is inside.
 * Returns null if no zone is hit.
 */
export function findActiveZone(
    wx: number,
    wy: number,
    zones: HitZone[]
): HitZone | null {
    for (const zone of zones) {
        if (checkZoneHit(wx, wy, zone)) {
            return zone;
        }
    }
    return null;
}
