import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  AlertCircle, 
  Edit2, 
  Trash2, 
  Plus,
  ChevronRight,
  ChevronLeft,
  DollarSign,
  Pizza
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

interface Props {
  restaurantId: string | null;
  data: any;
  updateData: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function MenuReviewStep({ data, updateData, onNext, onPrev }: Props) {
  const [menu, setMenu] = useState(data?.menu || {
    categories: [
      {
        id: '1',
        name: 'Antipasti',
        items: [
          { id: '1', name: 'Arancini', description: 'Crispy rice balls with mozzarella', price: 12, isShared: true },
          { id: '2', name: 'Calamari', description: 'Fried squid with marinara', price: 14, isShared: true },
        ]
      },
      {
        id: '2',
        name: 'Pizza',
        items: [
          { id: '3', name: 'Margherita', description: 'Tomato, mozzarella, basil', price: 18, isShared: true },
          { id: '4', name: 'Diavola', description: 'Spicy salami', price: 20, isShared: true },
        ]
      }
    ]
  });

  const [editingItem, setEditingItem] = useState<any>(null);
  const [issues] = useState([
    { type: 'warning', message: 'Price missing for "Calamari"' },
    { type: 'suggestion', message: 'Add description for "Diavola"' },
  ]);

  const updateMenuItem = (categoryId: string, itemId: string, updates: any) => {
    setMenu({
      ...menu,
      categories: menu.categories.map((cat: any) => 
        cat.id === categoryId
          ? {
              ...cat,
              items: cat.items.map((item: any) =>
                item.id === itemId ? { ...item, ...updates } : item
              )
            }
          : cat
      )
    });
  };

  const deleteMenuItem = (categoryId: string, itemId: string) => {
    setMenu({
      ...menu,
      categories: menu.categories.map((cat: any) =>
        cat.id === categoryId
          ? { ...cat, items: cat.items.filter((item: any) => item.id !== itemId) }
          : cat
      )
    });
  };

  const handleContinue = () => {
    updateData({ menu, menuReviewed: true });
    onNext();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto"
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Pizza className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-light mb-2">Review your menu</h2>
        <p className="text-gray-400">Make sure everything looks right</p>
      </div>

      {/* Issues Banner */}
      {issues.length > 0 && (
        <Card padding="md" className="mb-6 bg-amber-50 border-amber-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-800 mb-2">Review needed</h3>
              <ul className="space-y-1">
                {issues.map((issue, i) => (
                  <li key={i} className="text-sm text-amber-700 flex items-center gap-2">
                    <span>•</span>
                    {issue.message}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Menu Preview */}
      <div className="space-y-6 mb-8">
        {menu.categories.map((category: any) => (
          <Card key={category.id} padding="lg">
            <h3 className="text-xl font-light mb-4">{category.name}</h3>
            <div className="space-y-4">
              {category.items.map((item: any) => (
                <div key={item.id} className="flex items-start gap-4 p-3 bg-gray-50 rounded-xl">
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{item.name}</h4>
                        {item.description && (
                          <p className="text-sm text-gray-500">{item.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">${item.price}</span>
                        {item.isShared && (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                            share
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditingItem(item)}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                      onClick={() => deleteMenuItem(category.id, item.id)}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button className="mt-4 w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-black hover:text-black transition-colors flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" />
              Add Item to {category.name}
            </button>
          </Card>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="text-center">
          <div className="text-2xl font-light">
            {menu.categories.length}
          </div>
          <div className="text-xs text-gray-400">Categories</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-light">
            {menu.categories.reduce((acc: number, cat: any) => acc + cat.items.length, 0)}
          </div>
          <div className="text-xs text-gray-400">Total Items</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-light">
            ${menu.categories.reduce((acc: number, cat: any) => 
              acc + cat.items.reduce((sum: number, item: any) => sum + item.price, 0), 0
            ).toFixed(2)}
          </div>
          <div className="text-xs text-gray-400">Avg. Price</div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <Button variant="secondary" onClick={onPrev} className="flex-1">
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={handleContinue} className="flex-1">
          Looks Good, Continue
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
}