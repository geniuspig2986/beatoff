"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";
import { HAND_HIT_ZONES, FOOT_HIT_ZONES, findActiveZone, HitZone } from "@/lib/hitZones";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { useGameStore } from "@/store/useGameStore";

// The indices for the joints we care about in the MediaPipe topology
const TARGET_JOINTS = {
    leftWrist: 15,
    rightWrist: 16,
    leftAnkle: 27,
    rightAnkle: 28,
};

export default function PoseTracker() {
    const webcamRef = useRef<Webcam>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const { isModelLoaded, setIsModelLoaded, addEvent, gameState, setRecordedVideoBlob, twitterPermission } = useGameStore();
    const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);

    // Track which zones are currently active for visual feedback
    const activeZonesRef = useRef<Set<string>>(new Set());

    // Audio engine
    const { playZone, getAudioStream, cleanup: cleanupAudio } = useAudioEngine();
    const requestRef = useRef<number>(undefined);

    // MediaRecording state
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<BlobPart[]>([]);

    // Initialize MediaPipe PoseLandmarker
    useEffect(() => {
        let active = true;

        async function initModel() {
            try {
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
                );

                const landmarker = await PoseLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: "/pose_landmarker_lite.task",
                        delegate: "GPU",
                    },
                    runningMode: "VIDEO",
                    numPoses: 1,
                });

                if (active) {
                    poseLandmarkerRef.current = landmarker;
                    setIsModelLoaded(true);
                }
            } catch (error) {
                console.error("Failed to initialize PoseLandmarker:", error);
            }
        }

        initModel();

        return () => {
            active = false;
            if (poseLandmarkerRef.current) {
                poseLandmarkerRef.current.close();
            }
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
            cleanupAudio();
        };
    }, []);

    // ----- Media Recording Logic -----
    useEffect(() => {
        // If they declined tweeter permission, don't record
        if (twitterPermission === false) return;

        if (gameState === 'RECORDING') {
            startRecording();
        } else if (gameState === 'EVALUATING') {
            stopRecording();
        }
    }, [gameState]);

    const startRecording = useCallback(() => {
        if (!canvasRef.current || !webcamRef.current?.video) return;

        // Reset chunks
        recordedChunksRef.current = [];

        try {
            // 1. Get video stream from canvas
            // Cast to any because TS doesn't have captureStream by default on HTMLCanvasElement in some dom libs
            const canvasStream = (canvasRef.current as any).captureStream(30) as MediaStream;

            // 2. Get audio stream from Tone.js destination
            const audioStream = getAudioStream() as MediaStream | null;

            // 3. Mix them if audio is available
            let finalStream = canvasStream;
            if (audioStream && audioStream.getAudioTracks().length > 0) {
                const tracks = [...canvasStream.getVideoTracks(), ...audioStream.getAudioTracks()];
                finalStream = new MediaStream(tracks);
            }

            // Create recorder
            const options = { mimeType: 'video/webm; codecs=vp9' };
            const mediaRecorder = new MediaRecorder(finalStream, options);

            mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    recordedChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                setRecordedVideoBlob(blob);
                console.log("[PoseTracker] Recording complete, blob saved.");
            };

            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start(100); // collect 100ms chunks
            console.log("[PoseTracker] Started recording...");

        } catch (err) {
            console.error("Failed to start MediaRecorder:", err);
        }
    }, [getAudioStream, setRecordedVideoBlob]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
    }, []);

    // ----- Drawing Helpers -----

    const drawHitZone = (
        ctx: CanvasRenderingContext2D,
        zone: HitZone,
        canvasW: number,
        canvasH: number,
        isActive: boolean
    ) => {
        // Mirror X for display (webcam is mirrored)
        const cx = canvasW - zone.x * canvasW;
        const cy = zone.y * canvasH;

        // Scale size to keep it square on screen
        const s = zone.size * Math.max(canvasW, canvasH);
        const minX = cx - s / 2;
        const minY = cy - s / 2;

        ctx.save();

        if (isActive) {
            // Glow effect when hit
            ctx.shadowColor = zone.glowColor;
            ctx.shadowBlur = 30;

            // Bright filled square
            ctx.beginPath();
            ctx.roundRect(minX, minY, s, s, 10);
            ctx.fillStyle = zone.glowColor;
            ctx.fill();

            // Inner bright square ring
            ctx.beginPath();
            ctx.roundRect(minX + s * 0.2, minY + s * 0.2, s * 0.6, s * 0.6, 6);
            ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
            ctx.lineWidth = 3;
            ctx.stroke();
        } else {
            // Idle state — semi-transparent square
            ctx.beginPath();
            ctx.roundRect(minX, minY, s, s, 10);
            ctx.fillStyle = zone.color;
            ctx.fill();

            // Border square
            ctx.beginPath();
            ctx.roundRect(minX, minY, s, s, 10);
            ctx.strokeStyle = zone.glowColor.replace("0.9", "0.6");
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Note label
        ctx.shadowBlur = 0;
        ctx.font = `bold ${Math.max(14, s * 0.3)}px monospace`;
        ctx.fillStyle = isActive ? "#fff" : "rgba(255, 255, 255, 0.7)";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(zone.label, cx, cy);

        ctx.restore();
    };

    const drawWristDot = (
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        color: string,
        isInZone: boolean
    ) => {
        const dotRadius = isInZone ? 14 : 8;

        ctx.save();
        if (isInZone) {
            ctx.shadowColor = color;
            ctx.shadowBlur = 20;
        }
        ctx.beginPath();
        ctx.arc(x, y, dotRadius, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    };

    // ----- Main Render Loop -----

    const renderLoop = () => {
        if (!isModelLoaded) return;

        if (
            !poseLandmarkerRef.current ||
            !webcamRef.current ||
            !webcamRef.current.video ||
            !canvasRef.current
        ) {
            requestRef.current = requestAnimationFrame(renderLoop);
            return;
        }

        const video = webcamRef.current.video;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        if (!ctx || video.readyState !== 4) {
            requestRef.current = requestAnimationFrame(renderLoop);
            return;
        }

        // Match canvas dimensions to the video
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        }

        // Clear previous frame
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Get the pose estimation
        const startTimeMs = performance.now();
        const results = poseLandmarkerRef.current.detectForVideo(video, startTimeMs);

        // Track which zones are active this frame
        const frameActiveZones = new Set<string>();

        // ----- Draw alignment guide (background layer) -----
        ctx.save();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = 4;
        ctx.setLineDash([15, 15]);

        // Draw a simple box in the center representing where the player should stand
        const boxWidth = canvas.width * 0.4;
        const boxHeight = canvas.height * 0.8;
        const boxX = (canvas.width - boxWidth) / 2;
        const boxY = (canvas.height - boxHeight) / 2;

        ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.font = "bold 24px monospace";
        ctx.textAlign = "center";
        ctx.fillText("STAND HERE", canvas.width / 2, boxY + 40);
        ctx.restore();

        // ----- Draw hit zones -----
        const allZones = [...HAND_HIT_ZONES, ...FOOT_HIT_ZONES];
        for (const zone of allZones) {
            const isActive = activeZonesRef.current.has(zone.id);
            drawHitZone(ctx, zone, canvas.width, canvas.height, isActive);
        }

        // ----- Process landmarks -----
        if (results.landmarks && results.landmarks.length > 0) {
            const poses = results.landmarks[0];
            const mirrorX = (x: number) => canvas.width - x * canvas.width;

            // Process each wrist
            const wrists = [
                { index: TARGET_JOINTS.leftWrist, color: "#ff6b6b" },
                { index: TARGET_JOINTS.rightWrist, color: "#51cf66" },
            ];

            // Helper to draw a joint
            const drawJoint = (index: number, color: string) => {
                const landmark = poses[index];
                // If visibility is too low, don't draw
                if (landmark.visibility < 0.5) return;

                // Raw normalized coords (un-mirrored) for collision detection
                const normX = landmark.x;
                const normY = landmark.y;

                // Check if wrist is in a hit zone
                const hitZone = findActiveZone(normX, normY, HAND_HIT_ZONES);
                const isInZone = hitZone !== null;

                if (hitZone) {
                    frameActiveZones.add(hitZone.id);
                    // Only play if it wasn't already active last frame (infinite cooldown)
                    if (!activeZonesRef.current.has(hitZone.id)) {
                        playZone(hitZone.id);
                        addEvent({
                            timestamp: performance.now(),
                            limb: hitZone.id
                        });
                    }
                }

                // Draw the wrist dot (mirrored for display)
                const displayX = mirrorX(normX);
                const displayY = normY * canvas.height;
                drawWristDot(ctx, displayX, displayY, color, isInZone);
            };

            for (const wrist of wrists) {
                drawJoint(wrist.index, wrist.color);
            }

            // Process each ankle for depth kicks
            const ankles = [
                { index: TARGET_JOINTS.leftAnkle, color: "#339af0", isLeft: true },
                { index: TARGET_JOINTS.rightAnkle, color: "#fcc419", isLeft: false },
            ];

            const FORWARD_KICK_Z = -0.10; // Depth threshold (even easier)
            const NEUTRAL_Z = -0.01;      // Reset Z (must be very close to hip depth)

            const SIDE_KICK_X_LEFT_LEG = 0.70; // Physical left leg: kick outward past 0.70
            const NEUTRAL_X_LEFT_LEG = 0.64;   // Physical left leg: reset inward past 0.64

            const SIDE_KICK_X_RIGHT_LEG = 0.30; // Physical right leg: kick outward past 0.30
            const NEUTRAL_X_RIGHT_LEG = 0.36;   // Physical right leg: reset inward past 0.36

            const KICK_Y_THRESHOLD = 0.96; // Height threshold (much easier)

            const drawAnkle = (index: number, color: string, isLeft: boolean) => {
                const landmark = poses[index];
                if (!landmark || landmark.visibility < 0.5) return;

                const normX = landmark.x;
                const normY = landmark.y;
                const normZ = landmark.z;

                // Track state by leg identity to allow cooldowns per physical limb
                const legId = isLeft ? "LEFT_LEG" : "RIGHT_LEG";

                let kickId: string | null = null;
                let isKicking = false;

                // --- 1. Detect if currently in a kicking pose ---

                // Forward (depth) kick
                if (normZ < FORWARD_KICK_Z) {
                    kickId = isLeft ? "FL_FORWARD" : "FR_FORWARD";
                    isKicking = true;
                }
                // Lateral (side) kick
                else if (normY < KICK_Y_THRESHOLD) {
                    if (isLeft && normX > SIDE_KICK_X_LEFT_LEG) {
                        kickId = "FL_SIDE";
                        isKicking = true;
                    }
                    else if (!isLeft && normX < SIDE_KICK_X_RIGHT_LEG) {
                        kickId = "FR_SIDE";
                        isKicking = true;
                    }
                }

                // --- 2. Check if returned to neutral standing ---

                let isNeutral = false;
                if (!isKicking) {
                    const depthOk = normZ > NEUTRAL_Z;
                    const xOk = isLeft ? (normX < NEUTRAL_X_LEFT_LEG) : (normX > NEUTRAL_X_RIGHT_LEG);
                    const groundedOk = normY > 0.88; // Looser grounding (0.88 is lower than hip level usually)

                    if (depthOk && xOk) isNeutral = true;
                    if (groundedOk) isNeutral = true;
                }

                // --- 3. Process Strike Logic with Cooldown ---

                if (isKicking && kickId) {
                    // Only strike if the leg wasn't already in a kick state (infinite cooldown)
                    if (!activeZonesRef.current.has(legId)) {
                        playZone(kickId);
                        addEvent({
                            timestamp: performance.now(),
                            limb: kickId
                        });

                        // Mark the limb as "active" to prevent re-firing this action
                        frameActiveZones.add(legId);
                    } else {
                        // Keep limb active while strike is held
                        frameActiveZones.add(legId);
                    }

                    // Visual Label Feedback
                    let kickLabel = "KICK";
                    if (kickId.endsWith("_SIDE")) {
                        kickLabel = isLeft ? "SNARE" : "CRASH";
                    } else if (!isLeft) {
                        kickLabel = "HI-HAT";
                    }

                    ctx.save();
                    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
                    ctx.font = "bold 32px monospace";
                    ctx.textAlign = "center";
                    ctx.shadowColor = color;
                    ctx.shadowBlur = 10;
                    ctx.fillText(kickLabel, mirrorX(normX), normY * canvas.height - 40);
                    ctx.restore();

                } else if (!isNeutral) {
                    // Holding state: leg is mid-air but not yet returned to neutral
                    if (activeZonesRef.current.has(legId)) {
                        frameActiveZones.add(legId);
                    }
                }

                // Draw the ankle tracking dot
                const displayX = mirrorX(normX);
                const displayY = normY * canvas.height;
                drawWristDot(ctx, displayX, displayY, color, isKicking);
            };

            for (const ankle of ankles) {
                drawAnkle(ankle.index, ankle.color, ankle.isLeft);
            }
        }

        // Update active zones for next frame's rendering
        activeZonesRef.current = frameActiveZones;

        requestRef.current = requestAnimationFrame(renderLoop);
    };

    // Start the loop when playing state changes
    useEffect(() => {
        if (isModelLoaded) {
            requestRef.current = requestAnimationFrame(renderLoop);
        } else if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
        }

        return () => {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        };
    }, [isModelLoaded]);

    return (
        <div className="relative w-full max-w-4xl mx-auto rounded-xl overflow-hidden bg-black aspect-video shadow-2xl">
            <Webcam
                ref={webcamRef}
                mirrored={true}
                className="absolute inset-0 w-full h-full object-cover"
                onUserMedia={() => {
                    // Webcam is ready
                }}
            />

            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none"
            />
        </div>
    );
}
