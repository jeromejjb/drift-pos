/**
 * Single source of truth for diner bottom nav and "show nav" logic.
 * Focused on QR/table flow (Dine) + profile (Me).
 */

import { QrCode, User } from 'lucide-react';

export const NAV_ITEMS = [
  { to: '/', icon: QrCode, label: 'Dine' },
  { to: '/me', icon: User, label: 'Me' },
] as const;

const NAV_PATHS = NAV_ITEMS.map((item) => item.to);

/** Paths where the bottom nav is shown (dine flow = /, /table/*, /menu/*, /cart/*). */
export function shouldShowNav(pathname: string): boolean {
  if (NAV_PATHS.some((p) => p === pathname || (p !== '/' && pathname.startsWith(p)))) return true;
  if (pathname === '/') return true;
  if (pathname.startsWith('/table/') || pathname.startsWith('/menu/') || pathname.startsWith('/cart/')) return true;
  return false;
}

/** Whether this path is the "Dine" tab (scan + table/menu/cart). */
export function isDinePath(pathname: string): boolean {
  return pathname === '/' || pathname.startsWith('/table/') || pathname.startsWith('/menu/') || pathname.startsWith('/cart/');
}
