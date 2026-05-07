import { NextRequest, NextResponse } from 'next/server';
import { zoomClientId, zoomRedirectUri } from '@/lib/zoom/config';
import { signState } from '@/lib/zoom/crypto';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientName = searchParams.get('client_name')?.trim();
    const clientId = searchParams.get('client_id')?.trim() || clientName;
    const ghlLocationId = searchParams.get('ghl_location_id')?.trim() || '';
    const returnTo = searchParams.get('return_to')?.trim() || '';
    if (!clientName) return NextResponse.json({ error: 'client_name is required' }, { status: 400 });

    const state = signState({ client_name: clientName, client_id: clientId, ghl_location_id: ghlLocationId, return_to: returnTo });
    const url = new URL('https://zoom.us/oauth/authorize');
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', zoomClientId());
    url.searchParams.set('redirect_uri', zoomRedirectUri());
    url.searchParams.set('state', state);
    return NextResponse.redirect(url);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
