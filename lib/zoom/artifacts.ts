import { getSupabaseAdmin } from '../supabase/server';
import { n8nSalesHeadWebhookUrl } from './config';
import { decryptSecret, encryptSecret } from './crypto';
import { refreshZoomTokens } from './oauth';

type ZoomRecordingFile = {
  id?: string;
  meeting_id?: string;
  recording_start?: string;
  recording_end?: string;
  file_type?: string;
  file_extension?: string;
  file_size?: number;
  play_url?: string;
  download_url?: string;
  status?: string;
  recording_type?: string;
};

type ZoomRecordingPayload = {
  event: string;
  zoom_account_id?: string;
  meeting_uuid?: string;
  meeting_id?: string | number;
  meeting_topic?: string;
  meeting_start_time?: string;
  host_id?: string;
  host_email?: string;
  duration?: number;
  total_size?: number;
  recording_count?: number;
  recording_files: ZoomRecordingFile[];
  raw_payload: unknown;
};

type ZoomTokenRow = {
  id: string;
  client_id: string;
  client_name: string | null;
  ghl_location_id: string | null;
  zoom_account_id: string | null;
  access_token_encrypted: string;
  refresh_token_encrypted: string;
  expires_at: string;
  api_url: string | null;
};

const RELEVANT_FILE_TYPES = new Set(['TRANSCRIPT', 'CHAT', 'CC', 'TIMELINE']);

export function normalizeRecordingEvent(body: any): ZoomRecordingPayload | null {
  if (!['recording.completed', 'recording.transcript_completed'].includes(body?.event)) return null;

  const obj = body?.payload?.object || {};
  const recordingFiles = Array.isArray(obj?.recording_files) ? obj.recording_files : [];

  return {
    event: body.event,
    zoom_account_id: body?.payload?.account_id,
    meeting_uuid: obj?.uuid,
    meeting_id: obj?.id,
    meeting_topic: obj?.topic,
    meeting_start_time: obj?.start_time,
    host_id: obj?.host_id,
    host_email: obj?.host_email,
    duration: obj?.duration,
    total_size: obj?.total_size,
    recording_count: obj?.recording_count,
    recording_files: recordingFiles,
    raw_payload: body,
  };
}

async function getTokenForAccount(zoomAccountId?: string): Promise<ZoomTokenRow | null> {
  if (!zoomAccountId) return null;
  const { data, error } = await getSupabaseAdmin()
    .from('zoom_oauth_tokens')
    .select('id, client_id, client_name, ghl_location_id, zoom_account_id, access_token_encrypted, refresh_token_encrypted, expires_at, api_url')
    .eq('zoom_account_id', zoomAccountId)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as ZoomTokenRow | null;
}

async function getValidAccessToken(row: ZoomTokenRow): Promise<string> {
  const expiresAt = new Date(row.expires_at).getTime();
  const shouldRefresh = !Number.isFinite(expiresAt) || expiresAt - Date.now() < 2 * 60 * 1000;
  if (!shouldRefresh) return decryptSecret(row.access_token_encrypted);

  const refreshed = await refreshZoomTokens(decryptSecret(row.refresh_token_encrypted));
  const accessToken = refreshed.access_token;
  const refreshToken = refreshed.refresh_token || decryptSecret(row.refresh_token_encrypted);
  const { error } = await getSupabaseAdmin()
    .from('zoom_oauth_tokens')
    .update({
      access_token_encrypted: encryptSecret(accessToken),
      refresh_token_encrypted: encryptSecret(refreshToken),
      expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
      scope: refreshed.scope || null,
      api_url: refreshed.api_url || row.api_url || 'https://api.zoom.us',
      updated_at: new Date().toISOString(),
    })
    .eq('id', row.id);
  if (error) throw error;
  return accessToken;
}

function isRelevantArtifact(file: ZoomRecordingFile) {
  const fileType = (file.file_type || '').toUpperCase();
  const extension = (file.file_extension || '').toUpperCase();
  return RELEVANT_FILE_TYPES.has(fileType) || ['VTT', 'TXT'].includes(extension);
}

async function downloadZoomTextFile(file: ZoomRecordingFile, accessToken: string): Promise<string | null> {
  if (!file.download_url || !isRelevantArtifact(file)) return null;

  const url = file.download_url.includes('access_token=') ? file.download_url : file.download_url;
  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!response.ok) throw new Error(`Zoom artifact download failed (${file.file_type || file.file_extension}): ${response.status} ${await response.text()}`);
  return response.text();
}

function stripVtt(text: string) {
  return text
    .replace(/^WEBVTT.*$/gim, '')
    .replace(/^\d+\s*$/gm, '')
    .replace(/^\d{2}:\d{2}:\d{2}\.\d{3}\s+-->.*$/gm, '')
    .replace(/<[^>]+>/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');
}

function analyzeChatEngagement(chatText: string | null) {
  if (!chatText) return { message_count: 0, participant_count: 0, messages_by_participant: {}, top_participants: [] };

  const messagesByParticipant: Record<string, number> = {};
  let messageCount = 0;

  for (const rawLine of chatText.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    const match = line.match(/(?:From\s+)?([^:]{2,80}):\s+.+/) || line.match(/^\d{2}:\d{2}:\d{2}\s+([^:]{2,80}):\s+.+/);
    if (match?.[1]) {
      const name = match[1].replace(/^\d{2}:\d{2}:\d{2}\s+/, '').trim();
      messagesByParticipant[name] = (messagesByParticipant[name] || 0) + 1;
      messageCount += 1;
    } else if (line.length > 3) {
      messageCount += 1;
    }
  }

  const topParticipants = Object.entries(messagesByParticipant)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  return {
    message_count: messageCount,
    participant_count: Object.keys(messagesByParticipant).length,
    messages_by_participant: messagesByParticipant,
    top_participants: topParticipants,
  };
}

function computeLeadScoreDelta(transcriptText: string | null, chatText: string | null) {
  const text = `${transcriptText || ''}\n${chatText || ''}`.toLowerCase();
  const chat = analyzeChatEngagement(chatText);
  let delta = 0;
  const reasons: string[] = [];

  if (transcriptText && transcriptText.trim().length > 500) { delta += 10; reasons.push('call_transcribed'); }
  if (chat.message_count >= 1) { delta += 10; reasons.push('asked_or_answered_in_chat'); }
  if (chat.message_count >= 3) { delta += 10; reasons.push('high_chat_activity'); }
  if (chat.message_count >= 6) { delta += 10; reasons.push('very_high_chat_activity'); }

  const buyingSignals = ['preço', 'valor', 'investimento', 'começar', 'fechar', 'contratar', 'proposta', 'pagamento', 'parcelar', 'boleto', 'cartão'];
  const objectionSignals = ['vou pensar', 'sem orçamento', 'caro', 'não tenho dinheiro', 'depois eu vejo', 'mais pra frente'];

  const buyingMatches = buyingSignals.filter((signal) => text.includes(signal));
  const objectionMatches = objectionSignals.filter((signal) => text.includes(signal));

  if (buyingMatches.length) { delta += Math.min(25, buyingMatches.length * 8); reasons.push(`buying_signals:${buyingMatches.join(',')}`); }
  if (objectionMatches.length) { delta -= Math.min(20, objectionMatches.length * 8); reasons.push(`objections:${objectionMatches.join(',')}`); }

  return { delta, reasons, chat_engagement: chat };
}

export async function processRecordingArtifacts(payload: ZoomRecordingPayload) {
  const tokenRow = await getTokenForAccount(payload.zoom_account_id);
  if (!tokenRow) {
    await storeMeetingArtifact(payload, null, null, null, { status: 'missing_zoom_oauth_token' });
    return { stored: true, downloaded: false, reason: 'missing_zoom_oauth_token' };
  }

  const accessToken = await getValidAccessToken(tokenRow);
  let transcriptText: string | null = null;
  let chatText: string | null = null;
  const downloadedFiles: Array<ZoomRecordingFile & { text_length?: number }> = [];

  for (const file of payload.recording_files.filter(isRelevantArtifact)) {
    const text = await downloadZoomTextFile(file, accessToken);
    if (!text) continue;

    const fileType = (file.file_type || '').toUpperCase();
    const extension = (file.file_extension || '').toUpperCase();
    const normalized = extension === 'VTT' || fileType === 'TRANSCRIPT' || fileType === 'CC' ? stripVtt(text) : text.trim();

    if (fileType === 'CHAT' || extension === 'TXT') chatText = [chatText, normalized].filter(Boolean).join('\n\n');
    else transcriptText = [transcriptText, normalized].filter(Boolean).join('\n\n');

    downloadedFiles.push({ ...file, text_length: normalized.length });
  }

  const analysis = computeLeadScoreDelta(transcriptText, chatText);
  const artifact = await storeMeetingArtifact(payload, tokenRow, transcriptText, chatText, {
    status: 'processed',
    downloaded_files: downloadedFiles,
    lead_score_delta: analysis.delta,
    lead_score_reasons: analysis.reasons,
    chat_engagement: analysis.chat_engagement,
  });

  await notifySalesHead({ payload, token: tokenRow, transcriptText, chatText, analysis, artifact });
  return { stored: true, downloaded: downloadedFiles.length > 0, lead_score_delta: analysis.delta };
}

async function storeMeetingArtifact(
  payload: ZoomRecordingPayload,
  tokenRow: ZoomTokenRow | null,
  transcriptText: string | null,
  chatText: string | null,
  processing: Record<string, unknown>,
) {
  const row = {
    zoom_account_id: payload.zoom_account_id || null,
    client_id: tokenRow?.client_id || null,
    client_name: tokenRow?.client_name || null,
    ghl_location_id: tokenRow?.ghl_location_id || null,
    meeting_uuid: payload.meeting_uuid || null,
    meeting_id: payload.meeting_id ? String(payload.meeting_id) : null,
    meeting_topic: payload.meeting_topic || null,
    meeting_start_time: payload.meeting_start_time || null,
    host_id: payload.host_id || null,
    host_email: payload.host_email || null,
    duration_minutes: payload.duration || null,
    transcript_text: transcriptText,
    chat_text: chatText,
    recording_files: payload.recording_files,
    processing_status: String(processing.status || 'processed'),
    analysis: processing,
    raw_payload: payload.raw_payload,
    processed_at: new Date().toISOString(),
  };

  const { data, error } = await getSupabaseAdmin()
    .from('zoom_meeting_artifacts')
    .upsert(row, { onConflict: 'meeting_uuid,meeting_id' })
    .select('id')
    .single();
  if (error) throw error;
  return data;
}

async function notifySalesHead(input: {
  payload: ZoomRecordingPayload;
  token: ZoomTokenRow;
  transcriptText: string | null;
  chatText: string | null;
  analysis: ReturnType<typeof computeLeadScoreDelta>;
  artifact: any;
}) {
  const url = n8nSalesHeadWebhookUrl();
  if (!url) return;

  const body = {
    source: 'zoom_connector',
    event: input.payload.event,
    artifact_id: input.artifact?.id,
    client_id: input.token.client_id,
    client_name: input.token.client_name,
    ghl_location_id: input.token.ghl_location_id,
    zoom_account_id: input.payload.zoom_account_id,
    meeting_uuid: input.payload.meeting_uuid,
    meeting_id: input.payload.meeting_id ? String(input.payload.meeting_id) : null,
    meeting_topic: input.payload.meeting_topic,
    meeting_start_time: input.payload.meeting_start_time,
    host_email: input.payload.host_email,
    transcript_text: input.transcriptText,
    chat_text: input.chatText,
    chat_engagement: input.analysis.chat_engagement,
    lead_score_delta: input.analysis.delta,
    lead_score_reasons: input.analysis.reasons,
    instruction: 'Analise a call como Head de Vendas: dores, objeções, intenção de compra, próximos passos, follow-up recomendado e novo lead score.',
  };

  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!response.ok) throw new Error(`sales head webhook failed: ${response.status} ${await response.text()}`);
}
