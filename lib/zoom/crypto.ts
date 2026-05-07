import crypto from 'crypto';
import { requiredEnv } from '../env';

const ALGO = 'aes-256-gcm';
const nowSeconds = () => Math.floor(Date.now() / 1000);

function encryptionKey() {
  return crypto.createHash('sha256').update(requiredEnv('TOKEN_ENCRYPTION_SECRET')).digest();
}

export function encryptSecret(value: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

export function signState(payload: Record<string, unknown>, ttlSeconds = 15 * 60): string {
  const body = { ...payload, iat: nowSeconds(), exp: nowSeconds() + ttlSeconds, nonce: crypto.randomUUID() };
  const encoded = Buffer.from(JSON.stringify(body)).toString('base64url');
  const sig = crypto.createHmac('sha256', requiredEnv('OAUTH_STATE_SECRET')).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

export function verifyState<T extends Record<string, unknown>>(state: string): T {
  const [encoded, sig] = state.split('.');
  if (!encoded || !sig) throw new Error('Invalid OAuth state');
  const expected = crypto.createHmac('sha256', requiredEnv('OAUTH_STATE_SECRET')).update(encoded).digest('base64url');
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) throw new Error('Invalid OAuth state signature');
  const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as T & { exp?: number };
  if (!payload.exp || payload.exp < nowSeconds()) throw new Error('Expired OAuth state');
  return payload;
}

export function verifyZoomWebhookSignature(rawBody: string, timestamp: string | null, signature: string | null): boolean {
  if (!timestamp || !signature) return false;
  const tsMs = Number(timestamp) * 1000;
  if (!Number.isFinite(tsMs) || Math.abs(Date.now() - tsMs) > 5 * 60 * 1000) return false;
  const message = `v0:${timestamp}:${rawBody}`;
  const expected = `v0=${crypto.createHmac('sha256', requiredEnv('ZOOM_WEBHOOK_SECRET_TOKEN')).update(message).digest('hex')}`;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export function zoomChallengeResponse(plainToken: string) {
  return {
    plainToken,
    encryptedToken: crypto.createHmac('sha256', requiredEnv('ZOOM_WEBHOOK_SECRET_TOKEN')).update(plainToken).digest('hex'),
  };
}
