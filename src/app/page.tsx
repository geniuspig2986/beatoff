"use client";

import { useState } from "react";
import PoseTracker from "@/components/PoseTracker";
import GameUI from "@/components/GameUI";
import HomeComponent from "@/components/HomeComponent";

export default function Home() {
  const [isPlaying, setIsPlaying] = useState(false);

  if (!isPlaying) {
    return <HomeComponent onStartGame={() => setIsPlaying(true)} />;
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-8 relative">
      <div className="max-w-5xl w-full flex flex-col gap-8 text-center relative z-10">
        {/* The Game Area */}
        <div className="w-full relative">
          <PoseTracker />
          <GameUI />
        </div>
      </div>
    </main>
  );
}
