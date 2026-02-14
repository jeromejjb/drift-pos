import { Layout } from '../components/Layout';
import { User, Store, CreditCard, Bell } from 'lucide-react';

export function SettingsPage() {
  return (
    <Layout title="Settings">
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-medium">Restaurant Profile</h3>
              <p className="text-xs text-gray-400">Name, address, contact</p>
            </div>
          </div>
          <button className="text-sm text-gray-400 hover:text-black">
            Edit →
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gray-100 rounded-lg">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-medium">Staff Accounts</h3>
              <p className="text-xs text-gray-400">Manage access</p>
            </div>
          </div>
          <button className="text-sm text-gray-400 hover:text-black">
            Manage →
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gray-100 rounded-lg">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-medium">Payments</h3>
              <p className="text-xs text-gray-400">Stripe connection, payout settings</p>
            </div>
          </div>
          <button className="text-sm text-gray-400 hover:text-black">
            Configure →
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-medium">Notifications</h3>
              <p className="text-xs text-gray-400">Order alerts, updates</p>
            </div>
          </div>
          <button className="text-sm text-gray-400 hover:text-black">
            Customize →
          </button>
        </div>
      </div>
    </Layout>
  );
}
