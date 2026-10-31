import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { config } from '../lib/config';

type Payout = {
  id: string;
  stripePayoutId: string;
  amountCents: number;
  currency: string;
  status: string;
  arrivalDate: string | null;
  failureMessage: string | null;
  createdAt: string;
};

type Summary = {
  availableCents: number;
  pendingCents: number;
  feeRate: number;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  payouts: Payout[];
};

function money(cents: number) {
  return (cents / 100).toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

export function PayoutsPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    setError('');
    setCode('');
    try {
      const token = localStorage.getItem('drift-token');
      const res = await fetch(`${config.apiUrl}/api/stripe/restaurants/${restaurantId}/payouts`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSummary(null);
        setCode(body.code || '');
        setError(body.error || 'Could not load balances.');
        return;
      }
      setSummary(body);
    } catch {
      setError('Could not reach the payments API.');
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    load();
  }, [load]);

  const payOut = async () => {
    if (!restaurantId) return;
    setPaying(true);
    setNotice('');
    setError('');
    try {
      const token = localStorage.getItem('drift-token');
      const res = await fetch(`${config.apiUrl}/api/stripe/restaurants/${restaurantId}/payouts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({}),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || 'Payout failed.');
        return;
      }
      setNotice(`Payout of ${money(body.payout.amountCents)} is ${body.payout.status}.`);
      await load();
    } catch {
      setError('Could not reach the payments API.');
    } finally {
      setPaying(false);
    }
  };

  const feeLabel = summary ? `${(summary.feeRate * 100).toFixed(2).replace(/\.00$/, '')}%` : null;

  return (
    <Layout title="Payouts">
      <div className="max-w-3xl mx-auto">
        <p className="text-sm text-gray-500 mb-6">
          Card payments land on your Stripe balance. Drift keeps {feeLabel || 'a small percentage'} and the rest is yours to pay out.
        </p>

        {loading && <p className="text-sm text-gray-500">Loading balance…</p>}

        {!loading && code === 'RESTAURANT_NO_STRIPE' && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-lg font-medium mb-2">No payout account yet</h2>
            <p className="text-sm text-gray-600 mb-4">
              Connect Stripe to accept table payments and see what is available to deposit.
            </p>
            <Link
              to={`/onboarding?restaurantId=${restaurantId}&step=bank`}
              className="inline-flex px-4 py-2 bg-black text-white text-sm rounded-lg"
            >
              Connect payments
            </Link>
          </div>
        )}

        {!loading && error && code !== 'RESTAURANT_NO_STRIPE' && (
          <p className="text-sm text-red-700 mb-4">{error}</p>
        )}
        {notice && <p className="text-sm text-emerald-700 mb-4">{notice}</p>}

        {summary && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <p className="text-xs uppercase tracking-wide text-gray-400">Available</p>
                <p className="text-3xl font-light mt-1">{money(summary.availableCents)}</p>
                <button
                  type="button"
                  onClick={payOut}
                  disabled={paying || summary.availableCents <= 0}
                  className="mt-4 px-4 py-2 bg-black text-white text-sm rounded-lg disabled:opacity-40"
                >
                  {paying ? 'Paying out…' : 'Pay out available balance'}
                </button>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <p className="text-xs uppercase tracking-wide text-gray-400">Pending</p>
                <p className="text-3xl font-light mt-1">{money(summary.pendingCents)}</p>
                <p className="text-xs text-gray-500 mt-4">
                  {summary.chargesEnabled && summary.payoutsEnabled
                    ? 'Charges and payouts are enabled.'
                    : 'Stripe is still verifying this account.'}
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 text-sm font-medium">Recent payouts</div>
              {summary.payouts.length === 0 ? (
                <p className="px-5 py-6 text-sm text-gray-500">No payouts yet. They show up here after you pay out or Stripe deposits on its schedule.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-left text-gray-400">
                    <tr>
                      <th className="px-5 py-2 font-medium">When</th>
                      <th className="px-5 py-2 font-medium">Amount</th>
                      <th className="px-5 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.payouts.map((payout) => (
                      <tr key={payout.id} className="border-t border-gray-100">
                        <td className="px-5 py-3">{new Date(payout.createdAt).toLocaleString()}</td>
                        <td className="px-5 py-3">{money(payout.amountCents)}</td>
                        <td className="px-5 py-3 capitalize">
                          {payout.status}
                          {payout.failureMessage ? ` — ${payout.failureMessage}` : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
