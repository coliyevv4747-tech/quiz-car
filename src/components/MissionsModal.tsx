import React, { useState } from 'react';
import { ArrowLeft, Compass, Flag, ParkingSquare, Play, Star, Timer } from 'lucide-react';
import { PARKING_MISSIONS } from '../data/gameData';
import { soundEngine } from '../game/audio';
import { GameMode, MissionProgress } from '../types/game';

interface MissionsModalProps {
  parkingProgress: Record<string, MissionProgress>;
  cityBestScore: number;
  onStartMode: (mode: GameMode, missionId?: string) => void;
  onBack: () => void;
}

export const MissionsModal: React.FC<MissionsModalProps> = ({
  parkingProgress,
  cityBestScore,
  onStartMode,
  onBack,
}) => {
  const [tab, setTab] = useState<GameMode>('parking');

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#090d16]/85 p-3 sm:p-6">
      <div className="flex max-h-full w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-[#0d1422] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
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
                Parkovka topshiriqlari, shaharda harakat yoki erkin haydashni tanlang
              </p>
            </div>
          </div>

          <div className="flex rounded-xl border border-slate-700 bg-slate-900 p-1">
            {[
              { id: 'parking' as GameMode, label: 'Parkovka', icon: ParkingSquare },
              { id: 'city' as GameMode, label: 'Shahar', icon: Flag },
              { id: 'free' as GameMode, label: 'Erkin', icon: Compass },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setTab(id);
                }}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  tab === id ? 'bg-sky-500 text-slate-950' : 'text-slate-300 hover:text-white'
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

          {tab === 'city' && (
            <div className="mx-auto max-w-xl rounded-2xl border border-slate-700 bg-slate-900/80 p-5">
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-emerald-500/20 px-2.5 py-1 text-xs font-black text-emerald-300">
                  REJIM C · SHAHARDA HAYDASH
                </span>
                <span className="text-xs font-bold text-amber-300 tabular-nums">
                  Eng yuqori ball: {cityBestScore}
                </span>
              </div>
              <h3 className="mt-3 text-lg font-black text-white">
                Toshkent Yo&apos;l Harakati Qoidalari Sinovi
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">
                10 ta shahar nazorat nuqtasidan o&apos;ting. Svetoforlarning qizil chirog&apos;ida
                to&apos;xtang, 60 km/soat tezlik chegarasiga amal qiling va boshqa obyektlarga
                urilmasdan marraga yeting!
              </p>
              <ul className="mt-3 space-y-1.5 text-xs text-slate-300">
                <li>• Har bir nazorat nuqtasi: +150 ball</li>
                <li>• Qizil chiroqdan o&apos;tish: -150 ball</li>
                <li>• Tezlik me&apos;yorini buzish (72+ km/soat): -60 ball</li>
                <li>• To&apos;qnashuv: -120 ball</li>
              </ul>
              <button
                type="button"
                onClick={() => {
                  soundEngine.unlock();
                  soundEngine.playClick();
                  onStartMode('city');
                }}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-sky-500 py-3 text-sm font-black text-slate-950 hover:brightness-110 active:scale-95"
              >
                <Play className="h-4 w-4 fill-slate-950" />
                <span>SHAHAR MARSHRUTINI BOSHLASH</span>
              </button>
            </div>
          )}

          {tab === 'free' && (
            <div className="mx-auto max-w-xl rounded-2xl border border-slate-700 bg-slate-900/80 p-5">
              <span className="rounded-md bg-sky-500/20 px-2.5 py-1 text-xs font-black text-sky-300">
                REJIM A · ERKIN HAYDASH
              </span>
              <h3 className="mt-3 text-lg font-black text-white">
                Cheklovlarsiz Shahar Sayohati
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">
                Vaqt cheklovisiz keng ko&apos;chalar, avtoturargohlar va maydonlarni o&apos;rganing.
                Avtomobil fizikasi, tormozlash, qo&apos;l tormozi va 4 xil kamera burchagini sinab
                ko&apos;ring.
              </p>
              <button
                type="button"
                onClick={() => {
                  soundEngine.unlock();
                  soundEngine.playClick();
                  onStartMode('free');
                }}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 py-3 text-sm font-black text-slate-950 hover:brightness-110 active:scale-95"
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
