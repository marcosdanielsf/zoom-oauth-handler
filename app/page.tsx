export default function Home() {
  const clients = [
    { name: 'Juliana', state: 'juliana' },
    { name: 'Fernanda', state: 'fernanda' },
    { name: 'Marina', state: 'marina' },
    { name: 'Flavia', state: 'flavia' },
  ];

  const baseUrl = 'https://zoom-oauth-handler.vercel.app/api/zoom/oauth-callback';

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🎯 MOTTIVME Zoom Setup</h1>
          <p className="text-gray-600 mb-8">
            Clique no link abaixo para autorizar seu Zoom e rastrear presença automaticamente.
          </p>

          <div className="space-y-4">
            {clients.map((client) => {
              const oauthUrl = `https://zoom.us/oauth/authorize?response_type=code&client_id=J63Tj5XnRImD6NjMLsehOA&redirect_uri=${encodeURIComponent(baseUrl)}&state=${client.state}`;
              return (
                <div key={client.state} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800">{client.name}</h2>
                      <p className="text-sm text-gray-500">state: {client.state}</p>
                    </div>
                    <a
                      href={oauthUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                    >
                      Autorizar Zoom
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-4">📋 Info Técnica</h3>
            <div className="bg-gray-50 rounded p-4 space-y-2 text-sm font-mono">
              <p>
                <span className="text-gray-600">OAuth Callback:</span>{' '}
                <code className="bg-white px-2 py-1 rounded">{baseUrl}</code>
              </p>
              <p>
                <span className="text-gray-600">Webhook:</span>{' '}
                <code className="bg-white px-2 py-1 rounded">
                  https://zoom-oauth-handler.vercel.app/api/zoom/webhook
                </code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
