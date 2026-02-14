interface PlanBadgeProps {
  plan: 'free' | 'pro' | 'enterprise';
  status?: string;
}

export function PlanBadge({ plan, status }: PlanBadgeProps) {
  const getBadgeStyles = () => {
    switch (plan) {
      case 'pro':
        return 'bg-black text-white';
      case 'enterprise':
        return 'bg-purple-600 text-white';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getLabel = () => {
    if (status === 'past_due') return 'Payment Due';
    if (status === 'trialing') return 'Trial';
    
    switch (plan) {
      case 'pro':
        return 'Pro Plan';
      case 'enterprise':
        return 'Enterprise';
      default:
        return 'Free Plan';
    }
  };

  return (
    <span className={`inline-block px-2 py-1 rounded-full text-xs ${getBadgeStyles()}`}>
      {getLabel()}
    </span>
  );
}