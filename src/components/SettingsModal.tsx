import React from 'react';
import { ArrowLeft, Gamepad2, Gauge, Monitor, Moon, Sun, Volume2 } from 'lucide-react';
import { soundEngine } from '../game/audio';
import { ControlScheme, GraphicsQuality, SoundSettings, TimeOfDay } from '../types/game';
import { PWAInstallButton } from './PWAInstallButton';

interface SettingsModalProps {
  graphics: GraphicsQuality;
  controlScheme: ControlScheme;
  timeOfDay: TimeOfDay;
  autoTransmission: boolean;
  sound: SoundSettings;
  onChangeGraphics: (q: GraphicsQuality) => void;
  onChangeControlScheme: (c: ControlScheme) => void;
  onChangeTimeOfDay: (t: TimeOfDay) => void;
  onChangeAutoTransmission: (auto: boolean) => void;
  onChangeSound: (next: SoundSettings) => void;
  onBack: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  graphics,
  controlScheme,
  timeOfDay,
  autoTransmission,
  sound,
  onChangeGraphics,
  onChangeControlScheme,
  onChangeTimeOfDay,
  onChangeAutoTransmission,
  onChangeSound,
  onBack,
}) => {
  const toggleSound = (key: keyof SoundSettings) => {
    soundEngine.playClick();
    onChangeSound({ ...sound, [key]: !sound[key] });
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#090d16]/88 p-3 sm:p-6">
      <div className="flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-[#0d1422] shadow-2xl">
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
            <h2 className="text-base font-black uppercase tracking-wide text-white">SOZLAMALAR</h2>
          </div>
          <PWAInstallButton />
        </div>

        <div className="uzb-scroll space-y-5 overflow-y-auto p-4 sm:p-5">
          {/* Graphics Quality */}
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-sky-400">
              <Monitor className="h-4 w-4" />
              <span>Grafika Sifati (Android Optimallashtirish)</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'low', label: 'PAST', desc: 'Zaif telefonlar (30+ FPS)' },
                  { id: 'medium', label: "O'RTA", desc: 'Muvozanatli sifat' },
                  { id: 'high', label: 'YUQORI', desc: 'Soyalar va yoruglik' },
                ] as const
              ).map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    onChangeGraphics(g.id);
                  }}
                  className={`rounded-xl border p-2.5 text-left transition ${
                    graphics === g.id
                      ? 'border-sky-400 bg-sky-500/20 text-white'
                      : 'border-slate-700 bg-slate-900/80 text-slate-300'
                  }`}
                >
                  <div className="text-xs font-black">{g.label}</div>
                  <div className="mt-0.5 text-[10px] text-slate-400">{g.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Touch Control Scheme */}
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-400">
              <Gamepad2 className="h-4 w-4" />
              <span>Sensorli Boshqaruv Turi</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onChangeControlScheme('wheel');
                }}
                className={`rounded-xl border p-3 text-left transition ${
                  controlScheme === 'wheel'
                    ? 'border-emerald-400 bg-emerald-500/20 text-white'
                    : 'border-slate-700 bg-slate-900/80 text-slate-300'
                }`}
              >
                <div className="text-xs font-black">RUL (Chambaragi)</div>
                <div className="mt-0.5 text-[10px] text-slate-400">
                  Real burilish sezgirligi
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onChangeControlScheme('buttons');
                }}
                className={`rounded-xl border p-3 text-left transition ${
                  controlScheme === 'buttons'
                    ? 'border-emerald-400 bg-emerald-500/20 text-white'
                    : 'border-slate-700 bg-slate-900/80 text-slate-300'
                }`}
              >
                <div className="text-xs font-black">CHAP / O&apos;NG TUGMALAR</div>
                <div className="mt-0.5 text-[10px] text-slate-400">
                  Katta va qulay tugmalar
                </div>
              </button>
            </div>
          </div>

          {/* Transmission & Time of Day */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-rose-400">
                <Gauge className="h-4 w-4" />
                <span>Uzatmalar Qutisi</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    onChangeAutoTransmission(true);
                  }}
                  className={`rounded-xl border p-2.5 text-left transition ${
                    autoTransmission
                      ? 'border-rose-400 bg-rose-500/20 text-white'
                      : 'border-slate-700 bg-slate-900/80 text-slate-300'
                  }`}
                >
                  <div className="text-xs font-black">AVTOMAT</div>
                  <div className="mt-0.5 text-[10px] text-slate-400">6-pog&apos;onali avto</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    onChangeAutoTransmission(false);
                  }}
                  className={`rounded-xl border p-2.5 text-left transition ${
                    !autoTransmission
                      ? 'border-rose-400 bg-rose-500/20 text-white'
                      : 'border-slate-700 bg-slate-900/80 text-slate-300'
                  }`}
                >
                  <div className="text-xs font-black">MEXANIK</div>
                  <div className="mt-0.5 text-[10px] text-slate-400">Qo&apos;lda almashtirish</div>
                </button>
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-indigo-400">
                {timeOfDay === 'day' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                <span>Kun Vaqti (Shahar)</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    onChangeTimeOfDay('day');
                  }}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border p-2.5 text-xs font-black transition ${
                    timeOfDay === 'day'
                      ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                      : 'border-slate-700 bg-slate-900/80 text-slate-300'
                  }`}
                >
                  <Sun className="h-4 w-4 text-amber-400" />
                  <span>KUNDUZGI</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    onChangeTimeOfDay('night');
                  }}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border p-2.5 text-xs font-black transition ${
                    timeOfDay === 'night'
                      ? 'border-sky-400 bg-sky-500/20 text-sky-200'
                      : 'border-slate-700 bg-slate-900/80 text-slate-300'
                  }`}
                >
                  <Moon className="h-4 w-4 text-sky-400" />
                  <span>TUNGI</span>
                </button>
              </div>
            </div>
          </div>

          {/* Audio Controls */}
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-400">
              <Volume2 className="h-4 w-4" />
              <span>Ovoz Sozlamalari</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { key: 'master', label: 'Umumiy Ovoz' },
                  { key: 'engine', label: 'Dvigatel Ovozi' },
                  { key: 'sfx', label: 'Tormoz, Signal va Effektlar' },
                  { key: 'ambient', label: 'Muhit Ovozi' },
                ] as const
              ).map(({ key, label }) => {
                const enabled = sound[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleSound(key)}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-xs font-bold transition ${
                      enabled
                        ? 'border-amber-400/60 bg-amber-500/15 text-white'
                        : 'border-slate-700 bg-slate-900/75 text-slate-400'
                    }`}
                  >
                    <span>{label}</span>
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-black ${
                        enabled ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {enabled ? 'YOQILGAN' : "O'CHIQ"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
