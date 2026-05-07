'use client';

import { useMemo, useState } from 'react';

export default function Home() {
  const [clientName, setClientName] = useState('');
  const [clientId, setClientId] = useState('');
  const [ghlLocationId, setGhlLocationId] = useState('');
  const canSubmit = clientName.trim().length > 1;

  const authUrl = useMemo(() => {
    const params = new URLSearchParams({ client_name: clientName.trim() });
    if (clientId.trim()) params.set('client_id', clientId.trim());
    if (ghlLocationId.trim()) params.set('ghl_location_id', ghlLocationId.trim());
    return `/api/zoom/oauth-start?${params.toString()}`;
  }, [clientName, clientId, ghlLocationId]);

  const handleAuthorize = () => {
    if (!canSubmit) return alert('Digite o nome do cliente/empresa');
    window.location.href = authUrl;
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 p-6 flex items-center justify-center">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 border border-blue-100">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🎯</div>
          <h1 className="text-3xl font-bold text-gray-900">MOTTIVME Zoom Connector</h1>
          <p className="text-gray-600 mt-2">Autorizar Zoom para rastrear presença automaticamente.</p>
        </div>
        <div className="space-y-4">
          <label className="block">
            <span className="block text-sm font-semibold text-gray-700 mb-2">Cliente / empresa *</span>
            <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Ex: Marina, Mentoria X, Cliente ABC" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900" onKeyDown={(e) => e.key === 'Enter' && handleAuthorize()} />
          </label>
          <label className="block">
            <span className="block text-sm font-semibold text-gray-700 mb-2">ID interno opcional</span>
            <input value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="Ex: locationId, client_id, slug" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900" />
          </label>
          <label className="block">
            <span className="block text-sm font-semibold text-gray-700 mb-2">GHL Location ID opcional</span>
            <input value={ghlLocationId} onChange={(e) => setGhlLocationId(e.target.value)} placeholder="Ex: Qib6gQluf6zreRWKmpKm" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900" />
          </label>
          <button onClick={handleAuthorize} disabled={!canSubmit} className="w-full px-6 py-4 bg-blue-600 disabled:bg-gray-300 text-white rounded-xl hover:bg-blue-700 transition font-bold text-lg">✅ Autorizar Zoom</button>
        </div>
        <div className="mt-8 p-4 rounded-xl bg-blue-50 text-sm text-blue-900">
          Depois disso, eventos do Zoom como <strong>entrou</strong>, <strong>saiu</strong> e <strong>reunião terminou</strong> vão para Supabase/n8n para marcar presença sem planilha manual.
        </div>
      </div>
    </main>
  );
}
