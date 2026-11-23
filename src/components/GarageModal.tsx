import React, { useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, Play } from 'lucide-react';
import { VEHICLE_COLORS, VEHICLE_SPECS } from '../data/gameData';
import { soundEngine } from '../game/audio';
import { GarageAngle, VehicleId } from '../types/game';

interface GarageModalProps {
  selectedVehicle: VehicleId;
  selectedColor: string;
  garageAngle: GarageAngle;
  onSelectVehicle: (id: VehicleId) => void;
  onSelectColor: (colorId: string) => void;
  onSelectAngle: (angle: GarageAngle) => void;
  onDriveNow: () => void;
  onBack: () => void;
}

const ANGLE_OPTIONS: Array<{ id: GarageAngle; label: string }> = [
  { id: 'front', label: 'Oldindan' },
  { id: 'side', label: 'Yondan' },
  { id: 'rear', label: 'Orqadan' },
  { id: 'interior', label: 'Salon' },
];

export const GarageModal: React.FC<GarageModalProps> = ({
  selectedVehicle,
  selectedColor,
  garageAngle,
  onSelectVehicle,
  onSelectColor,
  onSelectAngle,
  onDriveNow,
  onBack,
}) => {
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const spec = VEHICLE_SPECS.find((v) => v.id === selectedVehicle) ?? VEHICLE_SPECS[0];

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-3 sm:p-5">
      {/* TOP MINIMAL HEADER (Does not cover center 3D car) */}
      <div className="flex items-start justify-between gap-2">
        <div className="pointer-events-auto flex items-center gap-2.5 rounded-xl border border-slate-700/80 bg-[#090d16]/88 px-3 py-2 shadow-lg">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onBack();
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 active:scale-95"
            aria-label="Orqaga"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="text-xs font-black uppercase tracking-wider text-amber-400">
              3D GARAJ
            </div>
            <div className="text-sm font-extrabold text-white">
              {spec.name}{' '}
              <span className="text-xs font-medium text-slate-400">· {spec.subtitle}</span>
            </div>
          </div>
        </div>

        {/* Compact Stat Readout (Top-Left/Center-Right without mid-screen occlusion) */}
        <div className="pointer-events-auto hidden items-center gap-4 rounded-xl border border-slate-700/80 bg-[#090d16]/88 px-4 py-2 text-xs sm:flex">
          <div>
            <div className="text-[10px] uppercase text-slate-400">Maks. Tezlik</div>
            <div className="font-black text-sky-300 tabular-nums">{spec.maxSpeedKmh} km/s</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-slate-400">Tezlanish</div>
            <div className="font-black text-emerald-300 tabular-nums">{spec.stats.acceleration}/100</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-slate-400">Boshqaruv</div>
            <div className="font-black text-amber-300 tabular-nums">{spec.stats.handling}/100</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-slate-400">Vazni</div>
            <div className="font-black text-slate-200 tabular-nums">{spec.mass} kg</div>
          </div>
        </div>
      </div>

      {/* BOTTOM COLLAPSIBLE CONTROL DOCK */}
      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            setDockCollapsed((v) => !v);
          }}
          className="pointer-events-auto mb-1.5 flex items-center gap-1.5 rounded-t-xl border border-b-0 border-slate-700/80 bg-[#090d16]/90 px-4 py-1 text-[11px] font-bold text-slate-300 hover:text-white"
        >
          {dockCollapsed ? (
            <>
              <ChevronUp className="h-3.5 w-3.5 text-sky-400" />
              <span>Boshqaruvni ko&apos;rsatish</span>
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5 text-sky-400" />
              <span>Mashinani to&apos;liq ko&apos;rish</span>
            </>
          )}
        </button>

        {!dockCollapsed && (
          <div className="pointer-events-auto w-full max-w-4xl rounded-2xl border border-slate-700/80 bg-[#090d16]/92 p-3 shadow-2xl">
            {/* Row 1: 4 Vehicles + Drive Button */}
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
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
                          ? 'border-sky-400 bg-sky-500/20 text-white'
                          : 'border-slate-700 bg-slate-900/80 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      <div className="truncate text-xs font-extrabold">{v.name}</div>
                      <div className="truncate text-[10px] text-slate-400">{v.subtitle}</div>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => {
                  soundEngine.unlock();
                  soundEngine.playClick();
                  onDriveNow();
                }}
                className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-sky-500 px-5 py-2.5 text-xs font-black tracking-wide text-slate-950 shadow-lg hover:brightness-110 active:scale-95"
              >
                <Play className="h-4 w-4 fill-slate-950" />
                <span>HAYDASHNI BOSHLASH</span>
              </button>
            </div>

            {/* Row 2: Paint Swatches + Inspection Angles */}
            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Rang:
                </span>
                {VEHICLE_COLORS.map((c) => {
                  const active = c.id === selectedColor;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      title={c.name}
                      aria-label={c.name}
                      onClick={() => {
                        soundEngine.playClick();
                        onSelectColor(c.id);
                      }}
                      className={`h-7 w-7 rounded-lg border-2 transition-transform ${
                        active ? 'scale-110 border-white shadow-md' : 'border-slate-600/80 hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  );
                })}
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                  Kamera:
                </span>
                {ANGLE_OPTIONS.map((ang) => (
                  <button
                    key={ang.id}
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      onSelectAngle(ang.id);
                    }}
                    className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold transition ${
                      garageAngle === ang.id
                        ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                        : 'border-slate-700 bg-slate-900/70 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {ang.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
