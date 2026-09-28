import React from 'react';
import { CalendarDays, UtensilsCrossed } from 'lucide-react';

export type NavigationTab = 'plan' | 'menu';

interface BottomNavProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav 
      aria-label="Thanh điều hướng chính"
      className="w-full bg-white/95 backdrop-blur border-t border-slate-100 px-6 py-2.5 flex items-center justify-around z-20 sticky bottom-0"
    >
      <button
        onClick={() => onTabChange('plan')}
        data-testid="nav-plan-button"
        className={`flex flex-col items-center gap-0.5 text-xs transition ${
          activeTab === 'plan'
            ? 'text-[#5B7C99] font-bold'
            : 'text-slate-400 hover:text-[#5B7C99]'
        }`}
      >
        <CalendarDays className="w-5 h-5" strokeWidth={activeTab === 'plan' ? 2.4 : 1.8} />
        <span>Kế hoạch</span>
      </button>

      <button
        onClick={() => onTabChange('menu')}
        data-testid="nav-menu-button"
        className={`flex flex-col items-center gap-0.5 text-xs transition ${
          activeTab === 'menu'
            ? 'text-[#5B7C99] font-bold'
            : 'text-slate-400 hover:text-[#5B7C99]'
        }`}
      >
        <UtensilsCrossed className="w-5 h-5" strokeWidth={activeTab === 'menu' ? 2.4 : 1.8} />
        <span>Menu</span>
      </button>
    </nav>
  );
};
