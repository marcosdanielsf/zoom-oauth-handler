create table if not exists public.zoom_oauth_tokens (
  id uuid primary key default gen_random_uuid(),
  client_id text not null unique,
  client_name text,
  ghl_location_id text,
  zoom_user_id text,
  zoom_account_id text,
  zoom_email text,
  access_token_encrypted text not null,
  refresh_token_encrypted text not null,
  expires_at timestamptz not null,
  scope text,
  api_url text default 'https://api.zoom.us',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists zoom_oauth_tokens_zoom_account_idx on public.zoom_oauth_tokens (zoom_account_id);
create index if not exists zoom_oauth_tokens_ghl_location_idx on public.zoom_oauth_tokens (ghl_location_id);

create table if not exists public.zoom_attendance_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  zoom_account_id text,
  meeting_uuid text,
  meeting_id text,
  meeting_topic text,
  meeting_start_time timestamptz,
  participant_id text,
  participant_name text,
  participant_email text,
  join_time timestamptz,
  leave_time timestamptz,
  duration_seconds integer,
  raw_payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists zoom_attendance_meeting_idx on public.zoom_attendance_events (meeting_uuid, meeting_id);
create index if not exists zoom_attendance_participant_email_idx on public.zoom_attendance_events (participant_email);
create index if not exists zoom_attendance_created_idx on public.zoom_attendance_events (created_at desc);

create table if not exists public.zoom_meeting_artifacts (
  id uuid primary key default gen_random_uuid(),
  zoom_account_id text,
  client_id text,
  client_name text,
  ghl_location_id text,
  meeting_uuid text,
  meeting_id text,
  meeting_topic text,
  meeting_start_time timestamptz,
  host_id text,
  host_email text,
  duration_minutes integer,
  transcript_text text,
  chat_text text,
  recording_files jsonb not null default '[]'::jsonb,
  analysis jsonb not null default '{}'::jsonb,
  processing_status text not null default 'pending',
  raw_payload jsonb not null,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (meeting_uuid, meeting_id)
);

create index if not exists zoom_meeting_artifacts_account_idx on public.zoom_meeting_artifacts (zoom_account_id);
create index if not exists zoom_meeting_artifacts_client_idx on public.zoom_meeting_artifacts (client_id);
create index if not exists zoom_meeting_artifacts_meeting_idx on public.zoom_meeting_artifacts (meeting_uuid, meeting_id);
create index if not exists zoom_meeting_artifacts_created_idx on public.zoom_meeting_artifacts (created_at desc);
