import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { encryptSecret, verifyState } from '@/lib/zoom/crypto';
import { exchangeCodeForTokens, getZoomUser } from '@/lib/zoom/oauth';

type OAuthState = { client_name?: string; client_id?: string; ghl_location_id?: string; return_to?: string };

function html(title: string, message: string, ok = true) {
  return new NextResponse(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head><body style="font-family:Arial,sans-serif;text-align:center;padding:48px;background:#f5f7fb;color:#172033"><main style="background:white;padding:36px;border-radius:14px;max-width:560px;margin:0 auto;box-shadow:0 10px 30px rgba(15,23,42,.08)"><h1 style="color:${ok ? '#2563eb' : '#dc2626'}">${ok ? '✅' : '⚠️'} ${title}</h1><p style="font-size:18px;line-height:1.45">${message}</p><p style="color:#64748b;font-size:13px">Você já pode fechar esta aba.</p></main></body></html>`, { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: ok ? 200 : 400 });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const stateParam = searchParams.get('state');
  if (!code || !stateParam) return html('Autorização inválida', 'Zoom não retornou code/state.', false);

  try {
    const state = verifyState<OAuthState>(stateParam);
    const tokens = await exchangeCodeForTokens(code);
    const zoomUser = await getZoomUser(tokens.access_token);
    const { error } = await getSupabaseAdmin().from('zoom_oauth_tokens').upsert({
      client_id: state.client_id || state.client_name,
      client_name: state.client_name,
      ghl_location_id: state.ghl_location_id || null,
      zoom_user_id: zoomUser.id,
      zoom_account_id: zoomUser.account_id || null,
      zoom_email: zoomUser.email || null,
      access_token_encrypted: encryptSecret(tokens.access_token),
      refresh_token_encrypted: encryptSecret(tokens.refresh_token),
      expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      scope: tokens.scope || null,
      api_url: tokens.api_url || 'https://api.zoom.us',
      status: 'active',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'client_id' });

    if (error) throw error;
    return html('Zoom conectado', `Zoom autorizado para <strong>${state.client_name}</strong>. Agora a presença pode ser rastreada automaticamente.`);
  } catch (error: any) {
    console.error('Zoom OAuth callback error:', error);
    return html('Erro ao conectar Zoom', error.message || 'Falha inesperada.', false);
  }
}
