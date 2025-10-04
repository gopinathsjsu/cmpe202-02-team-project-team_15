import { useState } from 'react';
import { ViewListing } from './pages/ViewListing';
import { EditListing } from './pages/EditListing';
import CreateListing from './pages/CreateListing';

type Page = 'view' | 'edit' | 'create' | 'demo';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('demo');

  if (currentPage === 'demo') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-900 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">CM</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Campus Market</h1>
            <p className="text-gray-600">Choose a page to demo</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setCurrentPage('view')}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              View Listing Page
            </button>

            <button
              onClick={() => setCurrentPage('edit')}
              className="w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-6 rounded-lg border border-gray-300 transition-colors"
            >
              Edit Listing Page
            </button>

            <button
              onClick={() => setCurrentPage('create')}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Create Listing Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentPage === 'view') {
    return <ViewListing onBack={() => setCurrentPage('demo')} />;
  }

  if (currentPage === 'edit') {
    return <EditListing onBack={() => setCurrentPage('demo')} onSave={() => setCurrentPage('view')} />;
  }

  if (currentPage === 'create') {
    return <CreateListing onBack={() => setCurrentPage('demo')} onSave={() => setCurrentPage('view')} />;
  }

  return null;
}

export default App;
