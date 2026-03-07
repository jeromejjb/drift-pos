import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AddCardProvider } from './contexts/AddCardContext';
import { BottomNav } from './components/BottomNav';
import { ScanPage } from './pages/ScanPage';
import { TablePage } from './pages/TablePage';
import { MenuPage } from './pages/MenuPage';
import { CartPage } from './pages/CartPage';
import { PaymentPage } from './pages/PaymentPage';
import { PaymentReturnPage } from './pages/PaymentReturnPage';
import { P2PReturnPage } from './pages/P2PReturnPage';
import { ConfirmationPage } from './pages/ConfirmationPage';
import { SignInPage } from './pages/SignInPage';
import { SignUpPage } from './pages/SignUpPage';
import { PayPage } from './pages/PayPage';
import { SettingsRedirect } from './pages/SettingsRedirect';
import { MoneyPage } from './pages/MoneyPage';
import { WithdrawPage } from './pages/WithdrawPage';
import { MePage } from './pages/MePage';
import './index.css';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<ScanPage />} />
      <Route path="/table/:tableId" element={<TablePage />} />
      <Route path="/menu/:tableId" element={<MenuPage />} />
      <Route path="/cart/:tableId" element={<CartPage />} />
      <Route path="/payment/:tableId" element={<PaymentPage />} />
      <Route path="/payment/return" element={<PaymentReturnPage />} />
      <Route path="/confirmation/:orderId" element={<ConfirmationPage />} />
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/pay" element={<PayPage />} />
      <Route path="/pay/return" element={<P2PReturnPage />} />
      <Route path="/settings" element={<SettingsRedirect />} />
      <Route path="/withdraw" element={<WithdrawPage />} />
      <Route path="/money" element={<MoneyPage />} />
      <Route path="/me" element={<MePage />} />
    </Routes>
  );
}

function AppLayout() {
  const { pathname } = useLocation();
  const showNav =
    pathname === '/' ||
    pathname === '/pay' ||
    pathname === '/money' ||
    pathname === '/me' ||
    pathname.startsWith('/table/') ||
    pathname.startsWith('/menu/') ||
    pathname.startsWith('/cart/');
  return (
    <div className="min-h-screen bg-[var(--drift-surface-elevated)] sm:min-h-0">
      <div className="app-shell min-h-screen bg-[var(--drift-surface-elevated)] relative">
        <AppRoutes />
        {showNav && <BottomNav />}
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AddCardProvider>
          <AppLayout />
        </AddCardProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
