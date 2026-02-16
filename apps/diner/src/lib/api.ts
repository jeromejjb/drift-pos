const API_URL = 'https://drift-api-7vs7.onrender.com';

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

export async function getRestaurantByTableId(tableId: string): Promise<Restaurant> {
  console.log('🔍 Fetching restaurant for table:', tableId);
  console.log('📡 Calling:', `${API_URL}/api/table/${tableId}/restaurant`);
  
  try {
    const response = await fetch(`${API_URL}/api/table/${tableId}/restaurant`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, errorText);
      throw new Error(`Failed to fetch restaurant: ${response.status}`);
    }
    
    const restaurant = await response.json();
    console.log('✅ Restaurant loaded:', restaurant.name);
    console.log('📋 Tables:', restaurant.tables);
    
    return restaurant;
  } catch (error) {
    console.error('💥 Network or parsing error:', error);
    throw error;
  }
}

export async function getMenuByRestaurantId(_restaurantId: string): Promise<Category[]> {
  // Prefix with underscore to indicate intentionally unused
  // TODO: Implement actual API call using _restaurantId
  
  // For now, return mock data
  // In the future, you'll use: const response = await fetch(`${API_URL}/api/restaurant/${_restaurantId}/menu`);
  
  return [
    {
      id: 'cat1',
      name: 'Antipasti',
      items: [
        { id: 'item1', name: 'Arancini', description: 'Crispy rice balls with mozzarella', price: 12, isShared: true, categoryId: 'cat1' },
        { id: 'item2', name: 'Calamari', description: 'Fried squid with marinara', price: 14, isShared: true, categoryId: 'cat1' },
        { id: 'item3', name: 'Burrata', description: 'Creamy burrata with heirloom tomatoes', price: 16, isShared: true, categoryId: 'cat1' },
      ]
    },
    {
      id: 'cat2',
      name: 'Pizza',
      items: [
        { id: 'item4', name: 'Margherita', description: 'Tomato, mozzarella, basil', price: 18, isShared: true, categoryId: 'cat2' },
        { id: 'item5', name: 'Diavola', description: 'Spicy salami, tomato, mozzarella', price: 20, isShared: true, categoryId: 'cat2' },
        { id: 'item6', name: 'Quattro Formaggi', description: 'Four cheese blend', price: 22, isShared: true, categoryId: 'cat2' },
      ]
    }
  ];
}

// Optional: Add a function to get menu with real API
export async function getMenuByRestaurantIdReal(restaurantId: string): Promise<Category[]> {
  const response = await fetch(`${API_URL}/api/restaurant/${restaurantId}/menu`);
  if (!response.ok) {
    throw new Error('Failed to fetch menu');
  }
  return response.json();
}