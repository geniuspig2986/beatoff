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
    /** Collision radius in normalized space */
    radius: number;
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
    // Left side (MediaPipe right, since un-mirrored) — positioned at ~75% X
    {
        id: "L0",
        label: "C4",
        x: 0.78,
        y: 0.22,
        radius: 0.07,
        note: "C4",
        color: "rgba(168, 85, 247, 0.4)",   // Purple
        glowColor: "rgba(168, 85, 247, 0.9)",
    },
    {
        id: "L1",
        label: "D4",
        x: 0.78,
        y: 0.45,
        radius: 0.07,
        note: "D4",
        color: "rgba(139, 92, 246, 0.4)",   // Indigo
        glowColor: "rgba(139, 92, 246, 0.9)",
    },
    {
        id: "L2",
        label: "E4",
        x: 0.78,
        y: 0.68,
        radius: 0.07,
        note: "E4",
        color: "rgba(99, 102, 241, 0.4)",   // Blue-indigo
        glowColor: "rgba(99, 102, 241, 0.9)",
    },
    // Right side (MediaPipe left, since un-mirrored) — positioned at ~25% X
    {
        id: "R0",
        label: "G4",
        x: 0.22,
        y: 0.22,
        radius: 0.07,
        note: "G4",
        color: "rgba(236, 72, 153, 0.4)",   // Pink
        glowColor: "rgba(236, 72, 153, 0.9)",
    },
    {
        id: "R1",
        label: "A4",
        x: 0.22,
        y: 0.45,
        radius: 0.07,
        note: "A4",
        color: "rgba(244, 63, 94, 0.4)",    // Rose
        glowColor: "rgba(244, 63, 94, 0.9)",
    },
    {
        id: "R2",
        label: "C5",
        x: 0.22,
        y: 0.68,
        radius: 0.07,
        note: "C5",
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
    const dx = wx - zone.x;
    const dy = wy - zone.y;
    return Math.sqrt(dx * dx + dy * dy) <= zone.radius;
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
