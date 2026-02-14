// apps/restaurant/src/components/ui/ProfessionalTabs.tsx
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icons } from './icons';
import type { TabConfig } from '../../config/tabs';

interface ProfessionalTabsProps {
  tabs: TabConfig[];
  orientation?: 'horizontal' | 'vertical';
  showIcons?: boolean;
  showLabels?: boolean;
  badgeVariant?: 'dot' | 'number' | 'text';
}

export function ProfessionalTabs({ 
  tabs, 
  orientation = 'horizontal',
  showIcons = true,
  showLabels = true,
  badgeVariant = 'number'
}: ProfessionalTabsProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const restaurantId = location.pathname.split('/')[2] || '';

  const getBadgeStyle = (color: string = 'blue') => {
    const styles = {
      red: 'bg-red-500',
      green: 'bg-green-500',
      blue: 'bg-blue-500',
      yellow: 'bg-yellow-500',
    };
    return styles[color as keyof typeof styles] || styles.blue;
  };

  return (
    <div className={`
      ${orientation === 'horizontal' 
        ? 'flex items-center gap-1' 
        : 'flex flex-col gap-1'
      }
    `}>
      {tabs.map((tab) => {
        const Icon = Icons[tab.icon as keyof typeof Icons];
        const isActive = location.pathname === `/${tab.path}/${restaurantId}`;
        
        return (
          <motion.button
            key={tab.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(`/${tab.path}/${restaurantId}`)}
            className={`
              relative flex items-center gap-3 px-4 py-3 rounded-xl
              transition-all duration-200
              ${isActive 
                ? 'bg-black text-white shadow-lg' 
                : 'text-gray-600 hover:bg-gray-100'
              }
              ${orientation === 'horizontal' ? 'flex-1' : 'w-full'}
            `}
            title={tab.description}
          >
            {showIcons && Icon && <Icon className="w-5 h-5" />}
            
            {showLabels && (
              <span className="font-medium text-sm">{tab.label}</span>
            )}
            
            {/* Professional Badges */}
            {tab.badge?.show && (
              <div className="absolute -top-1 -right-1">
                {badgeVariant === 'dot' && (
                  <div className={`w-2 h-2 rounded-full ${getBadgeStyle(tab.badge.color)}`} />
                )}
                
                {badgeVariant === 'number' && tab.badge.value && (
                  <div className={`
                    min-w-[20px] h-5 px-1.5 rounded-full text-xs font-medium
                    flex items-center justify-center
                    ${isActive 
                      ? 'bg-white text-black' 
                      : `${getBadgeStyle(tab.badge.color)} text-white`
                    }
                  `}>
                    {tab.badge.value}
                  </div>
                )}
                
                {badgeVariant === 'text' && tab.badge.value && (
                  <div className={`
                    px-2 py-0.5 rounded-full text-xs font-medium
                    ${isActive 
                      ? 'bg-white text-black' 
                      : `${getBadgeStyle(tab.badge.color)} text-white`
                    }
                  `}>
                    {tab.badge.value}
                  </div>
                )}
              </div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}