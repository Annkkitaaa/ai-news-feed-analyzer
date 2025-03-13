import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Auth Components
import { Login, Register, ForgotPassword, ResetPassword } from './components/AuthComponents';

// Main Components
import { Dashboard } from './components/Dashboard';
import { ProfileSettings } from './components/ProfileSettings';
import { InterestsManagement } from './components/InterestsManagement';
import { NewsSourcesManagement } from './components/NewsSourcesManagement';
import { ReadingHistory } from './components/ReadingHistory';
import { NewsDetail } from './components/NewsDetail';
import { NewsDigest } from './components/NewsDigest';

// Layout Components
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Footer } from './components/layout/Footer';

// Store
import { useAuthStore } from './store';
import { initializeAuthHeaders } from './services/api';

// Public Layout for unauthenticated routes
const PublicLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-light-300 dark:bg-dark-400">
      <main>
        {children}
      </main>
      <Footer />
    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, init } = useAuthStore();
  
  // If still loading auth state, show loading indicator
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

function App() {
  const { init } = useAuthStore();
  
  useEffect(() => {
    // Initialize auth headers from localStorage token
    initializeAuthHeaders();
    
    // Initialize auth state
    init().catch(error => {
      console.error("Error initializing auth state:", error);
    });
  }, [init]);
  
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={5000} />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={
          <PublicLayout>
            <Login />
          </PublicLayout>
        } />
        <Route path="/register" element={
          <PublicLayout>
            <Register />
          </PublicLayout>
        } />
        <Route path="/forgot-password" element={
          <PublicLayout>
            <ForgotPassword />
          </PublicLayout>
        } />
        <Route path="/reset-password" element={
          <PublicLayout>
            <ResetPassword />
          </PublicLayout>
        } />
        
        {/* Protected Routes - Using DashboardLayout */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <DashboardLayout>
              <ProfileSettings />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/interests" element={
          <ProtectedRoute>
            <DashboardLayout>
              <InterestsManagement />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/news-sources" element={
          <ProtectedRoute>
            <DashboardLayout>
              <NewsSourcesManagement />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/history" element={
          <ProtectedRoute>
            <DashboardLayout>
              <ReadingHistory />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/news/:id" element={
          <ProtectedRoute>
            <DashboardLayout>
              <NewsDetail />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/digest" element={
          <ProtectedRoute>
            <DashboardLayout>
              <NewsDigest />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        
        {/* Default Route */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;