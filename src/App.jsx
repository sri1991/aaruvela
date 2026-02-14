import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import About from './pages/About';
import Administration from './pages/Administration';
import AuthPage from './pages/AuthPage.jsx';
import MembershipRequest from './pages/MembershipRequest.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import MemberDashboard from './pages/MemberDashboard.jsx';
import { AuthProvider, useAuth } from './features/auth/AuthContext';
import { Toaster } from 'react-hot-toast';

// Placeholder components for other routes
const Placeholder = ({ title }) => (
  <div className="p-8 text-center min-h-[60vh] flex flex-col items-center justify-center">
    <h2 className="text-2xl font-bold text-gray-700">{title}</h2>
    <p className="mt-2 text-gray-500">This section is coming soon as part of Phase 4/5.</p>
  </div>
);

const ProtectedRoute = ({ children, status = "ACTIVE", requiredRole }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" />;

  // 1. Role Check (e.g., HEAD for Admin)
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" />;
  }

  // 2. Status Check
  if (status === "ACTIVE" && user.status !== "ACTIVE") {
    return <Navigate to="/membership" />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen font-sans">
          <Toaster position="top-center" />
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/about" element={<About />} />
              <Route path="/administration" element={<Administration />} />

              <Route path="/membership" element={
                <ProtectedRoute status="PENDING">
                  <MembershipRequest />
                </ProtectedRoute>
              } />

              <Route path="/dashboard" element={
                <ProtectedRoute status="ACTIVE">
                  <MemberDashboard />
                </ProtectedRoute>
              } />

              <Route path="/admin" element={
                <ProtectedRoute requiredRole="HEAD">
                  <AdminDashboard />
                </ProtectedRoute>
              } />

              <Route path="/contact" element={<Placeholder title="Contact Us" />} />
            </Route>
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
