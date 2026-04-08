'use client';

import { useState } from 'react';

export default function Home() {
  const [clientName, setClientName] = useState('');
  const [authorized, setAuthorized] = useState(false);

  const handleAuthorize = () => {
    if (!clientName.trim()) {
      alert('Digite seu nome');
      return;
    }

    const baseUrl = 'https://zoom-oauth-handler.vercel.app/api/zoom/oauth-callback';
    const oauthUrl = `https://zoom.us/oauth/authorize?response_type=code&client_id=J63Tj5XnRImD6NjMLsehOA&redirect_uri=${encodeURIComponent(baseUrl)}&state=${clientName}`;
    
    window.location.href = oauthUrl;
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">🎯 MOTTIVME</h1>
        <p className="text-gray-600 text-center mb-8">Autorizar Zoom - Rastreamento de Presença</p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Digite seu nome:
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Ex: Juliana, Fernanda, Marina..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              onKeyPress={(e) => e.key === 'Enter' && handleAuthorize()}
            />
          </div>

          <button
            onClick={handleAuthorize}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-bold text-lg"
          >
            ✅ Autorizar Zoom
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Você será redirecionado para Zoom para confirmar as permissões.
          </p>
        </div>
      </div>
    </main>
  );
}
