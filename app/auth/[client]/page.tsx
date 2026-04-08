import { redirect } from 'next/navigation';

export default function AuthPage({ params }: { params: { client: string } }) {
  const { client } = params;
  const baseUrl = 'https://zoom-oauth-handler.vercel.app/api/zoom/oauth-callback';
  
  const oauthUrl = `https://zoom.us/oauth/authorize?response_type=code&client_id=J63Tj5XnRImD6NjMLsehOA&redirect_uri=${encodeURIComponent(baseUrl)}&state=${client}`;

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">🎯 MOTTIVME</h1>
        <p className="text-gray-600 mb-6">Autorizar Zoom para {client}</p>
        
        <div className="bg-blue-50 rounded-lg p-4 mb-8">
          <p className="text-sm text-gray-700">
            Clique no botão abaixo para autorizar seu Zoom e começar a rastrear presença automaticamente.
          </p>
        </div>

        <a
          href={oauthUrl}
          className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-bold text-lg"
        >
          ✅ Autorizar Zoom
        </a>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Você será redirecionado para Zoom para confirmar as permissões.
          </p>
        </div>
      </div>
    </main>
  );
}
