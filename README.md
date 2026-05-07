# MOTTIVME Zoom Connector

Conector Zoom para OAuth multi-cliente, webhooks de presença, transcrição/chat de gravações e análise comercial via n8n.

Fluxo:

1. Cliente autoriza Zoom em `/api/zoom/oauth-start`.
2. Callback troca `code` por tokens e salva no Supabase.
3. Zoom envia eventos para `/api/zoom/webhook`.
4. Eventos de presença são salvos em `zoom_attendance_events` e opcionalmente enviados para n8n.
5. Quando a gravação fica pronta, transcript/chat são baixados, salvos em `zoom_meeting_artifacts` e enviados ao Head de Vendas via n8n.

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
- `N8N_SALES_HEAD_WEBHOOK_URL`

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
- `recording.completed`
- `recording.transcript_completed` se disponível no app

Scopes mínimos dependem do app, mas para OAuth + usuário atual geralmente precisa de leitura de user/me e eventos de meeting.

Para transcrição/chat, habilite cloud recording + audio transcript na conta Zoom e adicione scopes de gravação/leitura exigidos pelo Marketplace, como `recording:read`/equivalente atual do Zoom.

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

Quando `N8N_ATTENDANCE_WEBHOOK_URL` estiver configurado, o app envia eventos de presença:

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

Quando `N8N_SALES_HEAD_WEBHOOK_URL` estiver configurado, o app envia para o agente Head de Vendas:

```json
{
  "source": "zoom_connector",
  "event": "recording.completed",
  "artifact_id": "...",
  "client_id": "...",
  "client_name": "Marina",
  "ghl_location_id": "...",
  "meeting_uuid": "...",
  "meeting_topic": "...",
  "transcript_text": "...",
  "chat_text": "...",
  "chat_engagement": {
    "message_count": 6,
    "top_participants": [{ "name": "Lead", "count": 4 }]
  },
  "lead_score_delta": 30,
  "lead_score_reasons": ["call_transcribed", "high_chat_activity"]
}
```

O score inicial considera sinais simples: transcrição disponível, volume de mensagens no chat, sinais de compra e objeções. O n8n/Head de Vendas pode sobrescrever ou enriquecer a análise.

## Segurança

- Nunca commitar `ZOOM_CLIENT_SECRET`.
- Tokens são criptografados com AES-256-GCM usando `TOKEN_ENCRYPTION_SECRET`.
- `state` OAuth é assinado com `OAUTH_STATE_SECRET`.
- Webhooks Zoom são validados com `ZOOM_WEBHOOK_SECRET_TOKEN`.
