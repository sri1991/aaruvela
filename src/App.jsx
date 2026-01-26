import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import About from './pages/About';
import Administration from './pages/Administration';

// Placeholder components for other routes
const Placeholder = ({ title }) => (
  <div className="p-8 text-center">
    <h2 className="text-2xl font-bold text-gray-700">{title}</h2>
    <p className="text-gray-500 mt-2">This page is under construction.</p>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="administration" element={<Administration />} />
          {/* <Route path="membership" element={<Placeholder title="Membership" />} /> */}
          {/* <Route path="services" element={<Placeholder title="Services" />} /> */}
          {/* <Route path="magazine" element={<Placeholder title="Magazine" />} /> */}
          {/* <Route path="donations" element={<Placeholder title="Donations" />} /> */}
          <Route path="contact" element={<Placeholder title="Contact Us" />} />
          {/* <Route path="faq" element={<Placeholder title="FAQ" />} /> */}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
