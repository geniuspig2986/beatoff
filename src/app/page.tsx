import PoseTracker from "@/components/PoseTracker";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-8">
      <div className="max-w-5xl w-full flex flex-col gap-8 text-center">

        <div className="space-y-4">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            BeatOff AI
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Motion tracking test platform. Step back and ensure your whole body is visible in the frame.
          </p>
        </div>

        {/* The Pose Tracker Component */}
        <div className="w-full">
          <PoseTracker />
        </div>

      </div>
    </main>
  );
}
