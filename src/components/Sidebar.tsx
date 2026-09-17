import React from 'react';
import {
  LayoutDashboard,
  Search,
  Scale,
  ListTodo,
  FileCheck,
  Info,
  Database,
  PlusCircle,
  ExternalLink,
  ShieldAlert,
  X
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton.js';

export type NavigationTab = 'dashboard' | 'explorer' | 'comparison' | 'queue' | 'reports' | 'about';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  onOpenImport: () => void;
  onCloseMobile?: () => void;
  datasetCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenImport,
  onCloseMobile,
  datasetCount
}) => {
  const navItems = [
    { id: 'dashboard' as NavigationTab, label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'explorer' as NavigationTab, label: 'Article Explorer', icon: Search },
    { id: 'comparison' as NavigationTab, label: 'Fact Comparison', icon: Scale },
    { id: 'queue' as NavigationTab, label: 'Review Queue', icon: ListTodo },
    { id: 'reports' as NavigationTab, label: 'Audit Reports', icon: FileCheck },
    { id: 'about' as NavigationTab, label: 'Methodology & AI', icon: Info },
  ];

  return (
    <aside
      id="app-sidebar"
      className="w-72 sm:w-64 bg-stone-900 text-stone-300 flex flex-col shrink-0 border-r border-stone-800 select-none h-full min-h-screen"
    >
      {/* Brand Header */}
      <div className="p-4 sm:p-5 border-b border-stone-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-900 font-serif font-black text-lg shadow-xs">
            W
          </div>
          <div>
            <h1 className="font-serif font-bold text-base text-stone-100 tracking-tight leading-none">
              WikiFact Lens
            </h1>
            <p className="text-[11px] text-stone-400 font-medium tracking-wide mt-1">
              Evidence Comparison Tool
            </p>
          </div>
        </div>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-2 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Primary Navigation */}
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] font-semibold tracking-wider uppercase text-stone-500">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 sm:py-2.5 rounded-lg text-xs font-medium transition-all min-h-[44px] sm:min-h-0 ${
                isActive
                  ? 'bg-stone-800 text-stone-100 shadow-2xs font-semibold'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-stone-100' : 'text-stone-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* PWA Device Availability Section */}
        <div className="pt-4 px-3 py-1.5 text-[10px] font-semibold tracking-wider uppercase text-stone-500">
          Device Availability
        </div>
        <div className="px-1">
          <PWAInstallButton variant="sidebar" />
        </div>

        {/* Dataset Actions Section */}
        <div className="pt-4 px-3 py-1.5 text-[10px] font-semibold tracking-wider uppercase text-stone-500">
          Dataset Repository
        </div>

        <button
          id="btn-sidebar-ingest"
          onClick={onOpenImport}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium text-stone-300 hover:text-stone-100 hover:bg-stone-800/60 border border-dashed border-stone-700/80 transition-all text-left min-h-[44px] sm:min-h-0"
        >
          <PlusCircle className="w-4 h-4 text-stone-400" />
          <span>Ingest Article Record</span>
        </button>

        <div className="p-3 mt-3 rounded-lg bg-stone-800/60 border border-stone-800 text-xs">
          <div className="flex items-center gap-1.5 text-stone-400 text-[11px] font-mono mb-1">
            <Database className="w-3.5 h-3.5 text-stone-300" />
            <span>Wikimedia Enterprise</span>
          </div>
          <div className="text-xs text-stone-200 font-medium">
            {datasetCount} Articles Indexed
          </div>
          <div className="text-[10px] text-stone-500 mt-1">
            Structured Schema 2024.1
          </div>
        </div>
      </nav>

      {/* Footer / Responsible AI Reminder */}
      <div className="p-4 border-t border-stone-800 text-xs space-y-2.5 bg-stone-950/40">
        <div className="flex items-start gap-2 text-[11px] text-stone-400 leading-snug">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
          <span>
            Evidence review tool. Never determines absolute truth.
          </span>
        </div>
        <div className="pt-2 border-t border-stone-800/60 flex items-center justify-between text-[10px] text-stone-500">
          <span>v1.0 • Research Edition</span>
          <a
            href="https://enterprise.wikimedia.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-stone-400 inline-flex items-center gap-1"
          >
            WM Enterprise <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>
    </aside>
  );
};
