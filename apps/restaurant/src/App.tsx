import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { TablesPage } from './pages/TablesPage';
import { OrdersPage } from './pages/OrdersPage';
import { MenuPage } from './pages/MenuPage'; // Add this import
import { SettingsPage } from './pages/SettingsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/dashboard/:restaurantId" element={<DashboardPage />} />
        <Route path="/tables/:restaurantId" element={<TablesPage />} />
        <Route path="/orders/:restaurantId" element={<OrdersPage />} />
        <Route path="/menu/:restaurantId" element={<MenuPage />} /> {/* Add this route */}
        <Route path="/settings/:restaurantId" element={<SettingsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;