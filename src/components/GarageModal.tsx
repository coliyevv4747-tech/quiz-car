import React, { useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, Play, Sliders } from 'lucide-react';
import { VEHICLE_SPECS } from '../data/gameData';
import { soundEngine } from '../game/audio';
import { CarCustomization, GarageAngle, VehicleId } from '../types/game';

interface GarageModalProps {
  mode: 'cars' | 'garage';
  selectedVehicle: VehicleId;
  customization: CarCustomization;
  garageAngle: GarageAngle;
  onSelectVehicle: (id: VehicleId) => void;
  onSelectAngle: (angle: GarageAngle) => void;
  onOpenTuning: () => void;
  onStartRace: () => void;
  onBack: () => void;
}

const ANGLE_OPTIONS: Array<{ id: GarageAngle; label: string }> = [
  { id: 'front', label: 'Oldindan' },
  { id: 'side', label: 'Yondan' },
  { id: 'rear', label: 'Orqadan' },
  { id: 'interior', label: 'Salon' },
];

export const GarageModal: React.FC<GarageModalProps> = ({
  mode,
  selectedVehicle,
  customization,
  garageAngle,
  onSelectVehicle,
  onSelectAngle,
  onOpenTuning,
  onStartRace,
  onBack,
}) => {
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const spec = VEHICLE_SPECS.find((v) => v.id === selectedVehicle) ?? VEHICLE_SPECS[0];

  const boostSpeed = Math.min(100, spec.stats.speed + customization.upgrades.engine * 3);
  const boostAccel = Math.min(
    100,
    spec.stats.acceleration + customization.upgrades.engine * 2 + customization.upgrades.transmission * 2
  );
  const boostHandle = Math.min(
    100,
    spec.stats.handling + customization.upgrades.tires * 2 + customization.upgrades.suspension * 2
  );
  const boostBrake = Math.min(100, spec.stats.braking + customization.upgrades.brakes * 3);

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-3 sm:p-5">
      {/* TOP COMPACT HEADER */}
      <div className="flex items-start justify-between gap-2">
        <div className="pointer-events-auto flex items-center gap-2.5 rounded-xl border border-slate-700/80 bg-[#090d16]/90 px-3 py-2 shadow-lg">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onBack();
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700"
            aria-label="Orqaga"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="text-[11px] font-black uppercase tracking-wider text-rose-400">
              {mode === 'cars' ? 'SPORT MASHINALAR KOLLEKSIYASI' : '3D GARAJ'}
            </div>
            <div className="text-sm font-extrabold text-white">
              {spec.name}{' '}
              <span className="text-xs font-medium text-slate-400">· {spec.origin}</span>
            </div>
          </div>
        </div>

        {/* Stat Bars Top-Right */}
        <div className="pointer-events-auto hidden w-64 space-y-1.5 rounded-xl border border-slate-700/80 bg-[#090d16]/90 p-3 text-[11px] sm:block">
          <div className="text-slate-300 leading-snug mb-1.5">{spec.description}</div>
          {[
            { label: 'Tezlik', val: boostSpeed, col: 'bg-sky-400' },
            { label: 'Tezlanish', val: boostAccel, col: 'bg-emerald-400' },
            { label: 'Boshqaruv', val: boostHandle, col: 'bg-amber-400' },
            { label: 'Tormoz', val: boostBrake, col: 'bg-rose-400' },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-2">
              <span className="w-16 font-bold text-slate-400">{s.label}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
                <div className={`h-full ${s.col}`} style={{ width: `${s.val}%` }} />
              </div>
              <span className="w-7 text-right font-black text-white tabular-nums">{s.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* COLLAPSIBLE BOTTOM DOCK */}
      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            setDockCollapsed((v) => !v);
          }}
          className="pointer-events-auto mb-1 flex items-center gap-1.5 rounded-t-xl border border-b-0 border-slate-700/80 bg-[#090d16]/90 px-4 py-1 text-[11px] font-bold text-slate-300 hover:text-white"
        >
          {dockCollapsed ? (
            <>
              <ChevronUp className="h-3.5 w-3.5 text-sky-400" />
              <span>Panelni ko&apos;rsatish</span>
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5 text-sky-400" />
              <span>Mashinani to&apos;liq ko&apos;rish</span>
            </>
          )}
        </button>

        {!dockCollapsed && (
          <div className="pointer-events-auto w-full max-w-5xl rounded-2xl border border-slate-700/85 bg-[#090d16]/92 p-3 shadow-2xl">
            {/* 5 Selectable Sports Cars */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {VEHICLE_SPECS.map((v) => {
                const active = v.id === selectedVehicle;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      onSelectVehicle(v.id);
                    }}
                    className={`rounded-xl border px-2.5 py-2 text-left transition active:scale-95 ${
                      active
                        ? 'border-rose-400 bg-rose-500/20 text-white'
                        : 'border-slate-700 bg-slate-900/85 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <div className="truncate text-xs font-black">{v.name}</div>
                    <div className="truncate text-[10px] text-slate-400">{v.subtitle}</div>
                    <div className="mt-1 text-[10px] font-bold text-sky-300 tabular-nums">
                      {v.maxSpeedKmh} km/s · {v.mass} kg
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bottom Controls: Camera Angles + Tuning + Start Race */}
            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-2.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-[11px] font-bold uppercase text-slate-400">Kamera:</span>
                {ANGLE_OPTIONS.map((ang) => (
                  <button
                    key={ang.id}
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      onSelectAngle(ang.id);
                    }}
                    className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-bold ${
                      garageAngle === ang.id
                        ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                        : 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {ang.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    onOpenTuning();
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-emerald-500/55 bg-emerald-500/15 px-4 py-2 text-xs font-black text-emerald-300 hover:bg-emerald-500/25 active:scale-95"
                >
                  <Sliders className="h-4 w-4" />
                  <span>SOZLASH / TYUNING</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundEngine.unlock();
                    soundEngine.playClick();
                    onStartRace();
                  }}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 px-5 py-2 text-xs font-black text-slate-950 shadow-lg hover:brightness-110 active:scale-95"
                >
                  <Play className="h-4 w-4 fill-slate-950" />
                  <span>POYGANI BOSHLASH</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
