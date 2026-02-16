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
  Coffee,
  Pizza,
  Beef,
  Wine,
  IceCream,
  X
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

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  popular?: boolean;
  available?: boolean;
}

interface MenuCategory {
  id: string;
  name: string;
  items: MenuItem[];
}

export function MenuReviewStep({ data, updateData, onNext, onPrev }: Props) {
  const [menu, setMenu] = useState<{ categories: MenuCategory[] }>(
    data?.menu || { categories: [] }
  );

  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<MenuItem>>({});

  const categoryIcons: Record<string, any> = {
    'Antipasti': Coffee,
    'Appetizers': Coffee,
    'Pizza': Pizza,
    'Pasta': Pizza,
    'Main Courses': Beef,
    'Desserts': IceCream,
    'Drinks': Wine,
  };

  // Calculate real issues based on actual menu data
  const getMenuIssues = () => {
    const issues: { type: 'warning' | 'error'; message: string }[] = [];
    
    menu.categories.forEach((category) => {
      category.items.forEach((item) => {
        if (!item.price || item.price <= 0) {
          issues.push({
            type: 'error',
            message: `⚠️ Price missing for "${item.name}" in ${category.name}`
          });
        }
        if (!item.description || item.description.trim() === '') {
          issues.push({
            type: 'warning',
            message: `📝 Add description for "${item.name}"`
          });
        }
      });
    });
    
    return issues;
  };

  const issues = getMenuIssues();
  const hasIssues = issues.length > 0;
  const totalItems = menu.categories.reduce((acc, cat) => acc + cat.items.length, 0);

  const updateMenuItem = (categoryId: string, itemId: string, updates: any) => {
    setMenu({
      ...menu,
      categories: menu.categories.map((cat) => 
        cat.id === categoryId
          ? {
              ...cat,
              items: cat.items.map((item) =>
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
      categories: menu.categories.map((cat) =>
        cat.id === categoryId
          ? { ...cat, items: cat.items.filter((item) => item.id !== itemId) }
          : cat
      )
    });
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setEditFormData({
      name: item.name,
      description: item.description,
      price: item.price,
      popular: item.popular,
      available: item.available
    });
    setShowEditModal(true);
  };

  const saveEdit = () => {
    if (!editingItem || !editFormData.name || !editFormData.price) return;

    const category = menu.categories.find((cat) => 
      cat.items.some((item) => item.id === editingItem.id)
    );

    if (category) {
      updateMenuItem(category.id, editingItem.id, {
        name: editFormData.name,
        description: editFormData.description || '',
        price: editFormData.price,
        popular: editFormData.popular || false,
        available: editFormData.available !== false
      });
    }

    setShowEditModal(false);
    setEditingItem(null);
    setEditFormData({});
  };

  const handleContinue = () => {
    updateData({ menu, menuReviewed: true });
    onNext();
  };

  // If no menu items, show empty state
  if (totalItems === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto text-center"
      >
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Coffee className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-2xl font-light mb-2">No menu items yet</h2>
        <p className="text-gray-400 mb-6">Add some items to your menu before reviewing</p>
        <Button variant="secondary" onClick={onPrev}>
          Go Back to Add Items
        </Button>
      </motion.div>
    );
  }

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

      {/* Issues Banner - ONLY shows if there are real issues */}
      {hasIssues && (
        <Card padding="md" className="mb-6 bg-amber-50 border-amber-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-800 mb-2">
                Review needed ({issues.length} issue{issues.length > 1 ? 's' : ''})
              </h3>
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

      {/* Success Banner - Shows when no issues */}
      {!hasIssues && totalItems > 0 && (
        <Card padding="md" className="mb-6 bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-sm text-green-700">✨ Your menu looks great! No issues found.</p>
          </div>
        </Card>
      )}

      {/* Menu Preview */}
      <div className="space-y-6 mb-8">
        {menu.categories.map((category) => {
          const Icon = categoryIcons[category.name] || Coffee;
          
          return (
            <Card key={category.id} padding="lg">
              <div className="flex items-center gap-3 mb-4 pb-2 border-b border-gray-100">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="text-xl font-light">{category.name}</h3>
                <span className="text-xs text-gray-400">{category.items.length} items</span>
              </div>

              <div className="space-y-4">
                {category.items.map((item) => {
                  const hasPriceIssue = !item.price || item.price <= 0;
                  const hasDescriptionIssue = !item.description || item.description.trim() === '';
                  
                  return (
                    <div 
                      key={item.id} 
                      className={`flex items-start gap-4 p-3 rounded-xl group hover:bg-gray-50 transition-colors ${
                        hasPriceIssue ? 'bg-red-50' : hasDescriptionIssue ? 'bg-amber-50' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`font-medium ${hasPriceIssue ? 'text-red-700' : ''}`}>
                                {item.name}
                              </span>
                              {item.popular && (
                                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                                  Popular
                                </span>
                              )}
                              {!item.available && (
                                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                                  Sold out
                                </span>
                              )}
                            </div>
                            {item.description ? (
                              <p className="text-sm text-gray-500">{item.description}</p>
                            ) : (
                              <p className="text-sm text-amber-600 italic">Add description</p>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            {hasPriceIssue ? (
                              <span className="font-medium text-red-600">Missing price</span>
                            ) : (
                              <span className="font-medium">${item.price.toFixed(2)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-2 hover:bg-white rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4 text-gray-400" />
                        </button>
                        <button
                          onClick={() => deleteMenuItem(category.id, item.id)}
                          className="p-2 hover:bg-white rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card padding="lg" className="max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-light">Edit Item</h3>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.price}
                  onChange={(e) => setEditFormData({ ...editFormData, price: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editFormData.popular}
                    onChange={(e) => setEditFormData({ ...editFormData, popular: e.target.checked })}
                    className="rounded border-gray-300 text-black focus:ring-black"
                  />
                  <span className="text-sm">Popular</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editFormData.available !== false}
                    onChange={(e) => setEditFormData({ ...editFormData, available: e.target.checked })}
                    className="rounded border-gray-300 text-black focus:ring-black"
                  />
                  <span className="text-sm">Available</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={saveEdit} className="flex-1">
                  Save Changes
                </Button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="text-center p-4 bg-gray-50 rounded-xl">
          <div className="text-2xl font-light">{menu.categories.length}</div>
          <div className="text-xs text-gray-400">Categories</div>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-xl">
          <div className="text-2xl font-light">
            {totalItems}
          </div>
          <div className="text-xs text-gray-400">Total Items</div>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-xl">
          <div className="text-2xl font-light">
            ${totalItems > 0 
              ? (menu.categories.reduce((acc, cat) => 
                  acc + cat.items.reduce((sum, item) => sum + (item.price || 0), 0), 0
                ) / totalItems).toFixed(2)
              : '0.00'}
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