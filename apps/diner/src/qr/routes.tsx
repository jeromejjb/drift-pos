import { Route } from 'react-router-dom';
import { ScanPage } from '../pages/ScanPage';
import { TablePage } from '../pages/TablePage';
import { MenuPage } from '../pages/MenuPage';
import { CartPage } from '../pages/CartPage';
import { PaymentPage } from '../pages/PaymentPage';
import { ConfirmationPage } from '../pages/ConfirmationPage';

/**
 * QR table ordering is its own route group. It does not have a separate payments
 * stack: checkout calls the same destination-charge endpoint the rest of Drift uses
 * (`POST /api/stripe/order/:orderId/create-payment-intent`).
 *
 * This is a fragment of <Route> elements, not a component. React Router only
 * accepts <Route> or <Fragment> as direct children of <Routes>.
 */
export const qrTableOrderRoutes = (
  <>
    <Route path="/" element={<ScanPage />} />
    <Route path="/table/:tableId" element={<TablePage />} />
    <Route path="/menu/:tableId" element={<MenuPage />} />
    <Route path="/cart/:tableId" element={<CartPage />} />
    <Route path="/payment/:tableId" element={<PaymentPage />} />
    <Route path="/confirmation/:orderId" element={<ConfirmationPage />} />
  </>
);
