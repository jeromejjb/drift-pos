import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Home } from 'lucide-react';

export function ConfirmationPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="container max-w-md mx-auto px-4 py-12 text-center">
        <div className="mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-medium mb-2">Order Confirmed!</h1>
          <p className="text-gray-500">
            Your order #{orderId?.slice(-6)} has been sent to the kitchen.
          </p>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 mb-8">
          <p className="text-sm text-gray-500 mb-2">Estimated wait</p>
          <p className="text-3xl font-light">15-20 min</p>
        </div>

        <button
          onClick={() => navigate('/')}
          className="w-full bg-black hover:bg-gray-800 text-white font-medium py-4 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <Home className="w-5 h-5" />
          Back to Home
        </button>
      </div>
    </div>
  );
}