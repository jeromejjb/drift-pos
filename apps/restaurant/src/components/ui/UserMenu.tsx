import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LogOut, Settings, User as UserIcon, ChevronDown, LogIn } from 'lucide-react';
import { useUser } from '../../hooks/useUser';
import { supabase } from '../../lib/supabase';
import { config } from '../../lib/config';

export function UserMenu() {
  const { user, loading } = useUser();
  const navigate = useNavigate();
  const { restaurantId } = useParams();
  const [isOpen, setIsOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('drift-token');

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
      localStorage.removeItem('drift-token');
      localStorage.removeItem('drift-restaurant-id');
      localStorage.removeItem('drift-user-email');
      localStorage.removeItem('drift-dev-mode');
      window.location.href = config.landingUrl;
    } catch (error) {
      console.error('Error signing out:', error);
      window.location.href = config.landingUrl;
    } finally {
      setSigningOut(false);
    }
  };

  const handleSignIn = () => {
    window.location.href = `${config.landingUrl}/login`;
  };

  // Always show menu — even when user is null (e.g. API slow/failed), so sign in/out is always available
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors"
      >
        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center shrink-0">
          {loading ? (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          ) : user?.avatar_url ? (
            <img src={user.avatar_url} alt={user.name} className="w-8 h-8 rounded-full" />
          ) : (
            <span className="text-sm font-medium text-gray-600">
              {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || (hasToken ? '?' : '') || 'U'}
            </span>
          )}
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-medium truncate">{user?.name || (hasToken ? 'Account' : 'Guest')}</p>
          <p className="text-xs text-gray-400 truncate">{user?.email || (hasToken ? 'Signed in' : 'Sign in to continue')}</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
          {hasToken ? (
            <>
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate(`/settings/${restaurantId}`);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <UserIcon className="w-4 h-4" />
                Profile
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate(`/settings/${restaurantId}?tab=profile`);
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
            </>
          ) : (
            <button
              onClick={() => {
                setIsOpen(false);
                handleSignIn();
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
          )}
        </div>
      )}
    </div>
  );
}