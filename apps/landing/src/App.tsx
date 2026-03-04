import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { SignupPage } from './pages/SignupPage';
import { LoginPage } from './pages/LoginPage';
import { About } from './pages/About';
import { Blog } from './pages/Blog';
import { Careers } from './pages/Careers';
import { FAQ } from './pages/FAQ';
import { Privacy } from './pages/Privacy';
import { Terms } from './pages/Terms';
import { Security } from './pages/Security';
import { DriftShowcase } from './components/DriftShowcase';

const RESTAURANT_URL = import.meta.env.VITE_RESTAURANT_URL || 'https://drift-restaurant.onrender.com';

// Redirect app paths to restaurant — prevents "double auth" when user bookmarks driftpos.com/dashboard/xyz
function RedirectToRestaurant() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.location.href = `${RESTAURANT_URL}${pathname}${window.location.search}`;
  }, [pathname]);
  return null;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* App paths — redirect to restaurant so user doesn't land on wrong domain */}
        <Route path="/dashboard/*" element={<RedirectToRestaurant />} />
        <Route path="/tables/*" element={<RedirectToRestaurant />} />
        <Route path="/orders/*" element={<RedirectToRestaurant />} />
        <Route path="/menu/*" element={<RedirectToRestaurant />} />
        <Route path="/pos/*" element={<RedirectToRestaurant />} />
        <Route path="/settings/*" element={<RedirectToRestaurant />} />
        <Route path="/onboarding" element={<RedirectToRestaurant />} />
        {/* Main pages */}
        <Route path="/" element={<HomePage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        
        {/* Company pages */}
        <Route path="/about" element={<About />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/careers" element={<Careers />} />
        
        {/* Support pages */}
        <Route path="/faq" element={<FAQ />} />
        
        {/* Legal pages */}
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/security" element={<Security />} />
        
        {/* Showcase (keep for now, maybe remove later) */}
        <Route path="/drift-showcase" element={<DriftShowcase />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;