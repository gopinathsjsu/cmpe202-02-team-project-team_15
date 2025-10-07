import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SearchPage from './pages/SearchPage';

const App: React.FC = () => {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Redirect root to search page */}
          <Route path="/" element={<Navigate to="/search" replace />} />
          
          {/* Search page */}
          <Route path="/search" element={<SearchPage />} />
          
          {/* Catch all route - redirect to search */}
          <Route path="*" element={<Navigate to="/search" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
