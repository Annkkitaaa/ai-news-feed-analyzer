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
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { Sidebar } from './components/layout/Sidebar';

// Store
import { useAuthStore } from './store';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, fetchCurrentUser } = useAuthStore();
  
  useEffect(() => {
    if (isAuthenticated) {
      fetchCurrentUser().catch(() => {
        // Token might be invalid or expired
        useAuthStore.getState().logout();
      });
    }
  }, [isAuthenticated, fetchCurrentUser]);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// Layout with Sidebar for authenticated routes
const DashboardLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-4">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
};

// Public Layout for unauthenticated routes
const PublicLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <main>
        {children}
      </main>
      <Footer />
    </div>
  );
};

function App() {
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
        
        {/* Protected Routes */}
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