import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus.js';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      id="pwa-offline-indicator"
      className="fixed bottom-20 lg:bottom-4 left-4 right-4 lg:right-auto z-50 flex items-center justify-between lg:justify-start gap-2.5 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-medium text-white shadow-xl animate-fade-in"
    >
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4 animate-pulse shrink-0" />
        <span>Working Offline — Cached Wikipedia evidence is active</span>
      </div>
      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-700/80 font-mono">
        OFFLINE
      </span>
    </div>
  );
};
