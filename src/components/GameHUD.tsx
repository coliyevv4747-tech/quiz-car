import React from 'react';
import {
  AlertTriangle,
  Camera,
  Flag,
  Flame,
  Lightbulb,
  Megaphone,
  Pause,
  RotateCcw,
  Timer,
  Trophy,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { CAMERA_LABELS, PARKING_MISSIONS, STREET_RACE_WAYPOINTS } from '../data/gameData';
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

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const tenths = Math.floor((sec % 1) * 10);
    return `${m}:${s < 10 ? '0' : ''}${s}.${tenths}`;
  };

  // Tachometer SVG arc calculations
  const rpmPct = Math.max(0, Math.min(1, hud.rpmRatio));
  const arcLen = 157;
  const dashOffset = arcLen * (1 - rpmPct);

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-2.5 sm:p-4">
      {/* TOP BAR */}
      <div className="flex items-start justify-between gap-2">
        {/* Top-Left: Racing Telemetry / Mission Card */}
        <div className="pointer-events-auto min-w-[180px] max-w-[260px] rounded-xl border border-slate-700/85 bg-[#090d16]/88 px-3 py-2 shadow-xl">
          {(gameMode === 'circuit' || gameMode === 'street') && (
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <Trophy className="h-4 w-4 text-amber-400" />
                  <span className="text-base font-black text-white tabular-nums">
                    {hud.position}
                    <span className="text-xs font-bold text-slate-400">/{hud.totalRacers}</span>
                  </span>
                </div>
                {gameMode === 'circuit' ? (
                  <span className="rounded-md bg-sky-500/20 px-2 py-0.5 text-xs font-black text-sky-300 tabular-nums">
                    AYLANA {hud.lap}/{hud.totalLaps}
                  </span>
                ) : (
                  <span className="rounded-md bg-orange-500/20 px-2 py-0.5 text-xs font-black text-orange-300 tabular-nums">
                    NUQTA {hud.checkpointIndex}/{STREET_RACE_WAYPOINTS.length}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-300 tabular-nums">
                <span className="flex items-center gap-1 font-bold">
                  <Timer className="h-3.5 w-3.5 text-emerald-400" />
                  {formatTimer(gameMode === 'circuit' ? hud.currentLapTimeSec : hud.elapsedSec)}
                </span>
                {hud.bestLapTimeSec !== null && (
                  <span className="text-[11px] font-bold text-amber-300">
                    Rekord: {hud.bestLapTimeSec.toFixed(1)}s
                  </span>
                )}
              </div>

              {/* Race Progress Bar */}
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-all duration-100"
                  style={{ width: `${Math.round(hud.raceProgress * 100)}%` }}
                />
              </div>
            </div>
          )}

          {gameMode === 'timeattack' && (
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1 text-xs font-black uppercase text-sky-400">
                  <Flag className="h-3.5 w-3.5" /> Vaqtga Qarshi
                </span>
                <span className="text-xs font-black text-slate-200 tabular-nums">
                  {hud.lap}/{hud.totalLaps}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs tabular-nums">
                <span className="font-bold text-white">{formatTimer(hud.currentLapTimeSec)}</span>
                {hud.bestLapTimeSec !== null && (
                  <span className="font-bold text-amber-300">
                    Eng yaxshi: {hud.bestLapTimeSec.toFixed(2)}s
                  </span>
                )}
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full bg-sky-400 transition-all duration-100"
                  style={{ width: `${Math.round(hud.raceProgress * 100)}%` }}
                />
              </div>
            </div>
          )}

          {gameMode === 'parking' && (
            <div>
              <div className="text-[11px] font-black uppercase tracking-wider text-sky-400">
                {parkingMission?.title}
              </div>
              <div className="mt-1 flex items-center gap-3 text-xs text-slate-200 tabular-nums">
                <span className="font-bold text-amber-300">{hud.timeRemainingSec ?? 0}s</span>
                <span className="text-slate-400">{hud.parkingDistance} m</span>
                <span className="text-rose-400">Urilish: {hud.collisions}</span>
              </div>
            </div>
          )}

          {gameMode === 'free' && (
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-emerald-400">
                Erkin Sayohat
              </div>
              <div className="mt-0.5 text-[11px] text-slate-400">Toshkent ko&apos;chalari</div>
            </div>
          )}
        </div>

        {/* Top-Center: Drift Badge & Warnings */}
        <div className="flex flex-col items-center gap-1.5">
          {hud.isDrifting && (
            <div className="flex items-center gap-1.5 rounded-lg border border-orange-400/80 bg-orange-950/90 px-3 py-1 text-xs font-black tracking-widest text-orange-300 shadow-lg">
              <Flame className="h-4 w-4 text-orange-400" />
              <span>DRIFT!</span>
            </div>
          )}

          {hud.parkingReverseWarning && (
            <div className="rounded-lg border border-amber-500/70 bg-amber-950/90 px-3 py-1 text-xs font-bold text-amber-200">
              R (teskari) uzatmadan foydalaning!
            </div>
          )}

          {hud.parkingHoldProgress > 0.02 && (
            <div className="w-48 rounded-lg border border-emerald-500/70 bg-[#090d16]/90 p-2 text-center">
              <div className="text-[11px] font-bold text-emerald-300">Joylashtirilmoqda...</div>
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
              <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
              <span>{hud.warningMessage}</span>
            </div>
          )}
        </div>

        {/* Top-Right Action Buttons */}
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
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-600/80 bg-[#090d16]/85 text-amber-300 active:scale-95"
          >
            <Megaphone className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onToggleHeadlights();
            }}
            title="Chiroqlar"
            className={`flex h-10 w-10 items-center justify-center rounded-xl border active:scale-95 ${
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

      {/* CENTER RACE COUNTDOWN */}
      {hud.countdownText && (
        <div className="flex items-center justify-center">
          <div
            className={`rounded-2xl border px-8 py-4 text-5xl font-black tracking-widest shadow-2xl sm:text-6xl ${
              hud.countdownText === 'START!'
                ? 'border-emerald-400 bg-emerald-500/90 text-slate-950'
                : 'border-rose-500/80 bg-[#090d16]/90 text-amber-400'
            }`}
          >
            {hud.countdownText}
          </div>
        </div>
      )}

      {/* BOTTOM CENTER: MOTORSPORT TACHOMETER + DIGITAL SPEEDOMETER + GEAR */}
      <div className="mb-1 flex justify-center">
        <div className="relative flex items-center gap-3 rounded-2xl border border-slate-700/85 bg-[#090d16]/90 px-4 py-2 shadow-2xl">
          {/* SVG Arc Tachometer */}
          <div className="relative flex h-12 w-20 items-end justify-center">
            <svg viewBox="0 0 120 70" className="h-full w-full overflow-visible">
              <path
                d="M 10 60 A 50 50 0 0 1 110 60"
                fill="none"
                stroke="#1e293b"
                strokeWidth="10"
                strokeLinecap="round"
              />
              <path
                d="M 10 60 A 50 50 0 0 1 110 60"
                fill="none"
                stroke={rpmPct > 0.85 ? '#ef4444' : rpmPct > 0.6 ? '#f59e0b' : '#38bdf8'}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={arcLen}
                strokeDashoffset={dashOffset}
              />
            </svg>
            <span className="absolute bottom-0 text-[10px] font-black text-slate-400 tabular-nums">
              {Math.round(1 + rpmPct * 7)}.{Math.round((rpmPct * 9) % 10)}K RPM
            </span>
          </div>

          <div className="h-8 w-px bg-slate-800" />

          {/* Digital Speed */}
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black tracking-tight text-white tabular-nums sm:text-4xl">
              {hud.speedKmh}
            </span>
            <span className="text-[10px] font-extrabold uppercase text-slate-400">km/s</span>
          </div>

          {/* Active Gear Badge */}
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-lg text-base font-black ${
              hud.gear === 'R'
                ? 'bg-amber-500 text-slate-950'
                : hud.gear === 'N'
                ? 'bg-sky-500 text-slate-950'
                : 'bg-emerald-500 text-slate-950'
            }`}
          >
            {hud.gear}
          </div>
        </div>
      </div>
    </div>
  );
};
