import React from 'react';
import {
  Car,
  Compass,
  Play,
  Settings,
  Star,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { VEHICLE_SPECS } from '../data/gameData';
import { soundEngine } from '../game/audio';
import { GraphicsQuality, VehicleId } from '../types/game';
import { PWAInstallButton } from './PWAInstallButton';

interface MainMenuProps {
  selectedVehicle: VehicleId;
  graphics: GraphicsQuality;
  soundMuted: boolean;
  totalStars: number;
  cityBestScore: number;
  onPlayQuick: () => void;
  onOpenGarage: () => void;
  onOpenModes: () => void;
  onOpenSettings: () => void;
  onCycleGraphics: () => void;
  onToggleSound: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  selectedVehicle,
  graphics,
  soundMuted,
  totalStars,
  cityBestScore,
  onPlayQuick,
  onOpenGarage,
  onOpenModes,
  onOpenSettings,
  onCycleGraphics,
  onToggleSound,
}) => {
  const car = VEHICLE_SPECS.find((v) => v.id === selectedVehicle) ?? VEHICLE_SPECS[0];
  const gfxLabel = graphics === 'low' ? 'PAST' : graphics === 'medium' ? "O'RTA" : 'YUQORI';

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-4 sm:p-6">
      {/* TOP BAR: Bespoke SVG Brand Lockup + Quick Status/Audio */}
      <div className="flex items-start justify-between gap-3">
        <div className="pointer-events-auto flex flex-col">
          {/* Bespoke Inline SVG Title Lockup */}
          <svg
            viewBox="0 0 360 66"
            className="h-12 w-auto sm:h-14 drop-shadow-[0_4px_14px_rgba(0,0,0,0.65)]"
            aria-label="UZB PARKING 3D"
          >
            <defs>
              <linearGradient id="uzbStripe" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#0ea5e9" />
                <stop offset="50%" stopColor="#f8fafc" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
              <linearGradient id="goldAccent" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
            </defs>
            <rect x="0" y="6" width="6" height="52" rx="3" fill="url(#uzbStripe)" />
            <text
              x="16"
              y="34"
              fill="#ffffff"
              fontSize="28"
              fontWeight="900"
              letterSpacing="1.5"
              fontFamily="system-ui, sans-serif"
            >
              UZB PARKING
            </text>
            <rect x="230" y="10" width="46" height="28" rx="6" fill="url(#goldAccent)" />
            <text
              x="253"
              y="30"
              textAnchor="middle"
              fill="#090d16"
              fontSize="19"
              fontWeight="900"
              fontFamily="system-ui, sans-serif"
            >
              3D
            </text>
            <text
              x="16"
              y="55"
              fill="#94a3b8"
              fontSize="12"
              fontWeight="700"
              letterSpacing="2.2"
              fontFamily="system-ui, sans-serif"
            >
              MOBIL AVTOMOBIL SIMULYATORI
            </text>
          </svg>

          <div className="mt-1.5 flex items-center gap-3 text-xs font-bold text-slate-200">
            <span className="flex items-center gap-1 rounded-lg bg-[#090d16]/80 px-2.5 py-1 border border-slate-700/80">
              <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
              <span className="tabular-nums">{totalStars} Yulduz</span>
            </span>
            {cityBestScore > 0 && (
              <span className="rounded-lg bg-[#090d16]/80 px-2.5 py-1 border border-slate-700/80 tabular-nums text-emerald-300">
                Rekord: {cityBestScore}
              </span>
            )}
          </div>
        </div>

        {/* Top-Right Quick Controls */}
        <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-2">
          <PWAInstallButton />
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onCycleGraphics();
            }}
            className="rounded-xl border border-slate-700 bg-[#090d16]/85 px-3 py-2 text-xs font-bold text-sky-300 transition hover:bg-slate-800 active:scale-95"
          >
            Grafika: {gfxLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onToggleSound();
            }}
            aria-label="Ovozni o'chirish/yoqish"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-[#090d16]/85 text-slate-100 transition hover:bg-slate-800 active:scale-95"
          >
            {soundMuted ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* BOTTOM DOCK: Active Car Summary + Primary Navigation */}
      <div className="flex flex-col items-center gap-2.5">
        <div className="text-[11px] font-semibold tracking-wide text-slate-200 bg-[#090d16]/75 px-3 py-1 rounded-lg border border-slate-700/60">
          Tanlangan: <span className="text-sky-300 font-bold">{car.name}</span> ({car.subtitle}) · Aylantirish uchun barmoq bilan suring
        </div>

        <div className="pointer-events-auto flex w-full max-w-3xl flex-wrap items-center justify-center gap-2.5 rounded-2xl border border-slate-700/80 bg-[#090d16]/90 p-2.5 shadow-2xl sm:flex-nowrap sm:gap-3 sm:p-3">
          <button
            type="button"
            onClick={() => {
              soundEngine.unlock();
              soundEngine.playClick();
              onPlayQuick();
            }}
            className="flex flex-1 min-w-[140px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-sky-500 px-5 py-3 text-sm font-black tracking-wide text-slate-950 shadow-lg transition hover:brightness-110 active:scale-95"
          >
            <Play className="h-5 w-5 fill-slate-950" />
            <span>O&apos;YNASH</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.unlock();
              soundEngine.playClick();
              onOpenModes();
            }}
            className="flex flex-1 min-w-[125px] items-center justify-center gap-2 rounded-xl border border-sky-500/50 bg-slate-800/90 px-4 py-3 text-xs font-extrabold text-sky-200 transition hover:bg-slate-700 active:scale-95 sm:text-sm"
          >
            <Compass className="h-4 w-4 text-sky-400" />
            <span>REJIMLAR</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.unlock();
              soundEngine.playClick();
              onOpenGarage();
            }}
            className="flex flex-1 min-w-[115px] items-center justify-center gap-2 rounded-xl border border-amber-500/50 bg-slate-800/90 px-4 py-3 text-xs font-extrabold text-amber-200 transition hover:bg-slate-700 active:scale-95 sm:text-sm"
          >
            <Car className="h-4 w-4 text-amber-400" />
            <span>GARAJ</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.unlock();
              soundEngine.playClick();
              onOpenSettings();
            }}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-800/90 px-4 py-3 text-xs font-extrabold text-slate-200 transition hover:bg-slate-700 active:scale-95 sm:text-sm"
          >
            <Settings className="h-4 w-4 text-slate-300" />
            <span className="hidden sm:inline">SOZLAMALAR</span>
          </button>
        </div>
      </div>
    </div>
  );
};
