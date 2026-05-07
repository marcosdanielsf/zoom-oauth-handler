import { zoomClientId, zoomClientSecret, zoomRedirectUri } from './config';

export type ZoomTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope?: string;
  token_type?: string;
  api_url?: string;
};

export async function exchangeCodeForTokens(code: string): Promise<ZoomTokenResponse> {
  const response = await fetch('https://zoom.us/oauth/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${zoomClientId()}:${zoomClientSecret()}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: zoomRedirectUri() }),
  });
  if (!response.ok) throw new Error(`Zoom token exchange failed: ${await response.text()}`);
  return response.json();
}

export async function getZoomUser(accessToken: string) {
  const response = await fetch('https://api.zoom.us/v2/users/me', { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!response.ok) throw new Error(`Zoom user lookup failed: ${await response.text()}`);
  return response.json();
}
