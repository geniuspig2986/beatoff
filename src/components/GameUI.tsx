"use client";

import React, { useEffect } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { Loader2 } from 'lucide-react';
import { initAudio } from '@/lib/audioEngine';

const GAME_LENGTH_SECONDS = 15; // Set to 15s for testing, change to 60 for prod

export default function GameUI() {
    const {
        gameState, setGameState,
        isModelLoaded,
        currentPlayer, setCurrentPlayer,
        timeLeft, setTimeLeft, decrementTime,
        player1Sequence, player2Sequence,
        activeTheme, setActiveTheme,
        judgeFeedback, setJudgeFeedback,
        twitterPermission, setTwitterPermission,
        recordedVideoBlob, setRecordedVideoBlob,
        resetGame
    } = useGameStore();

    // Timer Countdown Logic
    useEffect(() => {
        let timerId: NodeJS.Timeout;

        // Only countdown if we are in recording state
        if (gameState === 'RECORDING' && timeLeft > 0) {
            timerId = setInterval(() => {
                decrementTime();
            }, 1000);
        }
        // State transitions based on timer
        else if (gameState === 'RECORDING' && timeLeft === 0) {
            if (currentPlayer === 1) {
                // Transition to Player 2
                setGameState('GET_READY');
                setCurrentPlayer(2);
                setTimeLeft(GAME_LENGTH_SECONDS);
            } else {
                // Both players finished
                finishRecordingAndEvaluate();
            }
        }

        return () => clearInterval(timerId);
    }, [gameState, timeLeft, currentPlayer]);

    const handlePlayClick = () => {
        // If permission has not been set yet, don't start the game; show the modal
        if (twitterPermission === null) {
            // We'll reveal the modal by setting gameState to a new temporary state, 
            // but for simplicity let's just use local state or handle it within IDLE
            return;
        }
        startGame();
    };

    const startGame = async () => {
        await initAudio();
        resetGame();
        setGameState('GET_READY');
        setTimeLeft(GAME_LENGTH_SECONDS); // Using 15s for testing, 60s for actual game

        // Quick 2-second "Get Ready" before recording
        setTimeout(() => {
            setGameState('RECORDING');
        }, 2000);
    };

    const startPlayer2Turn = () => {
        setGameState('RECORDING');
    };

    const finishRecordingAndEvaluate = async () => {
        setGameState('EVALUATING');

        try {
            // Send payload to FastAPI backend
            // (Hitboxes not defined, so data arrays are empty or mock for now)
            const payload = {
                theme: activeTheme,
                gameMode: 'COOP',
                player1Sequence: player1Sequence,
                player2Sequence: player2Sequence
            };

            // Use local Next.js API route which will proxy to the Python backend when configured,
            // otherwise returns a mock response for demo/dev (per stack constraints).
            const response = await fetch("/api/judge/freestyle", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            let data: any = null;
            if (!response.ok) {
                // Read backend error body for debugging and fail gracefully with mock
                const text = await response.text().catch(() => "(no body)");
                console.error("Judge API returned non-OK:", response.status, text);

                // Fallback mock response so UI continues (demo-friendly)
                data = {
                    roast: "The Backend API returned an error; showing mock results for now.",
                    scoreP1: 84,
                    scoreP2: 41,
                    winner: '1',
                    audioUrl: ''
                };
            } else {
                data = await response.json();
            }

            // Apply judge feedback (real or mock)
            setJudgeFeedback(data);
            // MOCK: wait a short tick to let MediaRecorder finish generating the blob
            await new Promise((resolve) => setTimeout(resolve, 500));

            // Optional: Upload to Twitter if permitted
            // We use standard React state check, or the store's current value.
            // Since we need the *latest* blob, we might rely on a store slice getter or local state, 
            // but for simplicity, useGameStore.getState() gets the very latest blob
            const latestState = useGameStore.getState();
            if (latestState.twitterPermission && latestState.recordedVideoBlob) {
                try {
                    console.log("Uploading video to Twitter...");
                    const formData = new FormData();
                    formData.append("video", latestState.recordedVideoBlob, "performance.webm");
                    formData.append("score", String(data.scoreP1)); // or aggregate
                    formData.append("roast", data.roast);

                    const tweetResponse = await fetch("/api/social/twitter", {
                        method: "POST",
                        body: formData
                    });

                    if (tweetResponse.ok) {
                        const tweetData = await tweetResponse.json();
                        console.log("Tweet successful!", tweetData.url);
                    }
                } catch (e) {
                    console.error("Failed to post to Twitter", e);
                }
            }

            setGameState('RESULT');
        } catch (e) {
            console.error("Evaluation Error", e);
            setJudgeFeedback({
                roast: "The Backend API is offline! I can't even roast you right now, which is the biggest roast of all.",
                scoreP1: 0,
                scoreP2: 0,
                winner: 'TIE'
            });
            setGameState('RESULT');
        }
    };

    return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-50">

            {/* Top Bar - Status & Timer */}
            <div className="flex justify-between items-start">
                <div className="bg-black/60 backdrop-blur-md rounded-lg p-4 pointer-events-auto">
                    <h2 className="text-xl font-bold uppercase text-purple-400">
                        Theme: {activeTheme}
                    </h2>
                    <div className="text-sm text-gray-300">
                        <p>Co-Op Mode - Player {currentPlayer}</p>
                    </div>
                </div>

                {gameState === 'RECORDING' && (
                    <div className="bg-red-500 text-white text-5xl font-black rounded-lg px-8 py-4 animate-pulse pointer-events-none">
                        {timeLeft}s
                    </div>
                )}
            </div>

            {/* Center Screen Overlays */}
            <div className="flex-grow flex items-center justify-center pointer-events-auto">

                {gameState === 'IDLE' && !isModelLoaded && (
                    <div className="flex flex-col items-center justify-center bg-gray-900/90 p-8 rounded-2xl border-2 border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.4)] backdrop-blur-md">
                        <Loader2 className="w-16 h-16 animate-spin mb-4 text-purple-500" />
                        <h2 className="text-2xl font-bold text-white mb-2 animate-pulse">Loading AI Pose Model</h2>
                        <p className="text-purple-300 text-sm">Warming up the neural engines...</p>
                    </div>
                )}

                {gameState === 'IDLE' && isModelLoaded && twitterPermission === null && (
                    <div className="flex flex-col items-center justify-center bg-gray-900/90 p-8 rounded-2xl border-2 border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.4)] backdrop-blur-md max-w-lg text-center gap-6">
                        <h2 className="text-3xl font-black text-white">Share to Twitter?</h2>
                        <p className="text-gray-300 text-lg">
                            We'd love to record your sweet (or terrible) performance and post it to X along with the AI Judge's roast!
                        </p>
                        <div className="flex gap-4 w-full justify-center mt-4">
                            <button
                                onClick={() => setTwitterPermission(false)}
                                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-full text-lg transition-all border border-gray-500">
                                No Thanks
                            </button>
                            <button
                                onClick={() => { setTwitterPermission(true); }}
                                className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 px-8 rounded-full text-lg shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all flex items-center gap-2">
                                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                                Yes, Post It!
                            </button>
                        </div>
                    </div>
                )}

                {gameState === 'IDLE' && isModelLoaded && twitterPermission !== null && (
                    <div className="flex gap-4">
                        <button
                            onClick={startGame}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-8 rounded-full text-xl shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all">
                            Play BeatOff!
                        </button>
                    </div>
                )}

                {gameState === 'GET_READY' && currentPlayer === 1 && (
                    <h1 className="text-7xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,1)] animate-bounce">
                        GET READY!
                    </h1>
                )}

                {gameState === 'GET_READY' && currentPlayer === 2 && (
                    <div className="text-center bg-black/80 p-8 rounded-2xl">
                        <h1 className="text-5xl font-black text-blue-400 mb-4">
                            PLAYER 2'S TURN
                        </h1>
                        <button
                            onClick={startPlayer2Turn}
                            className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 px-8 rounded-full text-xl">
                            I'm Ready
                        </button>
                    </div>
                )}

                {gameState === 'EVALUATING' && (
                    <div className="text-center bg-black/90 p-8 rounded-2xl flex flex-col items-center">
                        <Loader2 className="w-16 h-16 animate-spin text-pink-500 mb-4" />
                        <h2 className="text-3xl font-bold text-white mb-2">The AI is Judging You...</h2>
                        <p className="text-pink-400">Generating ruthless critique and sending to Twitter.</p>
                    </div>
                )}

                {gameState === 'RESULT' && judgeFeedback && (
                    <div className="bg-gray-900 border-2 border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.4)] p-8 text-center max-w-2xl rounded-2xl">
                        <h2 className="text-4xl font-black text-yellow-400 mb-6 uppercase tracking-wider">
                            Winner: Player {judgeFeedback.winner}
                        </h2>

                        <div className="flex justify-center gap-12 mb-6">
                            <div>
                                <div className="text-gray-400 text-sm uppercase">Player 1</div>
                                <div className="text-5xl font-bold text-white">{judgeFeedback.scoreP1}</div>
                            </div>
                            <div>
                                <div className="text-gray-400 text-sm uppercase">Player 2</div>
                                <div className="text-5xl font-bold text-white">{judgeFeedback.scoreP2}</div>
                            </div>
                        </div>

                        <p className="text-xl text-gray-200 italic">&ldquo;{judgeFeedback.roast}&rdquo;</p>

                        <div className="mt-8 flex justify-center gap-4">
                            <button
                                onClick={resetGame}
                                className="bg-white text-black font-bold py-3 px-8 rounded-full hover:bg-gray-200">
                                Play Again
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
