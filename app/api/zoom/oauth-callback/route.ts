import { NextRequest, NextResponse } from 'next/server';

const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID || 'J63Tj5XnRImD6NjMLsehOA';
const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET || '2xYlUscmQ1RmGyrZ7PLzYHtEQETqtn3I';
const REDIRECT_URI = process.env.ZOOM_REDIRECT_URI || 'https://zoom-oauth-handler.vercel.app/api/zoom/oauth-callback';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state') || 'unknown';

  if (!code) {
    return new NextResponse('No code provided', { status: 400 });
  }

  try {
    const tokenResponse = await fetch('https://zoom.us/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: ZOOM_CLIENT_ID,
        client_secret: ZOOM_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      return new NextResponse(`Error: ${error}`, { status: 400 });
    }

    const tokens = await tokenResponse.json();
    console.log(`✅ Zoom OAuth success for ${state}`);

    return new NextResponse(
      `
      <html>
      <body style="font-family:Arial;text-align:center;padding:50px;background:#f5f5f5">
        <div style="background:white;padding:40px;border-radius:8px;max-width:500px;margin:0 auto">
          <h1 style="color:#2d8cff">✅ Sucesso!</h1>
          <p>Zoom autorizado para: <strong>${state}</strong></p>
          <p><small>Você pode fechar esta aba.</small></p>
        </div>
      </body>
      </html>
      `,
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  } catch (error: any) {
    return new NextResponse(`Error: ${error.message}`, { status: 500 });
  }
}
