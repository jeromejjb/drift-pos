import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ScanPage } from './pages/ScanPage';
import { TablePage } from './pages/TablePage';
import { MenuPage } from './pages/MenuPage';
import { CartPage } from './pages/CartPage';
import { PaymentPage } from './pages/PaymentPage';
import { ConfirmationPage } from './pages/ConfirmationPage';
import './index.css'; 

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white">
        <Routes>
          <Route path="/" element={<ScanPage />} />
          <Route path="/table/:tableId" element={<TablePage />} />
          <Route path="/menu/:tableId" element={<MenuPage />} />
          <Route path="/cart/:tableId" element={<CartPage />} />
          <Route path="/payment/:tableId" element={<PaymentPage />} />          <Route path="/confirmation/:orderId" element={<ConfirmationPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;