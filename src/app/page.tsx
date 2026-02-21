import PoseTracker from "@/components/PoseTracker";
import GameUI from "@/components/GameUI";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-8 relative">
      <div className="max-w-5xl w-full flex flex-col gap-8 text-center relative z-10">

        <div className="space-y-4">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            BeatOff AI
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Ensure your whole body is visible in the frame.
          </p>
        </div>

        {/* The Game Area */}
        <div className="w-full relative">
          <PoseTracker />
          <GameUI />
        </div>

      </div>
    </main>
  );
}
