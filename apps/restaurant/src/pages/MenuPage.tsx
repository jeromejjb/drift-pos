import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Plus, Edit2, Trash2, ChevronRight } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  isAvailable: boolean;
}

export function MenuPage() {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMenu();
  }, [restaurantId]);

  const fetchMenu = async () => {
    try {
      const response = await fetch(`/api/restaurant/${restaurantId}/menu`);
      const data = await response.json();
      
      // Flatten the menu structure
      const allItems = data.flatMap(cat => 
        cat.items.map(item => ({
          ...item,
          category: cat.name
        }))
      );
      
      setMenu(allItems);
      setCategories(data.map(c => c.name));
    } catch (error) {
      console.error('Error fetching menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async (itemId: string, currentStatus: boolean) => {
    try {
      await fetch(`/api/menu/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !currentStatus })
      });
      
      setMenu(menu.map(item => 
        item.id === itemId ? { ...item, isAvailable: !currentStatus } : item
      ));
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  if (loading) {
    return (
      <Layout title="Menu">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Menu">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-light">Menu Items</h2>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Categories */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button className="px-4 py-2 bg-black text-white rounded-full text-sm whitespace-nowrap">
          All Items
        </button>
        {categories.map(cat => (
          <button key={cat} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-full text-sm whitespace-nowrap hover:bg-gray-200">
            {cat}
          </button>
        ))}
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {menu.map(item => (
          <Card key={item.id} className="hover:border-gray-200 transition-all">
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium">{item.name}</h3>
                  <p className="text-sm text-gray-400">{item.category}</p>
                </div>
                <span className="font-medium">${item.price}</span>
              </div>
              
              {item.description && (
                <p className="text-sm text-gray-500 mb-3">{item.description}</p>
              )}

              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={() => toggleAvailability(item.id, item.isAvailable)}
                  className={`text-xs px-3 py-1 rounded-full ${
                    item.isAvailable 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {item.isAvailable ? 'Available' : 'Out of stock'}
                </button>
                
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <Edit2 className="w-4 h-4 text-gray-400" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <Trash2 className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Layout>
  );
}