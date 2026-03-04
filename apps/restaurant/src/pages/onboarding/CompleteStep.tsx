import { useState } from 'react';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { config } from '../../lib/config';

interface CompleteStepProps {
  restaurantId: string;
  data: any;
  updateData: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function CompleteStep({ restaurantId, data }: CompleteStepProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoToDashboard = async () => {
    const menu = data?.menu;
    const token = localStorage.getItem('drift-token');
    if (menu?.categories?.length && token) {
      setSaving(true);
      setError(null);
      try {
        const categories = menu.categories.map((cat: any) => ({
          name: cat.name || '',
          items: (cat.items || []).map((item: any) => ({
            name: item.name || '',
            description: item.description || '',
            price: item.price ?? 0
          }))
        }));
        const res = await fetch(`${config.apiUrl}/api/restaurants/${restaurantId}/menu/bulk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ categories })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setError(err.error || 'Failed to save menu');
          setSaving(false);
          return;
        }
      } catch {
        setError('Could not connect. Please try again.');
        setSaving(false);
        return;
      }
      setSaving(false);
    }
    window.location.href = `/dashboard/${restaurantId}`;
  };

  return (
    <div className="text-center py-12">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-10 h-10 text-green-600" />
      </div>
      
      <h2 className="text-3xl font-light text-gray-900 mb-4">
        You're all set! 🎉
      </h2>
      
      <p className="text-gray-400 mb-8 max-w-md mx-auto">
        Your restaurant is ready to start accepting orders.
        Head to your dashboard to see it in action.
      </p>

      {error && (
        <p className="text-sm text-red-600 mb-4">{error}</p>
      )}

      <Button onClick={handleGoToDashboard} size="lg" disabled={saving}>
        {saving ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Saving menu…
          </>
        ) : (
          <>
            Go to Dashboard
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </Button>
    </div>
  );
}