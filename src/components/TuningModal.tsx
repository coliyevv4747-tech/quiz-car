import React, { useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, Gauge, Paintbrush, Play } from 'lucide-react';
import { RIM_COLORS, VEHICLE_COLORS, VEHICLE_SPECS } from '../data/gameData';
import { soundEngine } from '../game/audio';
import {
  AeroKitStyle,
  CarCustomization,
  GarageAngle,
  HeadlightStyle,
  PaintFinish,
  RimStyle,
  SpoilerStyle,
  VehicleId,
  WindowTintLevel,
} from '../types/game';

interface TuningModalProps {
  vehicleId: VehicleId;
  customization: CarCustomization;
  garageAngle: GarageAngle;
  onUpdateCustomization: (next: CarCustomization) => void;
  onSelectAngle: (angle: GarageAngle) => void;
  onStartRace: () => void;
  onBack: () => void;
}

export const TuningModal: React.FC<TuningModalProps> = ({
  vehicleId,
  customization,
  garageAngle,
  onUpdateCustomization,
  onSelectAngle,
  onStartRace,
  onBack,
}) => {
  const [tab, setTab] = useState<'visual' | 'performance'>('visual');
  const [visualSubTab, setVisualSubTab] = useState<'paint' | 'wheels' | 'aero' | 'lights'>('paint');
  const [collapsed, setCollapsed] = useState(false);
  const spec = VEHICLE_SPECS.find((v) => v.id === vehicleId) ?? VEHICLE_SPECS[0];

  const patch = (partial: Partial<CarCustomization>) => {
    soundEngine.playClick();
    onUpdateCustomization({ ...customization, ...partial });
  };

  const setUpgrade = (key: keyof CarCustomization['upgrades'], level: number) => {
    soundEngine.playClick();
    onUpdateCustomization({
      ...customization,
      upgrades: { ...customization.upgrades, [key]: level },
    });
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-3 sm:p-5">
      {/* TOP BAR */}
      <div className="flex items-start justify-between gap-2">
        <div className="pointer-events-auto flex items-center gap-2.5 rounded-xl border border-slate-700/80 bg-[#090d16]/90 px-3 py-2 shadow-lg">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onBack();
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="text-[11px] font-black uppercase tracking-wider text-emerald-400">
              MASHINA SOZLASH VA TYUNING
            </div>
            <div className="text-sm font-extrabold text-white">{spec.name}</div>
          </div>
        </div>

        {/* Angle Switcher */}
        <div className="pointer-events-auto flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-[#090d16]/90 p-1.5">
          {(
            [
              { id: 'front', label: 'Oldi' },
              { id: 'side', label: 'Yoni' },
              { id: 'rear', label: 'Orqasi' },
            ] as Array<{ id: GarageAngle; label: string }>
          ).map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onSelectAngle(a.id);
              }}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                garageAngle === a.id ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* BOTTOM COLLAPSIBLE TUNING DOCK */}
      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            setCollapsed((v) => !v);
          }}
          className="pointer-events-auto mb-1 flex items-center gap-1.5 rounded-t-xl border border-b-0 border-slate-700/80 bg-[#090d16]/90 px-4 py-1 text-[11px] font-bold text-slate-300"
        >
          {collapsed ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          <span>{collapsed ? 'Tyuningni ochish' : 'Mashinani ko‘rish'}</span>
        </button>

        {!collapsed && (
          <div className="pointer-events-auto w-full max-w-4xl rounded-2xl border border-slate-700/85 bg-[#090d16]/94 p-3 shadow-2xl">
            {/* Main Tabs + Start Button */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setTab('visual');
                  }}
                  className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-black ${
                    tab === 'visual' ? 'bg-sky-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  <Paintbrush className="h-3.5 w-3.5" />
                  <span>Tashqi Ko&apos;rinish</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setTab('performance');
                  }}
                  className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-black ${
                    tab === 'performance' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  <Gauge className="h-3.5 w-3.5" />
                  <span>Texnik Kuchaytirish</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  soundEngine.unlock();
                  soundEngine.playClick();
                  onStartRace();
                }}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 px-4 py-1.5 text-xs font-black text-slate-950 active:scale-95"
              >
                <Play className="h-3.5 w-3.5 fill-slate-950" />
                <span>POYGAGA CHIQISH</span>
              </button>
            </div>

            {tab === 'visual' ? (
              <div className="mt-2.5 space-y-2.5">
                {/* Visual Sub-Tabs */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'paint', label: "Bo'yoq" },
                    { id: 'wheels', label: 'Disklar' },
                    { id: 'aero', label: 'Spoyler & Obves' },
                    { id: 'lights', label: 'Oyna & Faralar' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        setVisualSubTab(st.id as typeof visualSubTab);
                        if (st.id === 'aero') onSelectAngle('rear');
                        else if (st.id === 'wheels') onSelectAngle('side');
                        else if (st.id === 'lights') onSelectAngle('front');
                      }}
                      className={`rounded-lg border px-3 py-1 text-[11px] font-bold ${
                        visualSubTab === st.id
                          ? 'border-sky-400 bg-sky-500/20 text-sky-200'
                          : 'border-slate-700 bg-slate-900 text-slate-400'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>

                {visualSubTab === 'paint' && (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {VEHICLE_COLORS.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          title={c.name}
                          onClick={() => patch({ colorId: c.id })}
                          className={`h-7 w-7 rounded-lg border-2 ${
                            customization.colorId === c.id ? 'scale-110 border-white' : 'border-slate-700'
                          }`}
                          style={{ backgroundColor: c.hex }}
                        />
                      ))}
                    </div>
                    <div className="flex gap-1.5">
                      {(
                        [
                          { id: 'metallic', label: 'Metallik' },
                          { id: 'matte', label: 'Mat' },
                          { id: 'chrome', label: 'Xrom' },
                        ] as Array<{ id: PaintFinish; label: string }>
                      ).map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => patch({ paintFinish: f.id })}
                          className={`rounded-lg border px-3 py-1 text-xs font-bold ${
                            customization.paintFinish === f.id
                              ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                              : 'border-slate-700 bg-slate-900 text-slate-300'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {visualSubTab === 'wheels' && (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-1.5">
                      {(
                        [
                          { id: 'sport5', label: '5-Spitsa Sport' },
                          { id: 'mesh', label: 'Y-Mesh BBS' },
                          { id: 'turbine', label: 'Aero Turbina' },
                          { id: 'forged', label: '10-Spitsa Forged' },
                        ] as Array<{ id: RimStyle; label: string }>
                      ).map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => patch({ rimStyle: r.id })}
                          className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${
                            customization.rimStyle === r.id
                              ? 'border-sky-400 bg-sky-500/20 text-white'
                              : 'border-slate-700 bg-slate-900 text-slate-300'
                          }`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {RIM_COLORS.map((rc) => (
                        <button
                          key={rc.id}
                          type="button"
                          title={rc.name}
                          onClick={() => patch({ rimColorHex: rc.hex })}
                          className={`h-7 w-7 rounded-full border-2 ${
                            customization.rimColorHex === rc.hex ? 'scale-110 border-white' : 'border-slate-600'
                          }`}
                          style={{ backgroundColor: rc.hex }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {visualSubTab === 'aero' && (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <div className="mb-1 text-[10px] font-bold uppercase text-slate-400">Spoyler</div>
                      <div className="flex flex-wrap gap-1">
                        {(
                          [
                            { id: 'none', label: "Yo'q" },
                            { id: 'lip', label: 'Lip' },
                            { id: 'gt', label: 'GT Wing' },
                            { id: 'swan', label: 'Swan' },
                          ] as Array<{ id: SpoilerStyle; label: string }>
                        ).map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => patch({ spoiler: s.id })}
                            className={`rounded-md border px-2 py-1 text-[11px] font-bold ${
                              customization.spoiler === s.id
                                ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                                : 'border-slate-700 bg-slate-900 text-slate-300'
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {(
                      [
                        { key: 'frontBumper', label: 'Old Bamper' },
                        { key: 'rearBumper', label: 'Orqa Diffuzor' },
                        { key: 'sideSkirts', label: 'Yon Yubkalar' },
                      ] as const
                    ).map((part) => (
                      <div key={part.key}>
                        <div className="mb-1 text-[10px] font-bold uppercase text-slate-400">
                          {part.label}
                        </div>
                        <div className="flex gap-1">
                          {(
                            [
                              { id: 'stock', label: 'Zavod' },
                              { id: 'sport', label: 'Sport' },
                              { id: 'track', label: 'Trek' },
                            ] as Array<{ id: AeroKitStyle; label: string }>
                          ).map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => patch({ [part.key]: opt.id } as Partial<CarCustomization>)}
                              className={`rounded-md border px-2 py-1 text-[11px] font-bold ${
                                customization[part.key] === opt.id
                                  ? 'border-sky-400 bg-sky-500/20 text-sky-200'
                                  : 'border-slate-700 bg-slate-900 text-slate-300'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {visualSubTab === 'lights' && (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-slate-400 mr-1">Tonirovka:</span>
                      {(
                        [
                          { id: 'light', label: 'Yengil' },
                          { id: 'medium', label: "O'rta" },
                          { id: 'dark', label: "To'q" },
                          { id: 'limo', label: 'Limo' },
                        ] as Array<{ id: WindowTintLevel; label: string }>
                      ).map((w) => (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => patch({ windowTint: w.id })}
                          className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${
                            customization.windowTint === w.id
                              ? 'border-sky-400 bg-sky-500/20 text-white'
                              : 'border-slate-700 bg-slate-900 text-slate-300'
                          }`}
                        >
                          {w.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-slate-400 mr-1">Faralar:</span>
                      {(
                        [
                          { id: 'xenon', label: 'Xenon' },
                          { id: 'gt_gold', label: 'GT Oltin' },
                          { id: 'laser_cyan', label: 'Lazer' },
                          { id: 'neon_violet', label: 'Neon' },
                        ] as Array<{ id: HeadlightStyle; label: string }>
                      ).map((h) => (
                        <button
                          key={h.id}
                          type="button"
                          onClick={() => patch({ headlightStyle: h.id })}
                          className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${
                            customization.headlightStyle === h.id
                              ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                              : 'border-slate-700 bg-slate-900 text-slate-300'
                          }`}
                        >
                          {h.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* PERFORMANCE UPGRADES */
              <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-5">
                {(
                  [
                    { key: 'engine', label: 'Dvigatel', desc: '+Tezlik & Quvvat' },
                    { key: 'transmission', label: 'Uzatmalar', desc: '+Tezlanish' },
                    { key: 'brakes', label: 'Tormozlar', desc: '+To‘xtash kuchi' },
                    { key: 'tires', label: 'Shinalar', desc: "+Yo'lga yopishish" },
                    { key: 'suspension', label: 'Podveska', desc: '+Barqarorlik' },
                  ] as const
                ).map((u) => {
                  const lvl = customization.upgrades[u.key];
                  return (
                    <div
                      key={u.key}
                      className="rounded-xl border border-slate-700/80 bg-slate-900/80 p-2.5"
                    >
                      <div className="text-xs font-black text-white">{u.label}</div>
                      <div className="text-[10px] text-slate-400">{u.desc}</div>
                      <div className="mt-2 flex gap-1">
                        {[0, 1, 2, 3].map((step) => (
                          <button
                            key={step}
                            type="button"
                            onClick={() => setUpgrade(u.key, step)}
                            className={`flex-1 rounded-md py-1 text-[11px] font-black transition ${
                              lvl >= step && step > 0
                                ? 'bg-emerald-500 text-slate-950'
                                : lvl === 0 && step === 0
                                ? 'bg-sky-500 text-slate-950'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                          >
                            {step === 0 ? 'Std' : `S${step}`}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
