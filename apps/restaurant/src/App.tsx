import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardPage } from './pages/DashboardPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { TablesPage } from './pages/TablesPage';
import { OrdersPage } from './pages/OrdersPage';
import { MenuPage } from './pages/MenuPage';
import { SettingsPage } from './pages/SettingsPage';
import { useEffect } from 'react';

// Component to handle external redirect
function RedirectToLanding() {
  useEffect(() => {
    window.location.href = 'https://drift-landing.onrender.com';
  }, []);
  return null;
}

function RedirectToLandingLogin() {
  useEffect(() => {
    window.location.href = 'https://drift-landing.onrender.com/login';
  }, []);
  return null;
}

function App() {
  // Check if user is authenticated
  const token = localStorage.getItem('drift-token');
  const restaurantId = localStorage.getItem('drift-restaurant-id');

  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect ALL auth-related paths to landing */}
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
          path="/settings/:restaurantId" 
          element={
            token ? <SettingsPage /> : <RedirectToLandingLogin />
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;