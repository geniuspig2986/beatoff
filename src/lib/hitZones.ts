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
    // Left side (MediaPipe right, since un-mirrored) — slightly wider
    {
        id: "L0",
        label: "C4",
        x: 0.72,
        y: 0.22,
        size: 0.14,
        note: "C4",
        color: "rgba(168, 85, 247, 0.4)",   // Purple
        glowColor: "rgba(168, 85, 247, 0.9)",
    },
    {
        id: "L1",
        label: "D4",
        x: 0.72,
        y: 0.45,
        size: 0.14,
        note: "D4",
        color: "rgba(139, 92, 246, 0.4)",   // Indigo
        glowColor: "rgba(139, 92, 246, 0.9)",
    },
    {
        id: "L2",
        label: "E4",
        x: 0.72,
        y: 0.68,
        size: 0.14,
        note: "E4",
        color: "rgba(99, 102, 241, 0.4)",   // Blue-indigo
        glowColor: "rgba(99, 102, 241, 0.9)",
    },
    // Right side (MediaPipe left, since un-mirrored) — slightly wider
    {
        id: "R0",
        label: "G4",
        x: 0.28,
        y: 0.22,
        size: 0.14,
        note: "G4",
        color: "rgba(236, 72, 153, 0.4)",   // Pink
        glowColor: "rgba(236, 72, 153, 0.9)",
    },
    {
        id: "R1",
        label: "A4",
        x: 0.28,
        y: 0.45,
        size: 0.14,
        note: "A4",
        color: "rgba(244, 63, 94, 0.4)",    // Rose
        glowColor: "rgba(244, 63, 94, 0.9)",
    },
    {
        id: "R2",
        label: "C5",
        x: 0.28,
        y: 0.68,
        size: 0.14,
        note: "C5",
        color: "rgba(251, 113, 133, 0.4)",  // Light rose
        glowColor: "rgba(251, 113, 133, 0.9)",
    },
];

// Kick directions mapping for depth kicks
export const KICK_ZONES: Record<string, string> = {
    // MediaPipe Right / Left Foot (since it's unmirrored coordinates in tracking)
    "FL_FORWARD": "C2", // Left Kick Forward -> Kick
    "FL_SIDE": "D2",    // Left Kick Side -> Snare
    "FR_FORWARD": "E2", // Right Kick Forward -> Hi-Hat
    "FR_SIDE": "F2",    // Right Kick Side -> Crash
};

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
