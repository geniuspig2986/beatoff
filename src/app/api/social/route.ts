import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const backend = process.env.NEXT_PUBLIC_BACKEND_URL;

    // We need to read the incoming form data (video + fields)
    const formData = await request.formData();

    if (backend) {
      // Proxy the formData to the backend
      const proxyRes = await fetch(`${backend.replace(/\/$/, '')}/api/social/twitter`, {
        method: 'POST',
        body: formData as any,
      });

      const text = await proxyRes.text();
      return new NextResponse(text, { status: proxyRes.status });
    }

    // Demo behavior: accept the upload and return a mock tweet URL
    // Return a fake tweet URL so the client can behave as if posted
    return NextResponse.json({
      success: true,
      message: 'Mock post accepted (demo mode)',
      url: 'https://x.com/mockuser/status/1234567890'
    });
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
