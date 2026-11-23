import React from 'react';
import {
  Car,
  Compass,
  Flag,
  Play,
  Settings,
  Sliders,
  Trophy,
  Volume2,
  VolumeX,
  Wrench,
} from 'lucide-react';
import { VEHICLE_SPECS } from '../data/gameData';
import { soundEngine } from '../game/audio';
import { GraphicsQuality, VehicleId } from '../types/game';
import { PWAInstallButton } from './PWAInstallButton';

interface MainMenuProps {
  selectedVehicle: VehicleId;
  graphics: GraphicsQuality;
  soundMuted: boolean;
  raceWins: number;
  bestCircuitLapSec: number | null;
  onStartRace: () => void;
  onOpenCars: () => void;
  onOpenGarage: () => void;
  onOpenTuning: () => void;
  onOpenModes: () => void;
  onOpenSettings: () => void;
  onCycleGraphics: () => void;
  onToggleSound: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  selectedVehicle,
  graphics,
  soundMuted,
  raceWins,
  bestCircuitLapSec,
  onStartRace,
  onOpenCars,
  onOpenGarage,
  onOpenTuning,
  onOpenModes,
  onOpenSettings,
  onCycleGraphics,
  onToggleSound,
}) => {
  const car = VEHICLE_SPECS.find((v) => v.id === selectedVehicle) ?? VEHICLE_SPECS[0];
  const gfxLabel = graphics === 'low' ? 'PAST' : graphics === 'medium' ? "O'RTA" : 'YUQORI';

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-3.5 sm:p-6">
      {/* TOP BAR: Bespoke Motorsport SVG Lockup + Records & Audio */}
      <div className="flex items-start justify-between gap-3">
        <div className="pointer-events-auto flex flex-col">
          <svg
            viewBox="0 0 430 70"
            className="h-12 w-auto sm:h-14 drop-shadow-[0_4px_16px_rgba(0,0,0,0.75)]"
            aria-label="UZB STREET RACING 3D"
          >
            <defs>
              <linearGradient id="uzbStripe" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#0ea5e9" />
                <stop offset="50%" stopColor="#f8fafc" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
              <linearGradient id="raceRed" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#f97316" />
              </linearGradient>
            </defs>
            <rect x="0" y="6" width="6" height="56" rx="3" fill="url(#uzbStripe)" />
            <text
              x="16"
              y="34"
              fill="#ffffff"
              fontSize="27"
              fontWeight="900"
              letterSpacing="1.4"
              fontFamily="system-ui, sans-serif"
            >
              UZB STREET RACING
            </text>
            <rect x="330" y="10" width="48" height="28" rx="6" fill="url(#raceRed)" />
            <text
              x="354"
              y="30"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="19"
              fontWeight="900"
              fontFamily="system-ui, sans-serif"
            >
              3D
            </text>
            <text
              x="16"
              y="56"
              fill="#94a3b8"
              fontSize="11.5"
              fontWeight="800"
              letterSpacing="2.4"
              fontFamily="system-ui, sans-serif"
            >
              MOBIL AVTOSPORT SIMULYATORI
            </text>
          </svg>

          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-200">
            <span className="flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-[#090d16]/85 px-2.5 py-1">
              <Trophy className="h-3.5 w-3.5 text-amber-400" />
              <span className="tabular-nums">{raceWins} G&apos;alaba</span>
            </span>
            {bestCircuitLapSec !== null && (
              <span className="rounded-lg border border-slate-700/80 bg-[#090d16]/85 px-2.5 py-1 text-emerald-300 tabular-nums">
                Rekord aylana: {bestCircuitLapSec.toFixed(2)}s
              </span>
            )}
          </div>
        </div>

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
            aria-label="Ovoz"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-[#090d16]/85 text-slate-100 hover:bg-slate-800 active:scale-95"
          >
            {soundMuted ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* BOTTOM NAVIGATION DOCK (All 6 requested menu actions) */}
      <div className="flex flex-col items-center gap-2">
        <div className="rounded-lg border border-slate-700/70 bg-[#090d16]/80 px-3 py-1 text-[11px] font-bold text-slate-200">
          <span className="text-rose-400">{car.name}</span> · {car.subtitle} · Aylantirish uchun suring
        </div>

        <div className="pointer-events-auto grid w-full max-w-4xl grid-cols-2 gap-2 rounded-2xl border border-slate-700/85 bg-[#090d16]/92 p-2.5 shadow-2xl sm:grid-cols-6">
          <button
            type="button"
            onClick={() => {
              soundEngine.unlock();
              soundEngine.playClick();
              onStartRace();
            }}
            className="col-span-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-950 shadow-lg transition hover:brightness-110 active:scale-95 sm:col-span-1"
          >
            <Play className="h-4 w-4 fill-slate-950" />
            <span>Poygani boshlash</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.unlock();
              soundEngine.playClick();
              onOpenCars();
            }}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-sky-500/45 bg-slate-800/90 px-3 py-2.5 text-xs font-extrabold text-sky-200 hover:bg-slate-700 active:scale-95"
          >
            <Car className="h-4 w-4 text-sky-400" />
            <span>Mashinalar</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.unlock();
              soundEngine.playClick();
              onOpenGarage();
            }}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/45 bg-slate-800/90 px-3 py-2.5 text-xs font-extrabold text-amber-200 hover:bg-slate-700 active:scale-95"
          >
            <Wrench className="h-4 w-4 text-amber-400" />
            <span>Garaj</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.unlock();
              soundEngine.playClick();
              onOpenTuning();
            }}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/45 bg-slate-800/90 px-3 py-2.5 text-xs font-extrabold text-emerald-200 hover:bg-slate-700 active:scale-95"
          >
            <Sliders className="h-4 w-4 text-emerald-400" />
            <span>Mashina sozlash</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.unlock();
              soundEngine.playClick();
              onOpenModes();
            }}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-purple-500/45 bg-slate-800/90 px-3 py-2.5 text-xs font-extrabold text-purple-200 hover:bg-slate-700 active:scale-95"
          >
            <Flag className="h-4 w-4 text-purple-400" />
            <span>O&apos;yin rejimlari</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.unlock();
              soundEngine.playClick();
              onOpenSettings();
            }}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-600 bg-slate-800/90 px-3 py-2.5 text-xs font-extrabold text-slate-200 hover:bg-slate-700 active:scale-95"
          >
            <Settings className="h-4 w-4 text-slate-300" />
            <span>Sozlamalar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
