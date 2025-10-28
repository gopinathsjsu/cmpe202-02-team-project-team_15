import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Auth from './components/Auth';
import SearchPage from './pages/SearchPage';
import ViewListing from './pages/ViewListing';
import EditListing from './pages/EditListing';
import CreateListing from './pages/CreateListing';
import MessagesPage from './pages/Messages';
import ProtectedRoute from './components/ProtectedRoute';
import ChatbotButton from './components/ChatbotButton';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <ChatbotButton />
          <Routes>
            {/* Authentication routes */}
            <Route path="/login" element={<Auth />} />
            <Route path="/signup" element={<Auth />} />
            
            {/* Protected search page */}
            <Route 
              path="/search" 
              element={
                <ProtectedRoute>
                  <SearchPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Protected listing pages */}
            <Route 
              path="/listing/:id" 
              element={
                <ProtectedRoute>
                  <ViewListing />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/listing/:id/edit" 
              element={
                <ProtectedRoute>
                  <EditListing />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/create-listing" 
              element={
                <ProtectedRoute>
                  <CreateListing />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/messages" 
              element={
                <ProtectedRoute>
                  <MessagesPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Redirect root to login */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* Catch all route - redirect to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
            
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
