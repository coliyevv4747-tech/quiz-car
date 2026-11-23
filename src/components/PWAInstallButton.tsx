import React, { useState } from 'react';
import { Download, Smartphone, WifiOff } from 'lucide-react';
import { soundEngine } from '../game/audio';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => {
          soundEngine.playClick();
          install();
        }}
        className="flex items-center gap-2 rounded-xl border border-emerald-400/60 bg-emerald-600/85 px-3.5 py-2 text-xs font-bold text-white shadow-lg transition hover:bg-emerald-500 active:scale-95"
      >
        <Download className="h-4 w-4" />
        <span>Ilovani O&apos;rnatish (Android)</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            setShowIOSGuide(true);
          }}
          className="flex items-center gap-2 rounded-xl border border-sky-400/50 bg-[#090d16]/85 px-3.5 py-2 text-xs font-bold text-sky-200 transition hover:bg-slate-800"
        >
          <Smartphone className="h-4 w-4" />
          <span>Ekranga Qo&apos;shish (iOS)</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
            <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-[#0f172a] p-5 shadow-2xl">
              <h3 className="text-base font-extrabold text-white">iPhone / iPad ga o&apos;rnatish</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">
                1. Safari pastki panelidan <strong>Ulashish (Share)</strong> tugmasini bosing.
                <br />
                2. Pastga tushib <strong>&ldquo;Add to Home Screen&rdquo;</strong> bandini tanlang.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-xl bg-sky-500 py-2.5 text-xs font-extrabold text-slate-950"
              >
                Tushunarli
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div className="fixed top-3 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-amber-400/70 bg-amber-950/90 px-3 py-1.5 text-xs font-bold text-amber-100 shadow-lg">
      <WifiOff className="h-3.5 w-3.5 text-amber-400" />
      <span>Oflayn rejim — Saqlangan kesh ishlamoqda</span>
    </div>
  );
};
