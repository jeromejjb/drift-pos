import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DashboardPage } from './pages/DashboardPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { TablesPage } from './pages/TablesPage';
import { OrdersPage } from './pages/OrdersPage';
import { MenuPage } from './pages/MenuPage';
import { PosPage } from './pages/PosPage';
import { SettingsPage } from './pages/SettingsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { useEffect } from 'react';
import { config } from './lib/config';

const LANDING = config.landingUrl;

// Component to handle external redirect
function RedirectToLanding() {
  useEffect(() => {
    window.location.href = LANDING;
  }, []);
  return null;
}

function RedirectToLandingLogin() {
  useEffect(() => {
    window.location.href = `${LANDING}/login`;
  }, []);
  return null;
}

// Generic redirect for any path
function RedirectToLandingPath() {
  useEffect(() => {
    const path = window.location.pathname;
    window.location.href = `${LANDING}${path}`;
  }, []);
  return null;
}

function App() {
  // Read token from localStorage or URL (cross-origin login passes token in URL)
  const params = new URLSearchParams(window.location.search);
  const urlToken = params.get('token');
  const urlRestaurantId = params.get('restaurantId');
  if (urlToken && urlRestaurantId) {
    localStorage.setItem('drift-token', urlToken);
    localStorage.setItem('drift-restaurant-id', urlRestaurantId);
    window.history.replaceState({}, '', window.location.pathname);
  }
  const token = localStorage.getItem('drift-token') || urlToken;
  const restaurantId = localStorage.getItem('drift-restaurant-id') || urlRestaurantId;

  // All marketing paths that should redirect to landing
  const marketingPaths = [
    'pricing', 'faq',
    'about', 'blog', 'careers',
    'privacy', 'terms', 'security'
  ];

  return (
    <BrowserRouter>
      <Routes>
        {/* Map through all marketing paths */}
        {marketingPaths.map(path => (
          <Route key={path} path={`/${path}`} element={<RedirectToLanding />} />
        ))}
        
        {/* Auth pages */}
        <Route path="/" element={<RedirectToLanding />} />
        <Route path="/login" element={<RedirectToLandingLogin />} />
        <Route path="/signup" element={<RedirectToLanding />} />
        
        {/* Public routes - no auth required */}
        <Route path="/onboarding" element={<OnboardingPage />} />
        
        {/* Protected routes - require auth */}
        <Route 
          path="/dashboard/:restaurantId" 
          element={
            token ? <DashboardPage /> : <RedirectToLandingLogin />
          } 
        />
        <Route 
          path="/tables/:restaurantId" 
          element={
            token ? <TablesPage /> : <RedirectToLandingLogin />
          } 
        />
        <Route 
          path="/orders/:restaurantId" 
          element={
            token ? <OrdersPage /> : <RedirectToLandingLogin />
          } 
        />
        <Route 
          path="/menu/:restaurantId" 
          element={
            token ? <MenuPage /> : <RedirectToLandingLogin />
          } 
        />
        <Route 
          path="/pos/:restaurantId" 
          element={
            token ? <PosPage /> : <RedirectToLandingLogin />
          } 
        />
        <Route 
          path="/settings/:restaurantId" 
          element={
            token ? <SettingsPage /> : <RedirectToLandingLogin />
          } 
        />
        <Route 
          path="/analytics/:restaurantId" 
          element={
            token ? <AnalyticsPage /> : <RedirectToLandingLogin />
          } 
        />
        
        {/* CATCH-ALL: Redirect any other unknown path to landing */}
        <Route path="*" element={<RedirectToLandingPath />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;