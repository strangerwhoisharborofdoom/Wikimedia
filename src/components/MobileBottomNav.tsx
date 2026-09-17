import React from 'react';
import { NavigationTab } from './Sidebar.js';
import {
  LayoutDashboard,
  Search,
  Scale,
  ListTodo,
  MoreHorizontal
} from 'lucide-react';

interface MobileBottomNavProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  onOpenMenu: () => void;
  reviewCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenMenu,
  reviewCount = 0
}) => {
  const tabs = [
    { id: 'dashboard' as NavigationTab, label: 'Overview', icon: LayoutDashboard },
    { id: 'explorer' as NavigationTab, label: 'Articles', icon: Search },
    { id: 'comparison' as NavigationTab, label: 'Compare', icon: Scale },
    { id: 'queue' as NavigationTab, label: 'Review', icon: ListTodo, badge: reviewCount },
  ];

  return (
    <nav
      id="mobile-bottom-navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-stone-900 border-t border-stone-800 px-2 py-1.5 flex items-center justify-around select-none safe-area-inset-bottom shadow-2xl"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-lg transition-colors relative min-h-[46px] ${
              isActive
                ? 'text-amber-400 font-semibold'
                : 'text-stone-400 hover:text-stone-200 active:bg-stone-800'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
              {tab.badge && tab.badge > 0 ? (
                <span className="absolute -top-1 -right-2 px-1 py-0.2 rounded-full bg-amber-500 text-stone-900 font-bold text-[9px] leading-none min-w-[14px] text-center">
                  {tab.badge}
                </span>
              ) : null}
            </div>
            <span className="text-[10px] mt-1 tracking-tight truncate max-w-[64px]">
              {tab.label}
            </span>
          </button>
        );
      })}

      {/* 'More' Button to trigger menu drawer */}
      <button
        onClick={onOpenMenu}
        className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-lg text-stone-400 hover:text-stone-200 active:bg-stone-800 transition-colors min-h-[46px] ${
          currentTab === 'reports' || currentTab === 'about' ? 'text-amber-400 font-semibold' : ''
        }`}
      >
        <MoreHorizontal className="w-5 h-5" />
        <span className="text-[10px] mt-1 tracking-tight">More</span>
      </button>
    </nav>
  );
};
