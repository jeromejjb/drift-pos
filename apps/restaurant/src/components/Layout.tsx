import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Grid, 
  List, 
  Settings, 
  QrCode,
  Menu,
  X,
  Bell,
  Store,
  Plus
} from 'lucide-react';
import { useUser } from '../hooks/useUser';
import { useSubscription } from '../hooks/useSubscription';
import { PlanBadge } from './ui/PlanBadge';
import { UserMenu } from './ui/UserMenu';

interface LayoutProps {
  children: ReactNode;
  title: string;
}

export function Layout({ children, title }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const { subscription } = useSubscription(user?.id);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [restaurantName, setRestaurantName] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'https://drift-api.onrender.com';

  // Extract restaurantId from current path
  const restaurantId = location.pathname.split('/')[2] || '';

  // Debug logging
  useEffect(() => {
    console.log('📌 Layout mounted');
    console.log('📍 Current pathname:', location.pathname);
    console.log('🔍 Extracted restaurantId:', restaurantId);
    console.log('🌐 Full URL:', window.location.href);
  }, [location, restaurantId]);

  // Fetch restaurant details
  useEffect(() => {
    const fetchRestaurantName = async () => {
      if (restaurantId) {
        try {
          console.log('📡 Fetching restaurant name for ID:', restaurantId);
          const response = await fetch(`${API_URL}/api/restaurants/${restaurantId}`);
          if (response.ok) {
            const data = await response.json();
            setRestaurantName(data.name);
            console.log('✅ Restaurant name:', data.name);
          } else {
            console.log('❌ Restaurant fetch failed:', response.status);
          }
        } catch (error) {
          console.error('Error fetching restaurant name:', error);
        }
      }
    };

    fetchRestaurantName();
  }, [restaurantId, API_URL]);

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard', description: 'Overview & analytics' },
    { path: '/tables', icon: Grid, label: 'Tables', description: 'Manage tables & QR codes' },
    { path: '/orders', icon: List, label: 'Orders', description: 'Active & past orders' },
    { path: '/menu', icon: Store, label: 'Menu', description: 'Edit your menu items' },
    { path: '/pos', icon: Plus, label: 'Quick Order', description: 'Place orders manually' },
    { path: '/settings', icon: Settings, label: 'Settings', description: 'Restaurant preferences' },
  ];

  const handleNavigation = (path: string) => {
    const fullPath = `/${path}/${restaurantId}`;
    console.log('📍 Navigation clicked:', {
      from: location.pathname,
      to: fullPath,
      restaurantId,
      fullUrl: window.location.origin + fullPath
    });
    
    // Prevent default and navigate
    navigate(fullPath);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 lg:bg-white lg:border-r lg:border-gray-100">
        {/* Logo Area */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white font-light text-xl">d</span>
            </div>
            <div>
              <h1 className="text-lg font-light tracking-tight">drift</h1>
              <p className="text-xs text-gray-400">restaurant partner</p>
            </div>
          </div>
        </div>

        {/* Restaurant Info */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium truncate">{restaurantName || 'Your Restaurant'}</p>
              <div className="mt-2">
                <PlanBadge plan={subscription?.plan || 'free'} status={subscription?.status} />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === `/${item.path}/${restaurantId}`;
            
            return (
              <motion.button
                key={item.path}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigation(item.path);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl
                  transition-all duration-200
                  ${isActive 
                    ? 'bg-black text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-50'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className={`text-xs ${isActive ? 'text-gray-300' : 'text-gray-400'}`}>
                    {item.description}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </nav>

        {/* User Menu */}
        <div className="border-t border-gray-100 p-4">
          <UserMenu />
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div>
              <h1 className="text-lg font-light">drift</h1>
              <p className="text-xs text-gray-400">{restaurantName || 'Loading...'}</p>
            </div>
          </div>
          
          <button
            onClick={() => handleNavigation('tables')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <QrCode className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 pb-3">
          <h2 className="text-2xl font-light">{title}</h2>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", bounce: 0.1 }}
              className="lg:hidden fixed top-0 left-0 bottom-0 w-72 bg-white z-50 shadow-xl"
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                      <span className="text-white font-light text-lg">d</span>
                    </div>
                    <span className="font-light text-lg">drift</span>
                  </div>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-2">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-4 border-b border-gray-100">
                  <p className="font-medium">{restaurantName || 'Your Restaurant'}</p>
                  <div className="mt-2">
                    <PlanBadge plan={subscription?.plan || 'free'} />
                  </div>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.path}
                        onClick={() => {
                          handleNavigation(item.path);
                          setMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 text-gray-600"
                      >
                        <Icon className="w-5 h-5" />
                        <span className="flex-1 text-left font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                </nav>

                <div className="border-t border-gray-100 p-4">
                  <UserMenu />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="lg:pl-72">
        <div className="max-w-7xl mx-auto p-4 lg:p-8">
          <div className="hidden lg:block mb-8">
            <h1 className="text-3xl font-light">{title}</h1>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}