/**
 * Shared domain types for the Drift diner app.
 */

export interface Restaurant {
  id: string;
  name: string;
  address: string | null;
  logo: string | null;
  tables: Table[];
}

export interface Table {
  id: string;
  number: number;
  qrCode: string;
  restaurantId: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  isShared: boolean;
  categoryId: string;
}

export interface Category {
  id: string;
  name: string;
  items: MenuItem[];
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  isShared?: boolean;
}
