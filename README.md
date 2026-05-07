# MOTTIVME Zoom Connector

Conector Zoom para OAuth multi-cliente + webhooks de presença.

Fluxo:

1. Cliente autoriza Zoom em `/api/zoom/oauth-start`.
2. Callback troca `code` por tokens e salva no Supabase.
3. Zoom envia eventos para `/api/zoom/webhook`.
4. Eventos de presença são salvos em `zoom_attendance_events` e opcionalmente enviados para n8n.

## Setup

### 1. Variáveis de ambiente

Copie `.env.example` para `.env.local` no dev e configure no Vercel em produção.

Obrigatórias:

- `APP_BASE_URL`
- `ZOOM_CLIENT_ID`
- `ZOOM_CLIENT_SECRET`
- `ZOOM_REDIRECT_URI`
- `ZOOM_WEBHOOK_SECRET_TOKEN`
- `OAUTH_STATE_SECRET`
- `TOKEN_ENCRYPTION_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Opcional:

- `N8N_ATTENDANCE_WEBHOOK_URL`

Gere secrets com:

```bash
openssl rand -base64 48
```

### 2. Supabase

Rode `supabase/schema.sql` no SQL Editor.

### 3. Zoom App

Configure no Zoom Marketplace:

- OAuth Redirect URL: `https://seu-dominio/api/zoom/oauth-callback`
- Event Notification URL: `https://seu-dominio/api/zoom/webhook`
- Deauthorization URL: `https://seu-dominio/api/zoom/deauthorize`

Eventos recomendados:

- `meeting.started`
- `meeting.ended`
- `meeting.participant_joined`
- `meeting.participant_left`

Scopes mínimos dependem do app, mas para OAuth + usuário atual geralmente precisa de leitura de user/me e eventos de meeting.

## Uso

Tela simples:

```text
/
```

Link direto:

```text
/api/zoom/oauth-start?client_name=Cliente%20ABC&client_id=abc&ghl_location_id=LOCATION_ID
```

## Payload enviado ao n8n

Quando `N8N_ATTENDANCE_WEBHOOK_URL` estiver configurado, o app envia:

```json
{
  "event": "meeting.participant_joined",
  "zoom_account_id": "...",
  "meeting_uuid": "...",
  "meeting_id": "...",
  "meeting_topic": "...",
  "participant_name": "...",
  "participant_email": "...",
  "participant_join_time": "...",
  "raw_payload": {}
}
```

## Segurança

- Nunca commitar `ZOOM_CLIENT_SECRET`.
- Tokens são criptografados com AES-256-GCM usando `TOKEN_ENCRYPTION_SECRET`.
- `state` OAuth é assinado com `OAUTH_STATE_SECRET`.
- Webhooks Zoom são validados com `ZOOM_WEBHOOK_SECRET_TOKEN`.
