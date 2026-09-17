import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall.js';
import { Download, Smartphone, Monitor, Share, PlusSquare, X, CheckCircle2 } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'header' | 'sidebar' | 'compact';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // If already running in standalone mode on the user's device
  if (isInstalled) {
    if (variant === 'sidebar') {
      return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-stone-800/80 text-[11px] text-emerald-400 border border-emerald-900/40">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>Installed on this device</span>
        </div>
      );
    }
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const ok = await install();
      if (ok) {
        setInstallSuccess(true);
      }
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      {/* Install Button Trigger */}
      {variant === 'sidebar' ? (
        <button
          id="btn-pwa-install-sidebar"
          onClick={handleInstallClick}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 transition-all text-left"
          title="Install WikiFact Lens for offline access on Desktop, Laptop, or Phone"
        >
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Install on Device</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 font-mono text-amber-200">
            PWA
          </span>
        </button>
      ) : variant === 'compact' ? (
        <button
          id="btn-pwa-install-compact"
          onClick={handleInstallClick}
          className="p-2 rounded-lg bg-stone-800 text-amber-400 hover:bg-stone-700 transition-colors"
          title="Install App on Device"
          aria-label="Install App"
        >
          <Download className="w-4 h-4" />
        </button>
      ) : (
        <button
          id="btn-pwa-install-header"
          onClick={handleInstallClick}
          className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 transition-colors shadow-2xs"
          title="Install WikiFact Lens on your Laptop, Desktop, or Phone"
        >
          <Download className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="hidden sm:inline">Install App</span>
          <span className="sm:hidden">Install</span>
        </button>
      )}

      {/* Guide Dialog for iOS Safari & All Devices */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-stone-200 text-stone-900 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-stone-900 text-stone-100 flex items-center justify-center font-serif font-black text-lg">
                  W
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-stone-900">
                    Install WikiFact Lens
                  </h3>
                  <p className="text-xs text-stone-500">
                    Available for Laptop, Desktop, Phone & Tablet
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 pt-2 text-xs">
              {/* iPhone / iPad instructions */}
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-stone-800">
                  <Smartphone className="w-4 h-4 text-indigo-600" />
                  <span>On iPhone & iPad (Safari)</span>
                </div>
                <ol className="space-y-1.5 text-stone-600 pl-6 list-decimal leading-relaxed">
                  <li>
                    Tap the <strong className="text-stone-900 inline-flex items-center gap-1"><Share className="w-3 h-3 text-blue-600 inline" /> Share</strong> icon in the bottom Safari bar.
                  </li>
                  <li>
                    Scroll down in the share sheet and select <strong className="text-stone-900 inline-flex items-center gap-1"><PlusSquare className="w-3 h-3 text-stone-800 inline" /> Add to Home Screen</strong>.
                  </li>
                  <li>Tap <strong>Add</strong> in the top right. Launch directly from your home screen!</li>
                </ol>
              </div>

              {/* Android Phone / Tablet instructions */}
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-stone-800">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>On Android (Chrome / Samsung Internet)</span>
                </div>
                <p className="text-stone-600 leading-relaxed">
                  Tap the three-dots menu (<strong>⋮</strong>) in the top-right corner of Chrome, then select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                </p>
              </div>

              {/* Laptop & Desktop instructions */}
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-stone-800">
                  <Monitor className="w-4 h-4 text-amber-600" />
                  <span>On Laptop & Desktop (Chrome / Edge / Safari)</span>
                </div>
                <p className="text-stone-600 leading-relaxed">
                  Look for the <strong>Install</strong> icon in the right side of the browser's address bar (or menu &rarr; <em>Apps &rarr; Install this site as an app</em>). This launches WikiFact Lens in its own dedicated, distraction-free desktop window.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowGuide(false)}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-stone-900 text-stone-100 hover:bg-stone-800 text-xs font-semibold transition-colors"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
