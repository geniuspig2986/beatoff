import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    const backend = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (backend) {
      // Proxy to configured backend
      const res = await fetch(`${backend.replace(/\/$/, '')}/api/judge/freestyle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      return new NextResponse(text, { status: res.status });
    }

    // Mock response for demo/dev when no backend is configured
    const p1 = Math.max(0, Math.min(100, Math.floor(Math.random() * 100) + 10));
    const p2 = Math.max(0, Math.min(100, Math.floor(Math.random() * 100)));
    const winner = p1 === p2 ? 'TIE' : (p1 > p2 ? '1' : '2');
    const roast = p1 === p2
      ? "A true tie — perfectly chaotic and equally questionable on both sides."
      : (p1 > p2
        ? "Player 1 showed merciless groove control — Player 2, practice exists for a reason."
        : "Player 2 brought the chaos in a stunning comeback — Player 1, consider jazz lessons.");

    const result = {
      scoreP1: p1,
      scoreP2: p2,
      winner,
      roast,
      audioUrl: 'https://storage.googleapis.com/mediapipe-models/placeholder_audio.mp3'
    };

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
