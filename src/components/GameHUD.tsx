import React from 'react';
import {
  Camera,
  Lightbulb,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Megaphone,
  AlertTriangle,
  MapPin,
  Timer,
} from 'lucide-react';
import { CAMERA_LABELS, CITY_CHECKPOINTS, PARKING_MISSIONS } from '../data/gameData';
import { soundEngine } from '../game/audio';
import { GameMode, HudSnapshot } from '../types/game';

interface GameHUDProps {
  gameMode: GameMode;
  missionId: string;
  hud: HudSnapshot;
  soundMuted: boolean;
  onToggleCamera: () => void;
  onToggleHeadlights: () => void;
  onToggleSound: () => void;
  onRestart: () => void;
  onPause: () => void;
  onHornChange: (active: boolean) => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  gameMode,
  missionId,
  hud,
  soundMuted,
  onToggleCamera,
  onToggleHeadlights,
  onToggleSound,
  onRestart,
  onPause,
  onHornChange,
}) => {
  const parkingMission =
    gameMode === 'parking'
      ? PARKING_MISSIONS.find((m) => m.id === missionId) ?? PARKING_MISSIONS[0]
      : null;

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-2.5 sm:p-4">
      {/* TOP BAR */}
      <div className="flex items-start justify-between gap-2">
        {/* Top-Left: Mission / Mode Status */}
        <div className="pointer-events-auto max-w-[240px] rounded-xl border border-slate-700/80 bg-[#090d16]/85 px-3 py-2 shadow-lg sm:max-w-xs">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-sky-400">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {gameMode === 'free' && 'Erkin Haydash'}
              {gameMode === 'parking' && parkingMission?.title}
              {gameMode === 'city' && 'Shaharda Haydash'}
            </span>
          </div>

          {gameMode === 'parking' && (
            <div className="mt-1 flex items-center gap-3 text-xs text-slate-200 tabular-nums">
              <span className="flex items-center gap-1 font-semibold">
                <Timer className="h-3.5 w-3.5 text-amber-400" />
                {formatTime(hud.timeRemainingSec ?? 0)}
              </span>
              <span className="text-slate-400">Masofa: {hud.parkingDistance} m</span>
              <span className="text-rose-400">Urilish: {hud.collisions}</span>
            </div>
          )}

          {gameMode === 'city' && (
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-200 tabular-nums">
              <span className="font-semibold text-emerald-400">
                Nuqta: {hud.checkpointIndex}/{hud.totalCheckpoints}
              </span>
              <span className="font-semibold text-amber-300">Ball: {hud.score}</span>
              {CITY_CHECKPOINTS[hud.checkpointIndex] && (
                <span className="w-full truncate text-[11px] text-slate-400">
                  Keyingi: {CITY_CHECKPOINTS[hud.checkpointIndex].label}
                </span>
              )}
            </div>
          )}

          {gameMode === 'free' && (
            <div className="mt-0.5 text-[11px] text-slate-400">
              Toshkent ko&apos;chalarida erkin sayohat
            </div>
          )}
        </div>

        {/* Top-Center: Dynamic Warning / Parking Hold / Traffic Signal */}
        <div className="flex flex-col items-center gap-1.5">
          {hud.trafficSignalState && gameMode === 'city' && (
            <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-[#090d16]/90 px-3 py-1 text-xs font-bold">
              <span
                className={`h-3 w-3 rounded-full ${
                  hud.trafficSignalState === 'red'
                    ? 'bg-rose-500'
                    : hud.trafficSignalState === 'yellow'
                    ? 'bg-amber-400'
                    : 'bg-emerald-500'
                }`}
              />
              <span>
                {hud.trafficSignalState === 'red'
                  ? "QIZIL CHIROQ — TO'XTANG!"
                  : hud.trafficSignalState === 'yellow'
                  ? 'SARIQ CHIROQ — TAYYORLANING'
                  : 'YASHIL CHIROQ'}
              </span>
            </div>
          )}

          {hud.parkingReverseWarning && (
            <div className="rounded-lg border border-amber-500/70 bg-amber-950/90 px-3 py-1 text-xs font-bold text-amber-200">
              Diqqat: Bu topshiriq uchun R (teskari) uzatmadan foydalaning!
            </div>
          )}

          {hud.parkingHoldProgress > 0.02 && (
            <div className="w-48 rounded-lg border border-emerald-500/70 bg-[#090d16]/90 p-2 text-center">
              <div className="text-[11px] font-bold text-emerald-300">
                Joylashtirilmoqda... Harakatlanmang!
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full bg-emerald-400 transition-all duration-75"
                  style={{ width: `${Math.round(hud.parkingHoldProgress * 100)}%` }}
                />
              </div>
            </div>
          )}

          {hud.warningMessage && (
            <div className="flex items-center gap-1.5 rounded-lg border border-rose-500/80 bg-rose-950/90 px-3 py-1.5 text-xs font-bold text-rose-100">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-400" />
              <span>{hud.warningMessage}</span>
            </div>
          )}
        </div>

        {/* Top-Right: Action Buttons */}
        <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              soundEngine.unlock();
              onHornChange(true);
            }}
            onPointerUp={() => onHornChange(false)}
            onPointerLeave={() => onHornChange(false)}
            onPointerCancel={() => onHornChange(false)}
            title="Signal"
            className="flex h-10 items-center gap-1 rounded-xl border border-slate-600/80 bg-[#090d16]/85 px-2.5 text-xs font-bold text-amber-300 active:scale-95"
          >
            <Megaphone className="h-4 w-4" />
            <span className="hidden sm:inline">Signal</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onToggleHeadlights();
            }}
            title="Chiroqlar"
            className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-colors active:scale-95 ${
              hud.headlights
                ? 'border-amber-400 bg-amber-500/25 text-amber-300'
                : 'border-slate-600/80 bg-[#090d16]/85 text-slate-300'
            }`}
          >
            <Lightbulb className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onToggleCamera();
            }}
            title="Kamera"
            className="flex h-10 items-center gap-1.5 rounded-xl border border-slate-600/80 bg-[#090d16]/85 px-2.5 text-xs font-bold text-sky-300 active:scale-95"
          >
            <Camera className="h-4 w-4" />
            <span className="hidden md:inline">{CAMERA_LABELS[hud.cameraMode]}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onToggleSound();
            }}
            title="Ovoz"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-600/80 bg-[#090d16]/85 text-slate-200 active:scale-95"
          >
            {soundMuted ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onRestart();
            }}
            title="Qayta boshlash"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-600/80 bg-[#090d16]/85 text-slate-200 active:scale-95"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onPause();
            }}
            title="Pauza"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-500/60 bg-sky-950/85 text-sky-200 active:scale-95"
          >
            <Pause className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* BOTTOM CENTER: COMPACT DIGITAL SPEEDOMETER & GEAR CLUSTER */}
      <div className="mb-1 flex justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-700/80 bg-[#090d16]/85 px-4 py-2 shadow-xl">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-lg text-base font-black ${
              hud.gear === 'R'
                ? 'bg-amber-500 text-slate-950'
                : hud.gear === 'D'
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-sky-500 text-slate-950'
            }`}
          >
            {hud.gear}
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black tracking-tight text-white tabular-nums sm:text-3xl">
              {hud.speedKmh}
            </span>
            <span className="text-[11px] font-bold uppercase text-slate-400">km/soat</span>
          </div>
          {/* RPM Bar */}
          <div className="hidden h-2 w-20 overflow-hidden rounded-full bg-slate-800 sm:block">
            <div
              className="h-full bg-gradient-to-r from-sky-400 via-emerald-400 to-amber-400 transition-all duration-75"
              style={{ width: `${Math.round(hud.rpmRatio * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
