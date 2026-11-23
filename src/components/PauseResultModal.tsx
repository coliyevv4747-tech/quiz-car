import React from 'react';
import { ArrowRight, Car, Home, Play, RotateCcw, Sliders, Star, Trophy } from 'lucide-react';
import { soundEngine } from '../game/audio';
import { MissionResult } from '../types/game';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onGarage: () => void;
  onTuning: () => void;
  onMainMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onGarage,
  onTuning,
  onMainMenu,
}) => {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#090d16]/85 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-[#0d1422] p-5 shadow-2xl">
        <h2 className="text-center text-lg font-black uppercase tracking-wider text-white">
          O&apos;YIN PAUZADA
        </h2>
        <div className="mt-4 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onResume();
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-black text-slate-950 hover:bg-emerald-400 active:scale-95"
          >
            <Play className="h-4 w-4 fill-slate-950" />
            <span>DAVOM ETISH</span>
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onRestart();
            }}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-800 py-2.5 text-xs font-bold text-white hover:bg-slate-700"
          >
            <RotateCcw className="h-4 w-4" />
            <span>QAYTA BOSHLASH</span>
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onGarage();
            }}
            className="flex items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-slate-800 py-2.5 text-xs font-bold text-amber-200 hover:bg-slate-700"
          >
            <Car className="h-4 w-4" />
            <span>GARAJ</span>
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onTuning();
            }}
            className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-slate-800 py-2.5 text-xs font-bold text-emerald-200 hover:bg-slate-700"
          >
            <Sliders className="h-4 w-4" />
            <span>MASHINA SOZLASH</span>
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onMainMenu();
            }}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-800"
          >
            <Home className="h-4 w-4" />
            <span>BOSH MENYU</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface ResultModalProps {
  result: MissionResult;
  hasNextMission: boolean;
  onRetry: () => void;
  onNextMission: () => void;
  onMainMenu: () => void;
}

export const ResultModal: React.FC<ResultModalProps> = ({
  result,
  hasNextMission,
  onRetry,
  onNextMission,
  onMainMenu,
}) => {
  const isRace = result.mode === 'circuit' || result.mode === 'street';

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#090d16]/88 p-3 sm:p-4">
      <div className="uzb-scroll max-h-full w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-700 bg-[#0d1422] p-5 text-center shadow-2xl">
        <div
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-black uppercase tracking-wider ${
            result.success
              ? 'bg-emerald-500/20 text-emerald-300'
              : 'bg-rose-500/20 text-rose-300'
          }`}
        >
          {isRace && <Trophy className="h-3.5 w-3.5 text-amber-400" />}
          <span>
            {result.position != null && result.totalRacers != null
              ? `${result.position}-O'RIN (${result.position}/${result.totalRacers})`
              : result.success
              ? 'MUVAFFAQIYATLI YAKUNLANDI!'
              : 'TOPSHIRIQ BAJARILMADI'}
          </span>
        </div>

        <h2 className="mt-2 text-xl font-black text-white">{result.missionTitle}</h2>
        <p className="mt-1 text-xs text-slate-300">{result.reason}</p>

        {/* Stars */}
        <div className="mt-3 flex justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <Star
              key={s}
              className={`h-7 w-7 ${
                s <= result.stars ? 'fill-amber-400 text-amber-400' : 'text-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-xs">
          <div>
            <div className="text-[10px] uppercase text-slate-400">Ball</div>
            <div className="mt-0.5 text-base font-black text-amber-300 tabular-nums">
              {result.score}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-slate-400">
              {result.bestLapSec != null ? 'Eng yaxshi aylana' : 'Umumiy Vaqt'}
            </div>
            <div className="mt-0.5 text-base font-black text-sky-300 tabular-nums">
              {result.bestLapSec != null ? `${result.bestLapSec.toFixed(2)}s` : `${result.timeSec}s`}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-slate-400">Urilishlar</div>
            <div className="mt-0.5 text-base font-black text-rose-300 tabular-nums">
              {result.collisions}
            </div>
          </div>
        </div>

        {/* Standings Leaderboard for Circuit & Street Racing */}
        {result.standings && result.standings.length > 0 && (
          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/75 p-3 text-left">
            <div className="mb-2 text-[11px] font-black uppercase tracking-wider text-slate-400">
              Poyga Natijalari Jadvali
            </div>
            <div className="space-y-1.5">
              {result.standings.map((row) => (
                <div
                  key={`${row.position}-${row.name}`}
                  className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs ${
                    row.isPlayer
                      ? 'border border-amber-400/50 bg-amber-500/15 font-black text-amber-200'
                      : 'bg-slate-950/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-md text-[11px] font-black ${
                        row.position === 1
                          ? 'bg-amber-400 text-slate-950'
                          : row.position === 2
                          ? 'bg-slate-300 text-slate-950'
                          : row.position === 3
                          ? 'bg-orange-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {row.position}
                    </span>
                    <div>
                      <div className="leading-tight">{row.name}</div>
                      <div className="text-[10px] font-medium text-slate-400">{row.vehicleName}</div>
                    </div>
                  </div>
                  <span className="font-bold tabular-nums">
                    {row.finishTimeSec != null ? `${row.finishTimeSec.toFixed(2)}s` : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onRetry();
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-800 py-3 text-xs font-black text-white hover:bg-slate-700"
          >
            <RotateCcw className="h-4 w-4" />
            <span>QAYTA URINISH</span>
          </button>

          {result.success && hasNextMission && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onNextMission();
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-xs font-black text-slate-950 hover:bg-emerald-400"
            >
              <span>KEYINGI</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onMainMenu();
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 py-3 text-xs font-bold text-slate-300 hover:bg-slate-800"
          >
            <Home className="h-4 w-4" />
            <span>BOSH MENYU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
