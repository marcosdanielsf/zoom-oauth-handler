import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { verifyZoomWebhookSignature } from '@/lib/zoom/crypto';

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  if (!verifyZoomWebhookSignature(rawBody, req.headers.get('x-zm-request-timestamp'), req.headers.get('x-zm-signature'))) {
    return NextResponse.json({ error: 'Invalid Zoom signature' }, { status: 401 });
  }
  const body = JSON.parse(rawBody);
  const userId = body?.payload?.user_id || body?.payload?.object?.id;
  if (userId) {
    await getSupabaseAdmin().from('zoom_oauth_tokens').update({ status: 'deauthorized', updated_at: new Date().toISOString() }).eq('zoom_user_id', userId);
  }
  return NextResponse.json({ ok: true });
}
