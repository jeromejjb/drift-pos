import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Grid, 
  List, 
  Settings, 
  LogOut, 
  QrCode,
  Menu,
  X,
  Bell,
  HelpCircle,
  ChevronDown,
  Store,
  TrendingUp,
  Clock,
  CheckCircle,
  User
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LayoutProps {
  children: ReactNode;
  title: string;
  restaurantName?: string;
  showNotifications?: boolean;
}

export function Layout({ 
  children, 
  title, 
  restaurantName: propRestaurantName,
  showNotifications = true 
}: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [restaurantName, setRestaurantName] = useState<string>('');
  const [notifications, setNotifications] = useState(3);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Extract restaurantId from current path
  const restaurantId = location.pathname.split('/')[2] || '';

  // Professional navigation items with descriptions
  const navItems = [
    { 
      path: '/dashboard', 
      icon: Home, 
      label: 'Dashboard', 
      description: 'Overview & analytics',
      badge: null 
    },
    { 
      path: '/tables', 
      icon: Grid, 
      label: 'Tables', 
      description: 'Manage tables & QR codes',
      badge: null 
    },
    { 
      path: '/orders', 
      icon: List, 
      label: 'Orders', 
      description: 'Active & past orders',
      badge: { count: 3, color: 'red' }
    },
    { 
      path: '/menu', 
      icon: Store, 
      label: 'Menu', 
      description: 'Edit your menu items',
      badge: null 
    },
    { 
      path: '/settings', 
      icon: Settings, 
      label: 'Settings', 
      description: 'Restaurant preferences',
      badge: null 
    },
  ];

  // Quick actions for the header
  const quickActions = [
    { icon: Bell, label: 'Notifications', onClick: () => {}, badge: notifications },
    { icon: HelpCircle, label: 'Help', onClick: () => window.open('/help', '_blank') },
  ];

  // Fetch restaurant details
  useEffect(() => {
    const fetchRestaurantName = async () => {
      if (propRestaurantName) {
        setRestaurantName(propRestaurantName);
        return;
      }

      if (restaurantId) {
        try {
          const response = await fetch(`http://localhost:3001/api/restaurants/${restaurantId}`);
          if (response.ok) {
            const data = await response.json();
            setRestaurantName(data.name);
          } else {
            setRestaurantName('Your Restaurant');
          }
        } catch (error) {
          console.error('Error fetching restaurant name:', error);
          setRestaurantName('Your Restaurant');
        }
      }
    };

    fetchRestaurantName();
  }, [restaurantId, propRestaurantName]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
      
      localStorage.removeItem('drift-restaurant-id');
      localStorage.removeItem('drift-user-email');
      localStorage.removeItem('drift-dev-mode');
      
      window.location.href = 'http://localhost:5175';
    } catch (error) {
      console.error('Error signing out:', error);
      window.location.href = 'http://localhost:5175';
    } finally {
      setSigningOut(false);
    }
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
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
              <Store className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{restaurantName || 'Loading...'}</p>
              <p className="text-xs text-gray-400">Premium Plan</p>
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
                onClick={() => navigate(`/${item.path}/${restaurantId}`)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl
                  transition-all duration-200 relative group
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
                
                {/* Badge */}
                {item.badge && item.badge.count > 0 && (
                  <div className={`
                    w-5 h-5 rounded-full text-xs flex items-center justify-center
                    ${isActive 
                      ? 'bg-white text-black' 
                      : 'bg-red-500 text-white'
                    }
                  `}>
                    {item.badge.count}
                  </div>
                )}

                {/* Active Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute left-0 w-1 h-8 bg-white rounded-r-full"
                    transition={{ type: "spring", bounce: 0.2 }}
                  />
                )}
              </motion.button>
            );
          })}
        </nav>

        {/* User Menu */}
        <div className="border-t border-gray-100 p-4">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium">JD</span>
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium">John Doe</p>
              <p className="text-xs text-gray-400">john@restaurant.com</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-2 space-y-1"
              >
                <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">
                  <User className="w-4 h-4" />
                  Profile
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">
                  <Settings className="w-4 h-4" />
                  Account Settings
                </button>
                <button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                >
                  {signingOut ? (
                    <>
                      <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                      Signing out...
                    </>
                  ) : (
                    <>
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
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
          
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-lg relative">
              <Bell className="w-5 h-5" />
              {notifications > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
            <button
              onClick={() => navigate(`/tables/${restaurantId}`)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <QrCode className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Page Title */}
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
                {/* Mobile Drawer Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                      <span className="text-white font-light text-lg">d</span>
                    </div>
                    <span className="font-light text-lg">drift</span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Mobile Restaurant Info */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                      <Store className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium">{restaurantName || 'Loading...'}</p>
                      <p className="text-xs text-gray-400">Premium Plan</p>
                    </div>
                  </div>
                </div>

                {/* Mobile Navigation */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === `/${item.path}/${restaurantId}`;
                    
                    return (
                      <button
                        key={item.path}
                        onClick={() => {
                          navigate(`/${item.path}/${restaurantId}`);
                          setMobileMenuOpen(false);
                        }}
                        className={`
                          w-full flex items-center gap-3 px-4 py-3 rounded-xl
                          transition-colors
                          ${isActive ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-50'}
                        `}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="flex-1 text-left font-medium">{item.label}</span>
                        {item.badge && item.badge.count > 0 && (
                          <span className={`
                            w-5 h-5 text-xs rounded-full flex items-center justify-center
                            ${isActive ? 'bg-white text-black' : 'bg-red-500 text-white'}
                          `}>
                            {item.badge.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>

                {/* Mobile Sign Out */}
                <div className="border-t border-gray-100 p-4">
                  <button
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl disabled:opacity-50"
                  >
                    {signingOut ? (
                      <>
                        <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        Signing out...
                      </>
                    ) : (
                      <>
                        <LogOut className="w-5 h-5" />
                        Sign Out
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="lg:pl-72">
        <div className="max-w-7xl mx-auto p-4 lg:p-8">
          {/* Desktop Title (hidden on mobile) */}
          <div className="hidden lg:block mb-8">
            <h1 className="text-3xl font-light">{title}</h1>
          </div>
          
          {/* Children */}
          {children}
        </div>
      </main>
    </div>
  );
}