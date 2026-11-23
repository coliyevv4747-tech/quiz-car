import React, { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp, Hand } from 'lucide-react';
import { soundEngine } from '../game/audio';
import { ControlScheme, GearMode } from '../types/game';
import { TouchInputRef } from './GameCanvas';

interface TouchControlsProps {
  controlScheme: ControlScheme;
  gear: GearMode;
  onGearUp: () => void;
  onGearDown: () => void;
  touchInputRef: React.MutableRefObject<TouchInputRef>;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  controlScheme,
  gear,
  onGearUp,
  onGearDown,
  touchInputRef,
}) => {
  const wheelRef = useRef<HTMLDivElement | null>(null);
  const wheelPointerId = useRef<number | null>(null);
  const leftBtnPointerId = useRef<number | null>(null);
  const rightBtnPointerId = useRef<number | null>(null);
  const gasPointerId = useRef<number | null>(null);
  const brakePointerId = useRef<number | null>(null);
  const hbPointerId = useRef<number | null>(null);

  const [wheelVisualDeg, setWheelVisualDeg] = useState(0);
  const [gasPressed, setGasPressed] = useState(false);
  const [brakePressed, setBrakePressed] = useState(false);
  const [hbPressed, setHbPressed] = useState(false);
  const [leftPressed, setLeftPressed] = useState(false);
  const [rightPressed, setRightPressed] = useState(false);

  const updateWheelFromPointer = (clientX: number, clientY: number) => {
    const el = wheelRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width * 0.5;
    const cy = rect.top + rect.height * 0.5;
    const dx = clientX - cx;
    const dy = clientY - cy;

    let norm = -dx / (rect.width * 0.48);
    if (Math.abs(dy) > 10 && Math.hypot(dx, dy) > 18) {
      const angleFromTop = Math.atan2(-dx, -dy);
      const angleNorm = Math.max(-1, Math.min(1, angleFromTop / (Math.PI * 0.55)));
      norm = Math.abs(dx) > Math.abs(dy) ? norm : angleNorm;
    }
    const clamped = Math.max(-1, Math.min(1, norm));
    touchInputRef.current.steer = clamped;
    setWheelVisualDeg(-clamped * 110);
  };

  const handleWheelDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    soundEngine.unlock();
    wheelPointerId.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    updateWheelFromPointer(e.clientX, e.clientY);
  };

  const handleWheelMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (wheelPointerId.current !== e.pointerId) return;
    e.preventDefault();
    updateWheelFromPointer(e.clientX, e.clientY);
  };

  const handleWheelUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (wheelPointerId.current !== e.pointerId) return;
    wheelPointerId.current = null;
    touchInputRef.current.steer = 0;
    setWheelVisualDeg(0);
  };

  const updateButtonSteer = (left: boolean, right: boolean) => {
    touchInputRef.current.steer = (left ? 1 : 0) - (right ? 1 : 0);
  };

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex items-end justify-between px-3 pb-3 sm:px-6 sm:pb-5"
      style={{ touchAction: 'none' }}
    >
      {/* LEFT SIDE: STEERING BUTTONS OR WHEEL */}
      <div className="pointer-events-auto flex items-end gap-3">
        {controlScheme === 'wheel' ? (
          <div
            ref={wheelRef}
            onPointerDown={handleWheelDown}
            onPointerMove={handleWheelMove}
            onPointerUp={handleWheelUp}
            onPointerCancel={handleWheelUp}
            aria-label="Rul boshqaruvi"
            className="relative flex h-36 w-36 items-center justify-center rounded-full border-4 border-sky-400/55 bg-[#090d16]/70 shadow-2xl sm:h-40 sm:w-40"
            style={{ touchAction: 'none' }}
          >
            <div
              className="relative flex h-full w-full items-center justify-center transition-transform duration-75"
              style={{ transform: `rotate(${wheelVisualDeg}deg)` }}
            >
              <div className="absolute inset-3 rounded-full border-[10px] border-slate-200/85" />
              <div className="absolute top-3 h-3 w-4 rounded-sm bg-rose-500" />
              <div className="h-3.5 w-28 rounded bg-slate-300/85" />
              <div className="absolute bottom-4 h-12 w-3.5 rounded bg-slate-300/85" />
              <div className="z-10 flex h-11 w-11 items-center justify-center rounded-full border-2 border-sky-400 bg-slate-900 text-[10px] font-bold tracking-wider text-sky-300">
                UZB
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Chapga burilish"
              onPointerDown={(e) => {
                e.preventDefault();
                soundEngine.unlock();
                leftBtnPointerId.current = e.pointerId;
                e.currentTarget.setPointerCapture(e.pointerId);
                setLeftPressed(true);
                updateButtonSteer(true, rightPressed);
              }}
              onPointerUp={(e) => {
                if (leftBtnPointerId.current !== e.pointerId) return;
                leftBtnPointerId.current = null;
                setLeftPressed(false);
                updateButtonSteer(false, rightPressed);
              }}
              onPointerCancel={() => {
                leftBtnPointerId.current = null;
                setLeftPressed(false);
                updateButtonSteer(false, rightPressed);
              }}
              className={`flex h-20 w-20 items-center justify-center rounded-2xl border-2 transition-transform sm:h-24 sm:w-24 ${
                leftPressed
                  ? 'scale-95 border-sky-400 bg-sky-500/45 text-white'
                  : 'border-slate-500/60 bg-[#090d16]/75 text-slate-100'
              }`}
            >
              <ArrowLeft className="h-10 w-10" />
            </button>

            <button
              type="button"
              aria-label="O'ngga burilish"
              onPointerDown={(e) => {
                e.preventDefault();
                soundEngine.unlock();
                rightBtnPointerId.current = e.pointerId;
                e.currentTarget.setPointerCapture(e.pointerId);
                setRightPressed(true);
                updateButtonSteer(leftPressed, true);
              }}
              onPointerUp={(e) => {
                if (rightBtnPointerId.current !== e.pointerId) return;
                rightBtnPointerId.current = null;
                setRightPressed(false);
                updateButtonSteer(leftPressed, false);
              }}
              onPointerCancel={() => {
                rightBtnPointerId.current = null;
                setRightPressed(false);
                updateButtonSteer(leftPressed, false);
              }}
              className={`flex h-20 w-20 items-center justify-center rounded-2xl border-2 transition-transform sm:h-24 sm:w-24 ${
                rightPressed
                  ? 'scale-95 border-sky-400 bg-sky-500/45 text-white'
                  : 'border-slate-500/60 bg-[#090d16]/75 text-slate-100'
              }`}
            >
              <ArrowRight className="h-10 w-10" />
            </button>
          </div>
        )}
      </div>

      {/* RIGHT SIDE: GEAR UP/DOWN + HANDBRAKE + BRAKE + ACCELERATOR */}
      <div className="pointer-events-auto flex flex-col items-end gap-2.5">
        {/* Gear Up / Down + Current Gear + Handbrake */}
        <div className="flex items-center gap-2">
          <div className="flex items-center overflow-hidden rounded-xl border border-slate-600/80 bg-[#090d16]/85">
            <button
              type="button"
              aria-label="Uzatmani tushirish"
              onPointerDown={(e) => {
                e.preventDefault();
                soundEngine.unlock();
                soundEngine.playGearShift();
                onGearDown();
              }}
              className="flex h-10 w-10 items-center justify-center text-slate-200 hover:bg-slate-800 active:bg-sky-500/30"
            >
              <ChevronDown className="h-5 w-5" />
            </button>
            <div
              className={`flex h-10 min-w-[36px] items-center justify-center px-2 text-sm font-black ${
                gear === 'R'
                  ? 'bg-amber-500 text-slate-950'
                  : gear === 'N'
                  ? 'bg-sky-500 text-slate-950'
                  : 'bg-emerald-500/20 text-emerald-300'
              }`}
            >
              {gear}
            </div>
            <button
              type="button"
              aria-label="Uzatmani ko'tarish"
              onPointerDown={(e) => {
                e.preventDefault();
                soundEngine.unlock();
                soundEngine.playGearShift();
                onGearUp();
              }}
              className="flex h-10 w-10 items-center justify-center text-slate-200 hover:bg-slate-800 active:bg-emerald-500/30"
            >
              <ChevronUp className="h-5 w-5" />
            </button>
          </div>

          <button
            type="button"
            aria-label="Qo'l tormozi / Drift"
            onPointerDown={(e) => {
              e.preventDefault();
              soundEngine.unlock();
              hbPointerId.current = e.pointerId;
              e.currentTarget.setPointerCapture(e.pointerId);
              touchInputRef.current.handbrake = true;
              setHbPressed(true);
            }}
            onPointerUp={(e) => {
              if (hbPointerId.current !== e.pointerId) return;
              hbPointerId.current = null;
              touchInputRef.current.handbrake = false;
              setHbPressed(false);
            }}
            onPointerCancel={() => {
              hbPointerId.current = null;
              touchInputRef.current.handbrake = false;
              setHbPressed(false);
            }}
            className={`flex h-10 items-center gap-1.5 rounded-xl border-2 px-3 text-xs font-black uppercase tracking-wider transition-transform ${
              hbPressed
                ? 'scale-95 border-rose-400 bg-rose-600/80 text-white'
                : 'border-slate-500/60 bg-[#090d16]/80 text-rose-300'
            }`}
          >
            <Hand className="h-4 w-4" />
            <span>DRIFT</span>
          </button>
        </div>

        {/* Pedals */}
        <div className="flex items-end gap-3">
          <button
            type="button"
            aria-label="Tormoz pedali"
            onPointerDown={(e) => {
              e.preventDefault();
              soundEngine.unlock();
              brakePointerId.current = e.pointerId;
              e.currentTarget.setPointerCapture(e.pointerId);
              touchInputRef.current.brake = 1;
              setBrakePressed(true);
            }}
            onPointerUp={(e) => {
              if (brakePointerId.current !== e.pointerId) return;
              brakePointerId.current = null;
              touchInputRef.current.brake = 0;
              setBrakePressed(false);
            }}
            onPointerCancel={() => {
              brakePointerId.current = null;
              touchInputRef.current.brake = 0;
              setBrakePressed(false);
            }}
            className={`flex h-24 w-18 flex-col items-center justify-between rounded-2xl border-2 p-2.5 transition-transform sm:h-28 sm:w-20 ${
              brakePressed
                ? 'translate-y-1 scale-95 border-rose-400 bg-rose-600/75 text-white'
                : 'border-rose-500/55 bg-[#090d16]/80 text-rose-200'
            }`}
          >
            <div className="flex w-full flex-col gap-1.5">
              <div className="h-1.5 w-full rounded bg-current opacity-40" />
              <div className="h-1.5 w-full rounded bg-current opacity-40" />
              <div className="h-1.5 w-full rounded bg-current opacity-40" />
            </div>
            <span className="text-[11px] font-black tracking-wider">TORMOZ</span>
          </button>

          <button
            type="button"
            aria-label="Gaz pedali"
            onPointerDown={(e) => {
              e.preventDefault();
              soundEngine.unlock();
              gasPointerId.current = e.pointerId;
              e.currentTarget.setPointerCapture(e.pointerId);
              touchInputRef.current.throttle = 1;
              setGasPressed(true);
            }}
            onPointerUp={(e) => {
              if (gasPointerId.current !== e.pointerId) return;
              gasPointerId.current = null;
              touchInputRef.current.throttle = 0;
              setGasPressed(false);
            }}
            onPointerCancel={() => {
              gasPointerId.current = null;
              touchInputRef.current.throttle = 0;
              setGasPressed(false);
            }}
            className={`flex h-28 w-18 flex-col items-center justify-between rounded-2xl border-2 p-2.5 transition-transform sm:h-32 sm:w-20 ${
              gasPressed
                ? 'translate-y-1 scale-95 border-emerald-400 bg-emerald-600/75 text-white'
                : 'border-emerald-500/55 bg-[#090d16]/80 text-emerald-200'
            }`}
          >
            <div className="flex w-full flex-col gap-1.5">
              <div className="h-1.5 w-full rounded bg-current opacity-45" />
              <div className="h-1.5 w-full rounded bg-current opacity-45" />
              <div className="h-1.5 w-full rounded bg-current opacity-45" />
              <div className="h-1.5 w-full rounded bg-current opacity-45" />
            </div>
            <span className="text-[11px] font-black tracking-wider">GAZ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
