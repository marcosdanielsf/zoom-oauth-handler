export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">🎯 MOTTIVME</h1>
          <p className="text-gray-600 text-lg">Zoom Attendance Tracker</p>
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-gray-700">
              Use sua URL personalizada abaixo para autorizar seu Zoom:
            </p>
          </div>
          <div className="mt-8 space-y-3">
            <p className="text-gray-600">
              <code className="bg-gray-100 px-3 py-1 rounded text-sm">
                /auth/[nome-do-cliente]
              </code>
            </p>
            <div className="text-sm text-gray-500 space-y-2">
              <p>Exemplos:</p>
              <code className="block bg-gray-100 p-2 rounded">/auth/juliana</code>
              <code className="block bg-gray-100 p-2 rounded">/auth/fernanda</code>
              <code className="block bg-gray-100 p-2 rounded">/auth/marina</code>
              <code className="block bg-gray-100 p-2 rounded">/auth/flavia</code>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
