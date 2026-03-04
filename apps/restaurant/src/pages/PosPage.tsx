import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { QuickOrderModal } from '../components/pos/QuickOrderModal';

export function PosPage() {
  const { restaurantId } = useParams();
  const navigate = useNavigate();

  const handleOrderComplete = () => {
    navigate(`/orders/${restaurantId}`);
  };

  const handleClose = () => {
    navigate(`/dashboard/${restaurantId}`);
  };

  if (!restaurantId) return null;

  return (
    <Layout title="Quick Order">
      <QuickOrderModal
        isOpen={true}
        onClose={handleClose}
        restaurantId={restaurantId}
        onOrderComplete={handleOrderComplete}
      />
    </Layout>
  );
}
