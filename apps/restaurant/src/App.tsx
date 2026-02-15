import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { TablesPage } from './pages/TablesPage';
import { OrdersPage } from './pages/OrdersPage';
import { MenuPage } from './pages/MenuPage';
import { SettingsPage } from './pages/SettingsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        
        {/* Onboarding - THIS MUST BE PUBLIC (no auth required) */}
        <Route path="/onboarding" element={<OnboardingPage />} />
        
        {/* Protected routes - require authentication */}
        <Route path="/dashboard/:restaurantId" element={<DashboardPage />} />
        <Route path="/tables/:restaurantId" element={<TablesPage />} />
        <Route path="/orders/:restaurantId" element={<OrdersPage />} />
        <Route path="/menu/:restaurantId" element={<MenuPage />} />
        <Route path="/settings/:restaurantId" element={<SettingsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;