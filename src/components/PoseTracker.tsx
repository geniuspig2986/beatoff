"use client";

import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";
import { Loader2 } from "lucide-react";

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
    const requestRef = useRef<number>();

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
                        // We downloaded this file into the public directory
                        modelAssetPath: "/pose_landmarker_lite.task",
                        delegate: "GPU",
                    },
                    runningMode: "VIDEO",
                    numPoses: 1, // Only tracking one person for now
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
        };
    }, []);

    // Tracking Loop
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

        // Clear previous frame drawn
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Get the pose estimation
        const startTimeMs = performance.now();
        const results = poseLandmarkerRef.current.detectForVideo(video, startTimeMs);

        if (results.landmarks && results.landmarks.length > 0) {
            const poses = results.landmarks[0]; // Get the first person

            // We need to mirror the coordinates because our webcam feed is mirrored visually
            const mirrorX = (x: number) => canvas.width - (x * canvas.width);

            // Helper to draw a joint
            const drawJoint = (index: number, color: string) => {
                const landmark = poses[index];
                // If presence or visibility is too low, don't draw
                if (landmark.presence < 0.5 || landmark.visibility < 0.5) return;

                const x = mirrorX(landmark.x);
                const y = landmark.y * canvas.height;

                ctx.beginPath();
                ctx.arc(x, y, 10, 0, 2 * Math.PI);
                ctx.fillStyle = color;
                ctx.fill();
                ctx.strokeStyle = "white";
                ctx.lineWidth = 2;
                ctx.stroke();
            };

            // Draw the target joints in different colors
            drawJoint(TARGET_JOINTS.leftWrist, "#ff0000"); // Red
            drawJoint(TARGET_JOINTS.rightWrist, "#00ff00"); // Green
            drawJoint(TARGET_JOINTS.leftAnkle, "#0000ff"); // Blue
            drawJoint(TARGET_JOINTS.rightAnkle, "#ffff00"); // Yellow
        }

        requestRef.current = requestAnimationFrame(renderLoop);
    };

    // Start the loop when playing state changes
    useEffect(() => {
        if (isPlaying) {
            requestRef.current = requestAnimationFrame(renderLoop);
        } else if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
        }

        return () => {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        };
    }, [isPlaying, isModelLoaded]);

    return (
        <div className="relative w-full max-w-4xl mx-auto rounded-xl overflow-hidden bg-black aspect-video shadow-2xl">
            {!isModelLoaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white z-20">
                    <Loader2 className="w-10 h-10 animate-spin mb-4 text-purple-500" />
                    <p className="animate-pulse">Loading AI Pose Model...</p>
                </div>
            )}

            <Webcam
                ref={webcamRef}
                mirrored={true} // Essential for motion/rhythm games so movement feels natural
                className="absolute inset-0 w-full h-full object-cover"
                onUserMedia={() => setIsPlaying(true)}
            />

            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none"
            />

            {/* HUD overlay for debugging stats */}
            <div className="absolute top-4 left-4 z-20 bg-black/50 p-2 text-white rounded text-xs font-mono">
                {isModelLoaded ? <span className="text-green-400">Model Ready • Tracking Active</span> : <span className="text-yellow-400">Loading Model...</span>}
            </div>
        </div>
    );
}
