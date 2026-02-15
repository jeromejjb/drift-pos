import { CheckCircle, ArrowRight } from 'lucide-react';

interface CompleteStepProps {
  restaurantId: string;
  data: any;
  updateData: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function CompleteStep({ restaurantId, onNext }: CompleteStepProps) {
  const handleGoToDashboard = () => {
    // Redirect to dashboard with restaurant ID
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

      <button
        onClick={handleGoToDashboard}
        className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors"
      >
        Go to Dashboard
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
}