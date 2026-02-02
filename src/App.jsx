import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import About from './pages/About';
import Administration from './pages/Administration';
import AuthPage from './pages/AuthPage.jsx';
import { AuthProvider } from './features/auth/AuthContext';
import { Toaster } from 'react-hot-toast';

// Placeholder components for other routes
const Placeholder = ({ title }) => (
  <div className="p-8 text-center min-h-[60vh] flex flex-col justify-center">
    <h2 className="text-2xl font-bold text-gray-700">{title}</h2>
    <p className="text-gray-500 mt-2">This page is under construction.</p>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-center" />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/about" element={<About />} />
            <Route path="/administration" element={<Administration />} />
            <Route path="/dashboard" element={<Placeholder title="Member Dashboard" />} />
            <Route path="/contact" element={<Placeholder title="Contact Us" />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
