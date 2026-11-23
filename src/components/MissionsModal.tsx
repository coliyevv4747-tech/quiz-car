import React, { useState } from 'react';
import {
  ArrowLeft,
  Compass,
  Flag,
  Moon,
  ParkingSquare,
  Play,
  Star,
  Sun,
  Timer,
  Trophy,
  Zap,
} from 'lucide-react';
import { PARKING_MISSIONS } from '../data/gameData';
import { soundEngine } from '../game/audio';
import { GameMode, MissionProgress, TimeOfDay } from '../types/game';

interface MissionsModalProps {
  parkingProgress: Record<string, MissionProgress>;
  timeOfDay: TimeOfDay;
  bestCircuitLapSec: number | null;
  bestStreetTimeSec: number | null;
  bestTimeAttackLapSec: number | null;
  onChangeTimeOfDay: (t: TimeOfDay) => void;
  onStartMode: (mode: GameMode, missionId?: string) => void;
  onBack: () => void;
}

export const MissionsModal: React.FC<MissionsModalProps> = ({
  parkingProgress,
  timeOfDay,
  bestCircuitLapSec,
  bestStreetTimeSec,
  bestTimeAttackLapSec,
  onChangeTimeOfDay,
  onStartMode,
  onBack,
}) => {
  const [tab, setTab] = useState<GameMode>('circuit');

  const tabs: Array<{ id: GameMode; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'circuit', label: 'Halqa Poyga', icon: Trophy },
    { id: 'street', label: "Ko'cha Poygasi", icon: Zap },
    { id: 'timeattack', label: 'Vaqtga Qarshi', icon: Timer },
    { id: 'parking', label: 'Parkovka', icon: ParkingSquare },
    { id: 'free', label: 'Erkin', icon: Compass },
  ];

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#090d16]/88 p-2.5 sm:p-6">
      <div className="flex max-h-full w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-[#0d1422] shadow-2xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-800 px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onBack();
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h2 className="text-base font-black uppercase tracking-wide text-white">
                O&apos;YIN REJIMLARI
              </h2>
              <p className="text-xs text-slate-400">
                Poyga musobaqalari, vaqt sinovi yoki parkovka topshiriqlarini tanlang
              </p>
            </div>
          </div>

          <div className="flex flex-wrap rounded-xl border border-slate-700 bg-slate-900 p-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setTab(id);
                }}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition sm:px-3 sm:text-xs ${
                  tab === id
                    ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="uzb-scroll flex-1 overflow-y-auto p-4">
          {tab === 'circuit' && (
            <div className="mx-auto max-w-2xl rounded-2xl border border-slate-700 bg-slate-900/85 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-md bg-rose-500/20 px-2.5 py-1 text-xs font-black text-rose-300">
                  REJIM A · PROFESSIONAL AVTODROM
                </span>
                {bestCircuitLapSec !== null && (
                  <span className="text-xs font-bold text-amber-300 tabular-nums">
                    Eng yaxshi aylana: {bestCircuitLapSec.toFixed(2)}s
                  </span>
                )}
              </div>
              <h3 className="mt-3 text-lg font-black text-white">
                O&apos;zbekiston Xalqaro Halqa Poygasi (3 Aylana)
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">
                FIA standartidagi tezkor burilishlar, qizil-oq bordyurlar, tribunalar va pit-stop
                yo&apos;lagi. 3 ta kuchli AI raqibga qarshi start chizig&apos;idan 3-2-1-START
                hisobi bilan poygaga chiqing!
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-center text-xs">
                <div>
                  <div className="text-[10px] uppercase text-slate-400">Masofa</div>
                  <div className="mt-0.5 font-black text-white">3 Aylana</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-slate-400">Raqiblar</div>
                  <div className="mt-0.5 font-black text-amber-300">3 AI Poygachi</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-slate-400">Trassa</div>
                  <div className="mt-0.5 font-black text-sky-300">GP Avtodrom</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  soundEngine.unlock();
                  soundEngine.playClick();
                  onStartMode('circuit');
                }}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 py-3 text-sm font-black text-slate-950 hover:brightness-110 active:scale-95"
              >
                <Play className="h-4 w-4 fill-slate-950" />
                <span>HALQA POYGANI BOSHLASH</span>
              </button>
            </div>
          )}

          {tab === 'street' && (
            <div className="mx-auto max-w-2xl rounded-2xl border border-slate-700 bg-slate-900/85 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-md bg-orange-500/20 px-2.5 py-1 text-xs font-black text-orange-300">
                  REJIM B · SHAHAR KO&apos;CHA POYGASI
                </span>
                {bestStreetTimeSec !== null && (
                  <span className="text-xs font-bold text-emerald-300 tabular-nums">
                    Eng yaxshi natija: {bestStreetTimeSec}s
                  </span>
                )}
              </div>
              <h3 className="mt-3 text-lg font-black text-white">
                Toshkent Tungi va Kunduzgi Ko&apos;cha Poygasi
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">
                Keng shoh ko&apos;chalar, keskin 90 gradusli chorraha burilishlari va 11 ta nazorat
                nuqtasi. Drift va nitro tezlanish orqali raqiblarni ortda qoldiring.
              </p>

              {/* Day / Night Selector */}
              <div className="mt-4">
                <div className="mb-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  Poyga Vaqti Muhiti
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      onChangeTimeOfDay('day');
                    }}
                    className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-black transition ${
                      timeOfDay === 'day'
                        ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                        : 'border-slate-700 bg-slate-950/60 text-slate-400'
                    }`}
                  >
                    <Sun className="h-4 w-4 text-amber-400" />
                    <span>KUNDUZGI SHAHAR</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      onChangeTimeOfDay('night');
                    }}
                    className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-black transition ${
                      timeOfDay === 'night'
                        ? 'border-sky-400 bg-sky-500/20 text-sky-200'
                        : 'border-slate-700 bg-slate-950/60 text-slate-400'
                    }`}
                  >
                    <Moon className="h-4 w-4 text-sky-400" />
                    <span>TUNGI NEON POYGA</span>
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  soundEngine.unlock();
                  soundEngine.playClick();
                  onStartMode('street');
                }}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 py-3 text-sm font-black text-slate-950 hover:brightness-110 active:scale-95"
              >
                <Play className="h-4 w-4 fill-slate-950" />
                <span>KO&apos;CHA POYGASINI BOSHLASH</span>
              </button>
            </div>
          )}

          {tab === 'timeattack' && (
            <div className="mx-auto max-w-2xl rounded-2xl border border-slate-700 bg-slate-900/85 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-md bg-sky-500/20 px-2.5 py-1 text-xs font-black text-sky-300">
                  REJIM C · VAQTGA QARSHI (TIME ATTACK)
                </span>
                {bestTimeAttackLapSec !== null && (
                  <span className="text-xs font-bold text-amber-300 tabular-nums">
                    Shaxsiy rekord: {bestTimeAttackLapSec.toFixed(2)}s
                  </span>
                )}
              </div>
              <h3 className="mt-3 text-lg font-black text-white">
                Rekord Aylana Uchun Yakkaxon Sinov
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">
                Raqiblarsiz bo&apos;sh avtodromda 2 ta tezkor aylana bosib o&apos;ting. Ideal
                trayektoriya, kech tormozlash va maksimal tezlik bilan shaxsiy rekordni yangilang!
              </p>
              <button
                type="button"
                onClick={() => {
                  soundEngine.unlock();
                  soundEngine.playClick();
                  onStartMode('timeattack');
                }}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 py-3 text-sm font-black text-slate-950 hover:brightness-110 active:scale-95"
              >
                <Flag className="h-4 w-4" />
                <span>VAQTGA QARSHI BOSHLASH</span>
              </button>
            </div>
          )}

          {tab === 'parking' && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {PARKING_MISSIONS.map((m) => {
                const prog = parkingProgress[m.id];
                const stars = prog?.stars ?? 0;
                return (
                  <div
                    key={m.id}
                    className="flex flex-col justify-between rounded-xl border border-slate-700/80 bg-slate-900/75 p-3.5"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="rounded-md bg-sky-500/20 px-2 py-0.5 text-[11px] font-black text-sky-300">
                          {m.number}-TOPSHIRIQ
                        </span>
                        <span
                          className={`text-[11px] font-bold ${
                            m.difficulty === 'Oson'
                              ? 'text-emerald-400'
                              : m.difficulty === "O'rta"
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {m.difficulty}
                        </span>
                      </div>

                      <h3 className="mt-2 text-sm font-extrabold text-white">{m.title}</h3>
                      <div className="text-[11px] font-semibold text-sky-400/90">{m.location}</div>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                        {m.description}
                      </p>
                    </div>

                    <div className="mt-3 border-t border-slate-800 pt-3">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="flex items-center gap-1 tabular-nums">
                          <Timer className="h-3.5 w-3.5 text-amber-400" />
                          {m.timeLimitSec} sek
                        </span>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3].map((s) => (
                            <Star
                              key={s}
                              className={`h-3.5 w-3.5 ${
                                s <= stars ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.unlock();
                          soundEngine.playClick();
                          onStartMode('parking', m.id);
                        }}
                        className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2 text-xs font-black text-slate-950 hover:bg-emerald-400 active:scale-95"
                      >
                        <Play className="h-3.5 w-3.5 fill-slate-950" />
                        <span>BOSHLASH</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'free' && (
            <div className="mx-auto max-w-2xl rounded-2xl border border-slate-700 bg-slate-900/85 p-5">
              <span className="rounded-md bg-emerald-500/20 px-2.5 py-1 text-xs font-black text-emerald-300">
                ERKIN HAYDASH · SHAHAR SAYOHATI
              </span>
              <h3 className="mt-3 text-lg font-black text-white">
                Cheklovlarsiz Drift va Shahar Sayohati
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">
                Vaqt cheklovisiz keng ko&apos;chalar, avtoturargohlar va maydonlarni o&apos;rganing.
                Sport avtomobilingizning 6 pog&apos;onali uzatmalar qutisi, drift fizikasi va
                faralarini kunduzgi yoki tungi muhitda sinab ko&apos;ring.
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    onChangeTimeOfDay('day');
                  }}
                  className={`flex items-center justify-center gap-2 rounded-xl border py-2 text-xs font-black ${
                    timeOfDay === 'day'
                      ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                      : 'border-slate-700 bg-slate-950/60 text-slate-400'
                  }`}
                >
                  <Sun className="h-4 w-4 text-amber-400" />
                  <span>Kunduzgi</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    onChangeTimeOfDay('night');
                  }}
                  className={`flex items-center justify-center gap-2 rounded-xl border py-2 text-xs font-black ${
                    timeOfDay === 'night'
                      ? 'border-sky-400 bg-sky-500/20 text-sky-200'
                      : 'border-slate-700 bg-slate-950/60 text-slate-400'
                  }`}
                >
                  <Moon className="h-4 w-4 text-sky-400" />
                  <span>Tungi</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  soundEngine.unlock();
                  soundEngine.playClick();
                  onStartMode('free');
                }}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-sky-500 py-3 text-sm font-black text-slate-950 hover:brightness-110 active:scale-95"
              >
                <Play className="h-4 w-4 fill-slate-950" />
                <span>ERKIN HAYDASHNI BOSHLASH</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
