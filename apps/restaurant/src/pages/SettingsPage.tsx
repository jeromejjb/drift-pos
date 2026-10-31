import { useState, useEffect } from 'react';
import { useSearchParams, useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { User, Store, CreditCard, Bell, Save, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useUser } from '../hooks/useUser';
import { PlanBadge } from '../components/ui/PlanBadge';
import { isOrderSoundEnabled, setOrderSoundEnabled } from '../lib/orderSound';

export function SettingsPage() {
  const { user } = useUser();
  const { restaurantId: urlRestaurantId } = useParams<{ restaurantId: string }>();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  
  const API_URL = import.meta.env.VITE_API_URL || 'https://api.driftpos.com';

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const [restaurant, setRestaurant] = useState({
    name: '',
    address: '',
    phone: '',
    cuisine: '',
    stripeAccount: null as string | null,
  });

  const [accountStatus, setAccountStatus] = useState<{
    details_submitted: boolean;
    charges_enabled: boolean;
    payouts_enabled: boolean;
    isOnboardingComplete: boolean;
  } | null>(null);
  const [accountStatusLoading, setAccountStatusLoading] = useState(false);
  const [accountStatusError, setAccountStatusError] = useState('');
  const [loginLinkLoading, setLoginLinkLoading] = useState(false);
  const [loginLinkError, setLoginLinkError] = useState('');

  const [orderSoundEnabled, setOrderSoundEnabledState] = useState(isOrderSoundEnabled);

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  useEffect(() => {
    const rid = user?.restaurantId || urlRestaurantId || localStorage.getItem('drift-restaurant-id');
    if (rid) {
      fetchRestaurantDetails(rid);
    }
  }, [user?.restaurantId, urlRestaurantId]);

  const fetchRestaurantDetails = async (restaurantId: string) => {
    try {
      const token = localStorage.getItem('drift-token');
      const response = await fetch(`${API_URL}/api/restaurants/${restaurantId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (response.ok) {
        const data = await response.json();
        setRestaurant({
          name: data.name || '',
          address: data.address || '',
          phone: data.phone || '',
          cuisine: data.cuisine || '',
          stripeAccount: data.stripeAccount ?? null,
        });
      }
    } catch (error) {
      console.error('Error fetching restaurant:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    
    setSaving(true);
    setSaveSuccess(false);
    setSaveError('');
    
    const token = localStorage.getItem('drift-token');
    try {
      const response = await fetch(`${API_URL}/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(profile)
      });
      
      if (response.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save');
      }
    } catch (error: any) {
      setSaveError(error.message || 'Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRestaurant = async () => {
    const rid = user?.restaurantId || urlRestaurantId;
    if (!rid) return;
    
    setSaving(true);
    setSaveSuccess(false);
    setSaveError('');
    
    const token = localStorage.getItem('drift-token');
    try {
      const response = await fetch(`${API_URL}/api/restaurants/${rid}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(restaurant)
      });
      
      if (response.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save');
      }
    } catch (error: any) {
      setSaveError(error.message || 'Failed to save restaurant details.');
    } finally {
      setSaving(false);
    }
  };

  // Load Stripe Connect account status when we know the Stripe account ID
  useEffect(() => {
    const fetchStatus = async () => {
      if (!restaurant.stripeAccount) {
        setAccountStatus(null);
        setAccountStatusError('');
        return;
      }
      setAccountStatusLoading(true);
      setAccountStatusError('');
      try {
        const token = localStorage.getItem('drift-token');
        const res = await fetch(`${API_URL}/api/stripe/account-status/${restaurant.stripeAccount}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setAccountStatus(null);
          setAccountStatusError(data.error || 'Failed to load payment account status.');
          return;
        }
        setAccountStatus({
          details_submitted: !!data.details_submitted,
          charges_enabled: !!data.charges_enabled,
          payouts_enabled: !!data.payouts_enabled,
          isOnboardingComplete: !!data.isOnboardingComplete,
        });
      } catch (err: any) {
        setAccountStatus(null);
        setAccountStatusError(err?.message || 'Failed to load payment account status.');
      } finally {
        setAccountStatusLoading(false);
      }
    };
    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurant.stripeAccount]);

  const handleOpenStripeDashboard = async () => {
    if (!restaurant.stripeAccount || loginLinkLoading) return;
    setLoginLinkLoading(true);
    setLoginLinkError('');
    try {
      const token = localStorage.getItem('drift-token');
      const res = await fetch(`${API_URL}/api/stripe/login-link/${restaurant.stripeAccount}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Failed to open Stripe dashboard.');
      }
      window.location.href = data.url as string;
    } catch (err: any) {
      setLoginLinkError(err?.message || 'Failed to open Stripe dashboard.');
    } finally {
      setLoginLinkLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'restaurant', label: 'Restaurant', icon: Store },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <Layout title="Settings">
      <div className="max-w-4xl mx-auto">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-black shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Success/Error Messages */}
        {saveSuccess && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Changes saved successfully!
          </div>
        )}
        
        {saveError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {saveError}
          </div>
        )}

        {/* Content */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <h3 className="text-lg font-light mb-4">Profile Settings</h3>
              
              <div>
                <label className="text-sm text-gray-500 mb-1 block">Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="text-sm text-gray-500 mb-1 block">Email</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="text-sm text-gray-500 mb-1 block">Phone</label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black"
                  placeholder="(555) 123-4567"
                />
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}

          {activeTab === 'restaurant' && (
            <div className="space-y-4">
              <h3 className="text-lg font-light mb-4">Restaurant Information</h3>
              
              <div>
                <label className="text-sm text-gray-500 mb-1 block">Restaurant Name</label>
                <input
                  type="text"
                  value={restaurant.name}
                  onChange={(e) => setRestaurant({ ...restaurant, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black"
                  placeholder="Trattoria Bellini"
                />
              </div>

              <div>
                <label className="text-sm text-gray-500 mb-1 block">Address</label>
                <input
                  type="text"
                  value={restaurant.address}
                  onChange={(e) => setRestaurant({ ...restaurant, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black"
                  placeholder="123 Main St, New York, NY"
                />
              </div>

              <div>
                <label className="text-sm text-gray-500 mb-1 block">Phone</label>
                <input
                  type="tel"
                  value={restaurant.phone}
                  onChange={(e) => setRestaurant({ ...restaurant, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black"
                  placeholder="(212) 555-0123"
                />
              </div>

              <div>
                <label className="text-sm text-gray-500 mb-1 block">Cuisine Type</label>
                <input
                  type="text"
                  value={restaurant.cuisine}
                  onChange={(e) => setRestaurant({ ...restaurant, cuisine: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black"
                  placeholder="Italian, Pizza, etc."
                />
              </div>

              <button
                onClick={handleSaveRestaurant}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Restaurant Info
                  </>
                )}
              </button>
            </div>
          )}

          {activeTab === 'billing' && (
            <div>
              <h3 className="text-lg font-light mb-4">Billing & Plan</h3>

              {/* Payments info */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                <div className="flex gap-3">
                  <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900 mb-1">
                      {restaurant.stripeAccount ? 'Payment account connected' : 'Set up your payment account'}
                    </p>
                    <p className="text-sm text-blue-800">
                      {restaurant.stripeAccount
                        ? 'Your payment account is connected. Diners can pay at the table via QR checkout.'
                        : 'Add your bank account to accept card payments from diners. Setup takes a few minutes. Until then, orders appear but card payments are not processed.'}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      {!restaurant.stripeAccount && (
                        <Link
                          to={`/onboarding?restaurantId=${user?.restaurantId || urlRestaurantId || localStorage.getItem('drift-restaurant-id')}&step=bank`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <CreditCard className="w-4 h-4" />
                          Complete payment setup
                        </Link>
                      )}
                      {restaurant.stripeAccount && (
                        <>
                          <span className="inline-flex items-center gap-2 text-xs font-medium text-blue-900 bg-blue-100 rounded-full px-3 py-1">
                            {accountStatusLoading ? (
                              <>
                                <span className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                Checking status…
                              </>
                            ) : accountStatus ? (
                              <>
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    accountStatus.charges_enabled && accountStatus.payouts_enabled
                                      ? 'bg-emerald-500'
                                      : 'bg-amber-500'
                                  }`}
                                />
                                {accountStatus.charges_enabled && accountStatus.payouts_enabled
                                  ? 'Live: charges & payouts enabled'
                                  : accountStatus.charges_enabled
                                    ? 'Charges enabled, payouts pending'
                                    : 'Verification in progress'}
                              </>
                            ) : (
                              <>
                                <span className="w-2 h-2 rounded-full bg-gray-400" />
                                Status unavailable
                              </>
                            )}
                          </span>
                          <button
                            type="button"
                            onClick={handleOpenStripeDashboard}
                            disabled={loginLinkLoading}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-700 border border-blue-200 text-xs font-medium rounded-lg hover:bg-blue-50 disabled:opacity-60"
                          >
                            {loginLinkLoading ? (
                              <>
                                <span className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                Opening Stripe…
                              </>
                            ) : (
                              <>
                                <CreditCard className="w-4 h-4" />
                                Manage payouts in Stripe
                              </>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                    {loginLinkError && (
                      <p className="mt-2 text-xs text-red-700">
                        {loginLinkError}
                      </p>
                    )}
                    {accountStatusError && restaurant.stripeAccount && (
                      <p className="mt-2 text-xs text-red-700">
                        {accountStatusError}
                      </p>
                    )}
                    <div className="mt-3">
                      <Link
                        to={`/payouts/${user?.restaurantId || urlRestaurantId || localStorage.getItem('drift-restaurant-id')}`}
                        className="text-sm font-medium text-blue-800 underline"
                      >
                        View balance and payouts
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-medium">Current Plan</p>
                    <p className="text-sm text-gray-400">Your subscription details</p>
                  </div>
                  <PlanBadge plan={user?.subscription?.plan || 'free'} />
                </div>

                <button className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800">
                  Upgrade Plan
                </button>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <h4 className="font-medium mb-4">Payment Methods</h4>
                <button className="text-sm text-gray-400 hover:text-black">
                  + Add payment method
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div>
              <h3 className="text-lg font-light mb-4">Notification Preferences</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Order sound</p>
                    <p className="text-sm text-gray-400">Play a sound when a new order arrives</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={orderSoundEnabled}
                      onChange={(e) => {
                        const v = e.target.checked;
                        setOrderSoundEnabled(v);
                        setOrderSoundEnabledState(v);
                      }}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-gray-400">Receive order updates via email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-gray-400">Browser notifications for new orders</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">SMS Alerts</p>
                    <p className="text-sm text-gray-400">Text messages for urgent orders</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}