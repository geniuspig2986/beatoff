/**
 * Hit Zone definitions for the hand (melody) zones.
 * 
 * All coordinates are in NORMALIZED 0–1 space matching MediaPipe landmark output.
 * These are UN-MIRRORED coordinates — the rendering layer handles the visual flip.
 * 
 * Layout: 3 zones on the left side, 3 on the right side, stacked vertically (high/mid/low).
 */

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

// C major pentatonic: C4, D4, E4, G4, A4, C5
// Left zones = lower notes, Right zones = higher notes
export const HAND_HIT_ZONES: HitZone[] = [
    // Left side (MediaPipe right, since un-mirrored) — brought closer to center
    {
        id: "L0",
        label: "C4",
        x: 0.65,
        y: 0.25,
        size: 0.10,
        note: "C4",
        color: "rgba(168, 85, 247, 0.4)",   // Purple
        glowColor: "rgba(168, 85, 247, 0.9)",
    },
    {
        id: "L1",
        label: "D4",
        x: 0.65,
        y: 0.45,
        size: 0.10,
        note: "D4",
        color: "rgba(139, 92, 246, 0.4)",   // Indigo
        glowColor: "rgba(139, 92, 246, 0.9)",
    },
    {
        id: "L2",
        label: "E4",
        x: 0.65,
        y: 0.65,
        size: 0.10,
        note: "E4",
        color: "rgba(99, 102, 241, 0.4)",   // Blue-indigo
        glowColor: "rgba(99, 102, 241, 0.9)",
    },
    // Right side (MediaPipe left, since un-mirrored) — brought closer to center
    {
        id: "R0",
        label: "G4",
        x: 0.35,
        y: 0.25,
        size: 0.10,
        note: "G4",
        color: "rgba(236, 72, 153, 0.4)",   // Pink
        glowColor: "rgba(236, 72, 153, 0.9)",
    },
    {
        id: "R1",
        label: "A4",
        x: 0.35,
        y: 0.45,
        size: 0.10,
        note: "A4",
        color: "rgba(244, 63, 94, 0.4)",    // Rose
        glowColor: "rgba(244, 63, 94, 0.9)",
    },
    {
        id: "R2",
        label: "C5",
        x: 0.35,
        y: 0.65,
        size: 0.10,
        note: "C5",
        color: "rgba(251, 113, 133, 0.4)",  // Light rose
        glowColor: "rgba(251, 113, 133, 0.9)",
    },
];

// Footer zones (Drums)
// Kick (C2), Snare (D2), Hi-Hat (E2), Crash (F2)
export const FOOT_HIT_ZONES: HitZone[] = [
    // Left Foot (MediaPipe right)
    {
        id: "FL0",
        label: "KICK",
        x: 0.62,
        y: 0.78,
        size: 0.08,
        note: "C2",
        color: "rgba(234, 88, 12, 0.4)",  // Orange
        glowColor: "rgba(234, 88, 12, 0.9)",
    },
    {
        id: "FL1",
        label: "SNARE",
        x: 0.55,
        y: 0.88,
        size: 0.08,
        note: "D2",
        color: "rgba(234, 179, 8, 0.4)",  // Yellow
        glowColor: "rgba(234, 179, 8, 0.9)",
    },
    // Right Foot (MediaPipe left)
    {
        id: "FR0",
        label: "HI-HAT",
        x: 0.45,
        y: 0.88,
        size: 0.08,
        note: "E2",
        color: "rgba(34, 197, 94, 0.4)",  // Green
        glowColor: "rgba(34, 197, 94, 0.9)",
    },
    {
        id: "FR1",
        label: "CRASH",
        x: 0.38,
        y: 0.78,
        size: 0.08,
        note: "F2",
        color: "rgba(6, 182, 212, 0.4)",  // Cyan
        glowColor: "rgba(6, 182, 212, 0.9)",
    }
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
