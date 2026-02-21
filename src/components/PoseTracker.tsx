"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";
import { Loader2, Play } from "lucide-react";
import { HAND_HIT_ZONES, findActiveZone, HitZone } from "@/lib/hitZones";
import { useAudioEngine } from "@/hooks/useAudioEngine";

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

    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
    const requestRef = useRef<number | undefined>(undefined);

    // Track which zones are currently active for visual feedback
    const activeZonesRef = useRef<Set<string>>(new Set());

    // Audio engine
    const { isReady: isAudioReady, startAudio, playZone, cleanup: cleanupAudio } = useAudioEngine();

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

    // Handle start button — unlocks audio and starts tracking
    const handleStart = useCallback(async () => {
        await startAudio();
        setIsPlaying(true);
    }, [startAudio]);

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
        if (
            !isPlaying ||
            !poseLandmarkerRef.current ||
            !webcamRef.current ||
            !webcamRef.current.video ||
            !canvasRef.current
        ) {
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

        // ----- Draw hit zones (background layer) -----
        for (const zone of HAND_HIT_ZONES) {
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

            for (const wrist of wrists) {
                const landmark = poses[wrist.index];
                if (!landmark || landmark.visibility < 0.5) continue;

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
                    }
                }

                // Draw the wrist dot (mirrored for display)
                const displayX = mirrorX(normX);
                const displayY = normY * canvas.height;
                drawWristDot(ctx, displayX, displayY, wrist.color, isInZone);
            }

            // Draw ankle dots (visual only for now, no audio)
            const ankles = [
                { index: TARGET_JOINTS.leftAnkle, color: "#339af0" },
                { index: TARGET_JOINTS.rightAnkle, color: "#fcc419" },
            ];

            for (const ankle of ankles) {
                const landmark = poses[ankle.index];
                if (!landmark || landmark.visibility < 0.5) continue;
                const x = mirrorX(landmark.x);
                const y = landmark.y * canvas.height;
                drawWristDot(ctx, x, y, ankle.color, false);
            }
        }

        // Update active zones for next frame's rendering
        activeZonesRef.current = frameActiveZones;

        requestRef.current = requestAnimationFrame(renderLoop);
    };

    // Start the loop when playing state changes
    useEffect(() => {
        if (isPlaying && isModelLoaded) {
            requestRef.current = requestAnimationFrame(renderLoop);
        } else if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
        }

        return () => {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        };
    }, [isPlaying, isModelLoaded, isAudioReady]);

    return (
        <div className="relative w-full max-w-4xl mx-auto rounded-xl overflow-hidden bg-black aspect-video shadow-2xl">
            {/* Loading overlay */}
            {!isModelLoaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white z-20">
                    <Loader2 className="w-10 h-10 animate-spin mb-4 text-purple-500" />
                    <p className="animate-pulse">Loading AI Pose Model...</p>
                </div>
            )}

            {/* Start button — shows after model loads but before playing */}
            {isModelLoaded && !isPlaying && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 z-20">
                    <button
                        onClick={handleStart}
                        className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-white text-xl font-bold shadow-lg hover:shadow-purple-500/50 hover:scale-105 transition-all duration-200 cursor-pointer"
                    >
                        <Play className="w-6 h-6 group-hover:scale-110 transition-transform" />
                        Start Session
                    </button>
                    <p className="text-gray-400 text-sm mt-4">
                        Click to enable audio &amp; start tracking
                    </p>
                </div>
            )}

            <Webcam
                ref={webcamRef}
                mirrored={true}
                className="absolute inset-0 w-full h-full object-cover"
                onUserMedia={() => {
                    // Webcam is ready, but we wait for the Start button before playing
                }}
            />

            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none"
            />

            {/* HUD overlay */}
            <div className="absolute top-4 left-4 z-20 bg-black/50 p-2 text-white rounded text-xs font-mono">
                {isPlaying ? (
                    <span className="text-green-400">
                        Model Ready • Tracking Active {isAudioReady ? "• Audio ♪" : ""}
                    </span>
                ) : isModelLoaded ? (
                    <span className="text-yellow-400">Model Ready • Press Start</span>
                ) : (
                    <span className="text-yellow-400">Loading Model...</span>
                )}
            </div>
        </div>
    );
}
