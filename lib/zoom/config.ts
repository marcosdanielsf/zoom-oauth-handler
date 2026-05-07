import { optionalEnv, requiredEnv } from '../env';

export function appBaseUrl() {
  return optionalEnv('APP_BASE_URL', 'https://zoom-oauth-handler.vercel.app').replace(/\/$/, '');
}

export function zoomRedirectUri() {
  return optionalEnv('ZOOM_REDIRECT_URI', `${appBaseUrl()}/api/zoom/oauth-callback`);
}

export function zoomClientId() { return requiredEnv('ZOOM_CLIENT_ID'); }
export function zoomClientSecret() { return requiredEnv('ZOOM_CLIENT_SECRET'); }
export function n8nWebhookUrl() { return optionalEnv('N8N_ATTENDANCE_WEBHOOK_URL'); }
