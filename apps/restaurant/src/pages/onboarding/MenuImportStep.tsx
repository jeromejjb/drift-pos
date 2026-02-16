import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  Upload, 
  Link, 
  Sparkles, 
  FileText, 
  ChevronRight, 
  ChevronLeft,
  Plus,
  Trash2,
  Edit2,
  Pizza,
  Coffee,
  Beef,
  Wine,
  IceCream,
  X,
  Check
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

export function MenuImportStep({ data, updateData, onNext, onPrev }: Props) {
  const [mode, setMode] = useState<'select' | 'manual' | 'import'>('select');
  const [importMethod, setImportMethod] = useState<'photo' | 'pdf' | 'url' | 'template' | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Manual menu state
  const [categories, setCategories] = useState<MenuCategory[]>(
    data?.menu?.categories || [
      { id: '1', name: 'Appetizers', items: [] },
      { id: '2', name: 'Main Courses', items: [] },
      { id: '3', name: 'Desserts', items: [] },
      { id: '4', name: 'Drinks', items: [] },
    ]
  );
  
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    name: '',
    description: '',
    price: 0,
    category: categories[0]?.id || '',
    popular: false,
    available: true
  });

  const [newCategoryName, setNewCategoryName] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);

  const methods = [
    {
      id: 'photo',
      icon: Camera,
      title: 'Take a photo',
      description: 'Snap a picture of your menu',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      id: 'pdf',
      icon: FileText,
      title: 'Upload PDF',
      description: 'Drag & drop your digital menu',
      color: 'bg-purple-50 text-purple-600',
    },
    {
      id: 'url',
      icon: Link,
      title: 'Website URL',
      description: 'Enter your restaurant website',
      color: 'bg-green-50 text-green-600',
    },
    {
      id: 'template',
      icon: Sparkles,
      title: 'Use template',
      description: 'Start with a cuisine template',
      color: 'bg-orange-50 text-orange-600',
    },
  ];

  const categoryIcons: Record<string, any> = {
    'Appetizers': Coffee,
    'Main Courses': Beef,
    'Pizza': Pizza,
    'Desserts': IceCream,
    'Drinks': Wine,
  };

  const templates = [
    { 
      id: 'italian', 
      name: 'Italian', 
      icon: Pizza, 
      description: 'Pastas, pizzas, antipasti',
      categories: [
        { name: 'Antipasti', items: ['Bruschetta', 'Calamari', 'Arancini'] },
        { name: 'Pasta', items: ['Spaghetti Carbonara', 'Fettuccine Alfredo', 'Lasagna'] },
        { name: 'Pizza', items: ['Margherita', 'Pepperoni', 'Diavola'] },
      ]
    },
    { 
      id: 'american', 
      name: 'American', 
      icon: Beef, 
      description: 'Burgers, steaks, fries',
      categories: [
        { name: 'Appetizers', items: ['Buffalo Wings', 'Nachos', 'Onion Rings'] },
        { name: 'Burgers', items: ['Classic Burger', 'Cheeseburger', 'Bacon Burger'] },
        { name: 'Mains', items: ['Ribeye Steak', 'Grilled Chicken', 'Fish & Chips'] },
      ]
    },
    { 
      id: 'cafe', 
      name: 'Cafe', 
      icon: Coffee, 
      description: 'Coffee, pastries, sandwiches',
      categories: [
        { name: 'Coffee', items: ['Espresso', 'Latte', 'Cappuccino'] },
        { name: 'Pastries', items: ['Croissant', 'Muffin', 'Scone'] },
        { name: 'Sandwiches', items: ['Turkey Club', 'BLT', 'Grilled Cheese'] },
      ]
    },
    { 
      id: 'bar', 
      name: 'Bar', 
      icon: Wine, 
      description: 'Cocktails, beers, appetizers',
      categories: [
        { name: 'Cocktails', items: ['Old Fashioned', 'Margarita', 'Mojito'] },
        { name: 'Beer', items: ['IPA', 'Lager', 'Stout'] },
        { name: 'Wine', items: ['Cabernet', 'Chardonnay', 'Pinot Noir'] },
      ]
    },
  ];

  const addItem = () => {
    if (!newItem.name || !newItem.price || !newItem.category) return;

    const item: MenuItem = {
      id: Date.now().toString(),
      name: newItem.name,
      description: newItem.description || '',
      price: newItem.price,
      category: newItem.category,
      popular: newItem.popular || false,
      available: newItem.available !== false,
    };

    setCategories(prev =>
      prev.map(cat =>
        cat.id === item.category
          ? { ...cat, items: [...cat.items, item] }
          : cat
      )
    );

    resetForm();
  };

  const updateItem = () => {
    if (!editingItem || !newItem.name || !newItem.price || !newItem.category) return;

    setCategories(prev =>
      prev.map(cat => ({
        ...cat,
        items: cat.items.map(item =>
          item.id === editingItem.id
            ? {
                ...item,
                name: newItem.name!,
                description: newItem.description || '',
                price: newItem.price!,
                category: newItem.category!,
                popular: newItem.popular || false,
                available: newItem.available !== false,
              }
            : item
        )
      }))
    );

    resetForm();
  };

  const deleteItem = (categoryId: string, itemId: string) => {
    setCategories(prev =>
      prev.map(cat =>
        cat.id === categoryId
          ? { ...cat, items: cat.items.filter(item => item.id !== itemId) }
          : cat
      )
    );
  };

  const addCategory = () => {
    if (!newCategoryName) return;
    
    setCategories(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        name: newCategoryName,
        items: []
      }
    ]);
    
    setNewCategoryName('');
    setShowAddCategory(false);
  };

  const deleteCategory = (categoryId: string) => {
    if (categories.length <= 1) return;
    setCategories(prev => prev.filter(cat => cat.id !== categoryId));
  };

  const resetForm = () => {
    setEditingItem(null);
    setNewItem({
      name: '',
      description: '',
      price: 0,
      category: categories[0]?.id || '',
      popular: false,
      available: true
    });
    setShowAddForm(false);
  };

  const startEdit = (item: MenuItem) => {
    setEditingItem(item);
    setNewItem({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      popular: item.popular,
      available: item.available
    });
    setShowAddForm(true);
  };

  const loadTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    const newCategories: MenuCategory[] = template.categories.map((cat, idx) => ({
      id: Date.now().toString() + idx,
      name: cat.name,
      items: cat.items.map((itemName, itemIdx) => ({
        id: Date.now().toString() + itemIdx,
        name: itemName,
        description: '',
        price: 0,
        category: 'temp',
        popular: false,
        available: true
      }))
    }));

    setCategories(newCategories);
    setMode('manual');
    setImportMethod(null);
  };

  const handleManualContinue = () => {
    updateData({
      menu: {
        categories,
        importedAt: new Date().toISOString(),
        source: 'manual'
      }
    });
    onNext();
  };

  const handleImportSimulation = async () => {
    setImporting(true);
    for (let i = 0; i <= 100; i += 10) {
      setProgress(i);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Mock imported data
    const mockMenu = {
      categories: [
        {
          id: '1',
          name: 'Antipasti',
          items: [
            { id: '1', name: 'Arancini', description: 'Crispy rice balls with mozzarella', price: 12, popular: true },
            { id: '2', name: 'Calamari', description: 'Fried squid with marinara', price: 14 },
          ]
        },
        {
          id: '2',
          name: 'Pizza',
          items: [
            { id: '3', name: 'Margherita', description: 'Tomato, mozzarella, basil', price: 18, popular: true },
            { id: '4', name: 'Diavola', description: 'Spicy salami', price: 20 },
          ]
        }
      ]
    };
    
    setCategories(mockMenu.categories as MenuCategory[]);
    setMode('manual');
    setImporting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      {/* Mode Selection */}
      {mode === 'select' && (
        <>
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-light mb-2">Add your menu</h2>
            <p className="text-gray-400">Choose how you'd like to get started</p>
          </div>

          {/* Manual Entry - Featured Option */}
          <Card padding="lg" className="mb-6 border-2 border-black hover:shadow-lg transition-all cursor-pointer" onClick={() => setMode('manual')}>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center">
                <Plus className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-light mb-1">Add items manually</h3>
                <p className="text-gray-400">Quickly add your most popular items by hand</p>
              </div>
              <ChevronRight className="w-6 h-6 text-gray-400" />
            </div>
          </Card>

          {/* Import Options Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {methods.map((method) => {
              const Icon = method.icon;
              return (
                <button
                  key={method.id}
                  onClick={() => {
                    setImportMethod(method.id as any);
                    setMode('import');
                  }}
                  className="group relative"
                >
                  <Card padding="lg" className="h-full hover:border-black transition-all text-left">
                    <div className={`w-12 h-12 ${method.color} rounded-xl flex items-center justify-center mb-4`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-medium mb-1">{method.title}</h3>
                    <p className="text-sm text-gray-400">{method.description}</p>
                  </Card>
                </button>
              );
            })}
          </div>

          {/* Template Grid */}
          <h3 className="text-lg font-light mb-4">Or start with a template</h3>
          <div className="grid grid-cols-2 gap-4 mb-6">
            {templates.map((template) => {
              const Icon = template.icon;
              return (
                <button
                  key={template.id}
                  onClick={() => loadTemplate(template.id)}
                  className="group"
                >
                  <Card padding="lg" className="hover:border-black transition-all text-left">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-black group-hover:text-white transition-colors">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-medium mb-1">{template.name}</h3>
                    <p className="text-sm text-gray-400">{template.description}</p>
                  </Card>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Manual Entry Mode */}
      {mode === 'manual' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setMode('select')}
              className="flex items-center gap-2 text-gray-400 hover:text-black transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to options
            </button>
            <h2 className="text-2xl font-light">Build Your Menu</h2>
            <div className="w-20"></div>
          </div>

          {/* Add Category Button */}
          {!showAddCategory ? (
            <button
              onClick={() => setShowAddCategory(true)}
              className="w-full py-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-black hover:text-black transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Category
            </button>
          ) : (
            <Card padding="md" className="bg-gray-50">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Category name (e.g., Appetizers, Pizza)"
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  autoFocus
                />
                <button
                  onClick={addCategory}
                  disabled={!newCategoryName}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowAddCategory(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </Card>
          )}

          {/* Categories */}
          {categories.map((category) => (
            <Card key={category.id} padding="lg" className="relative">
              {/* Category Header */}
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    {categoryIcons[category.name] ? (
                      (() => {
                        const Icon = categoryIcons[category.name];
                        return <Icon className="w-4 h-4" />;
                      })()
                    ) : (
                      <Coffee className="w-4 h-4" />
                    )}
                  </div>
                  <h3 className="font-medium">{category.name}</h3>
                  <span className="text-xs text-gray-400">{category.items.length} items</span>
                </div>
                {categories.length > 1 && (
                  <button
                    onClick={() => deleteCategory(category.id)}
                    className="p-1 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                )}
              </div>

              {/* Items List */}
              <div className="space-y-3 mb-4">
                {category.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-4 p-3 bg-gray-50 rounded-xl group hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{item.name}</span>
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
                          {item.description && (
                            <p className="text-sm text-gray-500">{item.description}</p>
                          )}
                        </div>
                        <span className="font-medium">${item.price.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEdit(item)}
                        className="p-2 hover:bg-white rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => deleteItem(category.id, item.id)}
                        className="p-2 hover:bg-white rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Item Button */}
              <button
                onClick={() => {
                  setEditingCategory(category.id);
                  setNewItem({ ...newItem, category: category.id });
                  setShowAddForm(true);
                }}
                className="w-full py-2 border border-dashed border-gray-200 rounded-lg text-gray-400 hover:border-black hover:text-black transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                Add item to {category.name}
              </button>
            </Card>
          ))}

          {/* Add Item Form Modal */}
          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
                onClick={() => resetForm()}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white rounded-2xl max-w-md w-full p-6"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-light">
                      {editingItem ? 'Edit Item' : 'Add New Item'}
                    </h3>
                    <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-lg">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Item name</label>
                      <input
                        type="text"
                        value={newItem.name}
                        onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                        placeholder="Margherita Pizza"
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea
                        value={newItem.description}
                        onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                        placeholder="Fresh basil, mozzarella, tomato sauce"
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Price ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={newItem.price}
                          onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) })}
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                          placeholder="18.00"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                        <select
                          value={newItem.category}
                          onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                        >
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newItem.popular}
                          onChange={(e) => setNewItem({ ...newItem, popular: e.target.checked })}
                          className="rounded border-gray-300 text-black focus:ring-black"
                        />
                        <span className="text-sm text-gray-600">Mark as popular</span>
                      </label>

                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newItem.available !== false}
                          onChange={(e) => setNewItem({ ...newItem, available: e.target.checked })}
                          className="rounded border-gray-300 text-black focus:ring-black"
                        />
                        <span className="text-sm text-gray-600">Available</span>
                      </label>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={editingItem ? updateItem : addItem}
                        disabled={!newItem.name || !newItem.price}
                        className="flex-1 bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                      >
                        {editingItem ? 'Update Item' : 'Add Item'}
                      </button>
                      <button
                        onClick={resetForm}
                        className="px-6 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Summary and Navigation */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-400">Total items</p>
                <p className="text-2xl font-light">
                  {categories.reduce((acc, cat) => acc + cat.items.length, 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Categories</p>
                <p className="text-2xl font-light">{categories.length}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={onPrev} className="flex-1">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleManualContinue} className="flex-1">
                Continue
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Import Mode */}
      {mode === 'import' && importMethod && (
        <Card padding="xl" className="text-center">
          <button
            onClick={() => {
              setMode('select');
              setImportMethod(null);
            }}
            className="flex items-center gap-2 text-gray-400 hover:text-black mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to options
          </button>

          <div className="mb-8">
            <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              {importMethod === 'photo' && <Camera className="w-8 h-8 text-blue-600" />}
              {importMethod === 'pdf' && <FileText className="w-8 h-8 text-purple-600" />}
              {importMethod === 'url' && <Link className="w-8 h-8 text-green-600" />}
              {importMethod === 'template' && <Sparkles className="w-8 h-8 text-orange-600" />}
            </div>
            <h3 className="text-xl font-light mb-2">
              {importMethod === 'photo' && 'Take a photo'}
              {importMethod === 'pdf' && 'Upload PDF'}
              {importMethod === 'url' && 'Enter website URL'}
              {importMethod === 'template' && 'Choose a template'}
            </h3>
            <p className="text-gray-400">
              {importMethod === 'photo' && 'Position your menu in the frame and take a photo'}
              {importMethod === 'pdf' && 'Drag and drop your PDF menu file'}
              {importMethod === 'url' && 'Enter your restaurant website URL'}
              {importMethod === 'template' && 'Select a template to customize'}
            </p>
          </div>

          {importing ? (
            <>
              <div className="w-full bg-gray-100 rounded-full h-2 mb-8">
                <motion.div
                  className="bg-black h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              {progress === 100 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-green-50 border border-green-100 rounded-xl p-4 mb-8"
                >
                  <p className="text-green-700">✨ Menu imported successfully!</p>
                </motion.div>
              )}
            </>
          ) : (
            <Button
              onClick={handleImportSimulation}
              size="lg"
              fullWidth
              className="mb-4"
            >
              Start Import
            </Button>
          )}

          {progress === 100 && (
            <Button onClick={() => setMode('manual')} size="lg" fullWidth>
              Review Menu
            </Button>
          )}
        </Card>
      )}
    </motion.div>
  );
}