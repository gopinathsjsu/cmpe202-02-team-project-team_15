import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import Auth from './components/Auth';
import LandingPage from './pages/LandingPage';
import SearchPage from './pages/SearchPage';
import ViewListing from './pages/ViewListing';
import EditListing from './pages/EditListing';
import CreateListing from './pages/CreateListing';
import MessagesPage from './pages/Messages';
import SavedListings from './pages/SavedListings';
import MyListings from './pages/MyListings';
import ProtectedRoute from './components/ProtectedRoute';
import AdminReportsPage from './pages/AdminReportsPage';
import AdminCategoriesPage from './pages/AdminCategoriesPage';
import Profile from './pages/Profile';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <div className="App">
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

            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute requiredRoles={["admin"]}>
                  <AdminReportsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/categories"
              element={
                <ProtectedRoute requiredRoles={["admin"]}>
                  <AdminCategoriesPage />
                </ProtectedRoute>
              }
            />
            
            <Route 
              path="/saved" 
              element={
                <ProtectedRoute>
                  <SavedListings />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/my-listings" 
              element={
                <ProtectedRoute>
                  <MyListings />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            
            {/* Landing page */}
            <Route path="/" element={<LandingPage />} />
            
            {/* Catch all route - redirect to landing page */}
            <Route path="*" element={<Navigate to="/" replace />} />
            
          </Routes>
        </div>
      </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
