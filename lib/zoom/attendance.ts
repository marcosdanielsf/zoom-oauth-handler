import { getSupabaseAdmin } from '../supabase/server';
import { n8nWebhookUrl } from './config';

type AttendancePayload = {
  event: string;
  zoom_account_id?: string;
  meeting_uuid?: string;
  meeting_id?: string | number;
  meeting_topic?: string;
  meeting_start_time?: string;
  participant_id?: string;
  participant_name?: string;
  participant_email?: string;
  participant_join_time?: string;
  participant_leave_time?: string;
  duration?: number;
  raw_payload: unknown;
};

export function normalizeAttendanceEvent(body: any): AttendancePayload | null {
  const event = body?.event;
  const obj = body?.payload?.object || {};
  const participant = obj?.participant || {};
  if (!['meeting.participant_joined', 'meeting.participant_left', 'meeting.ended', 'meeting.started'].includes(event)) return null;
  return {
    event,
    zoom_account_id: body?.payload?.account_id,
    meeting_uuid: obj?.uuid,
    meeting_id: obj?.id,
    meeting_topic: obj?.topic,
    meeting_start_time: obj?.start_time,
    participant_id: participant?.id || participant?.user_id,
    participant_name: participant?.user_name || participant?.participant_user_name,
    participant_email: participant?.email,
    participant_join_time: participant?.join_time,
    participant_leave_time: participant?.leave_time,
    duration: participant?.duration,
    raw_payload: body,
  };
}

export async function storeAttendanceEvent(payload: AttendancePayload) {
  const { error } = await getSupabaseAdmin().from('zoom_attendance_events').insert({
    event_type: payload.event,
    zoom_account_id: payload.zoom_account_id || null,
    meeting_uuid: payload.meeting_uuid || null,
    meeting_id: payload.meeting_id ? String(payload.meeting_id) : null,
    meeting_topic: payload.meeting_topic || null,
    meeting_start_time: payload.meeting_start_time || null,
    participant_id: payload.participant_id || null,
    participant_name: payload.participant_name || null,
    participant_email: payload.participant_email || null,
    join_time: payload.participant_join_time || null,
    leave_time: payload.participant_leave_time || null,
    duration_seconds: payload.duration || null,
    raw_payload: payload.raw_payload,
  });
  if (error) throw error;
}

export async function notifyN8n(payload: AttendancePayload) {
  const url = n8nWebhookUrl();
  if (!url) return;
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  if (!response.ok) throw new Error(`n8n webhook failed: ${response.status} ${await response.text()}`);
}
