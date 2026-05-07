import { NextRequest, NextResponse } from 'next/server';
import { notifyN8n, normalizeAttendanceEvent, storeAttendanceEvent } from '@/lib/zoom/attendance';
import { verifyZoomWebhookSignature, zoomChallengeResponse } from '@/lib/zoom/crypto';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    if (!verifyZoomWebhookSignature(rawBody, req.headers.get('x-zm-request-timestamp'), req.headers.get('x-zm-signature'))) {
      return NextResponse.json({ error: 'Invalid Zoom signature' }, { status: 401 });
    }

    const body = JSON.parse(rawBody);
    if (body.event === 'endpoint.url_validation') return NextResponse.json(zoomChallengeResponse(body.payload?.plainToken));

    const attendance = normalizeAttendanceEvent(body);
    if (attendance) {
      await storeAttendanceEvent(attendance);
      await notifyN8n(attendance);
    }
    return NextResponse.json({ ok: true, tracked: Boolean(attendance) });
  } catch (error: any) {
    console.error('Zoom webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
