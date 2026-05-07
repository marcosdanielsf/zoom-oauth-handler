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
