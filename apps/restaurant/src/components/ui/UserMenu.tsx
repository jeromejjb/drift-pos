import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Settings, User as UserIcon, ChevronDown } from 'lucide-react';
import { useUser } from '../../hooks/useUser';
import { supabase } from '../../lib/supabase';

export function UserMenu() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
      localStorage.removeItem('drift-restaurant-id');
      localStorage.removeItem('drift-user-email');
      localStorage.removeItem('drift-dev-mode');
      window.location.href = 'https://drift-landing.onrender.com';
    } catch (error) {
      console.error('Error signing out:', error);
      window.location.href = 'https://drift-landing.onrender.com';
    } finally {
      setSigningOut(false);
    }
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors"
      >
        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt={user.name} className="w-8 h-8 rounded-full" />
          ) : (
            <span className="text-sm font-medium">
              {user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
            </span>
          )}
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-medium truncate">{user.name || 'User'}</p>
          <p className="text-xs text-gray-400 truncate">{user.email}</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-lg border border-gray-100 py-2">
          <button
            onClick={() => {
              setIsOpen(false);
              navigate('/settings');
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <UserIcon className="w-4 h-4" />
            Profile
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              navigate('/settings?tab=account');
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Settings className="w-4 h-4" />
            Account Settings
          </button>
          <hr className="my-2 border-gray-100" />
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
        </div>
      )}
    </div>
  );
}