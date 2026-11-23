import { useCallback, useEffect, useRef, useState } from 'react';
import { RotateCw, X } from 'lucide-react';
import { GameCanvas, TouchInputRef } from './components/GameCanvas';
import { GameHUD } from './components/GameHUD';
import { GarageModal } from './components/GarageModal';
import { MainMenu } from './components/MainMenu';
import { MissionsModal } from './components/MissionsModal';
import { PauseModal, ResultModal } from './components/PauseResultModal';
import { OfflineIndicator } from './components/PWAInstallButton';
import { SettingsModal } from './components/SettingsModal';
import { TouchControls } from './components/TouchControls';
import { PARKING_MISSIONS } from './data/gameData';
import { soundEngine } from './game/audio';
import {
  CameraMode,
  ControlScheme,
  GameMode,
  GarageAngle,
  GearMode,
  GraphicsQuality,
  HudSnapshot,
  MissionResult,
  SaveData,
  ScreenState,
  SoundSettings,
  VehicleId,
} from './types/game';
import { loadSaveData, persistSaveData } from './utils/storage';

const INITIAL_HUD: HudSnapshot = {
  speedKmh: 0,
  gear: 'D',
  rpmRatio: 0.12,
  steerNorm: 0,
  headlights: false,
  cameraMode: 0,
  elapsedSec: 0,
  timeRemainingSec: null,
  collisions: 0,
  score: 0,
  parkingAlignment: 0,
  parkingDistance: 0,
  parkingAngleOk: false,
  parkingHoldProgress: 0,
  parkingReverseWarning: false,
  checkpointIndex: 0,
  totalCheckpoints: 10,
  trafficSignalState: null,
  warningMessage: null,
};

export default function App() {
  const [saveData, setSaveData] = useState<SaveData>(() => loadSaveData());
  const [screen, setScreen] = useState<ScreenState>('menu');
  const [gameMode, setGameMode] = useState<GameMode>('parking');
  const [missionId, setMissionId] = useState<string>(PARKING_MISSIONS[0].id);
  const [cameraMode, setCameraMode] = useState<CameraMode>(0);
  const [headlights, setHeadlights] = useState<boolean>(false);
  const [garageAngle, setGarageAngle] = useState<GarageAngle>('front');
  const [gear, setGear] = useState<GearMode>('D');
  const [restartNonce, setRestartNonce] = useState<number>(0);
  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [missionResult, setMissionResult] = useState<MissionResult | null>(null);
  const [isPortraitMobile, setIsPortraitMobile] = useState(false);
  const [portraitDismissed, setPortraitDismissed] = useState(false);

  const touchInputRef = useRef<TouchInputRef>({
    steer: 0,
    throttle: 0,
    brake: 0,
    handbrake: false,
    gear: 'D',
    horn: false,
  });

  // Persist save data & sync sound settings
  useEffect(() => {
    persistSaveData(saveData);
    soundEngine.updateSettings(saveData.sound);
  }, [saveData]);

  // Orientation check for mobile portrait hint
  useEffect(() => {
    const check = () => {
      setIsPortraitMobile(window.innerHeight > window.innerWidth && window.innerWidth < 720);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const updateSave = useCallback((updater: (prev: SaveData) => SaveData) => {
    setSaveData((prev) => updater(prev));
  }, []);

  const startSession = useCallback((mode: GameMode, nextMissionId?: string) => {
    setGameMode(mode);
    if (nextMissionId) setMissionId(nextMissionId);
    touchInputRef.current.gear = 'D';
    touchInputRef.current.throttle = 0;
    touchInputRef.current.brake = 0;
    touchInputRef.current.steer = 0;
    touchInputRef.current.handbrake = false;
    setGear('D');
    setMissionResult(null);
    setRestartNonce((n) => n + 1);
    setScreen('playing');
  }, []);

  const handleMissionComplete = useCallback(
    (result: MissionResult) => {
      setMissionResult(result);
      setScreen('result');

      if (result.success) {
        updateSave((prev) => {
          const next = { ...prev, parkingProgress: { ...prev.parkingProgress } };
          if (result.mode === 'parking' && result.missionId) {
            const old = next.parkingProgress[result.missionId];
            next.parkingProgress[result.missionId] = {
              completed: true,
              bestTimeSec:
                old?.bestTimeSec != null
                  ? Math.min(old.bestTimeSec, result.timeSec)
                  : result.timeSec,
              bestScore: Math.max(old?.bestScore ?? 0, result.score),
              stars: Math.max(old?.stars ?? 0, result.stars),
            };
            next.totalStars = Object.values(next.parkingProgress).reduce(
              (acc, p) => acc + (p.stars || 0),
              0
            );
          } else if (result.mode === 'city') {
            next.cityBestScore = Math.max(next.cityBestScore, result.score);
          }
          return next;
        });
      }
    },
    [updateSave]
  );

  const handleToggleCamera = useCallback(() => {
    setCameraMode((prev) => ((prev + 1) % 4) as CameraMode);
  }, []);

  const handleToggleHeadlights = useCallback(() => {
    setHeadlights((h) => !h);
  }, []);

  const handleToggleSound = useCallback(() => {
    updateSave((prev) => ({
      ...prev,
      sound: { ...prev.sound, master: !prev.sound.master },
    }));
  }, [updateSave]);

  const handleCycleGraphics = useCallback(() => {
    updateSave((prev) => {
      const order: GraphicsQuality[] = ['low', 'medium', 'high'];
      const next = order[(order.indexOf(prev.graphics) + 1) % order.length];
      return { ...prev, graphics: next };
    });
  }, [updateSave]);

  const handleRestart = useCallback(() => {
    touchInputRef.current.gear = 'D';
    setGear('D');
    setMissionResult(null);
    setRestartNonce((n) => n + 1);
    setScreen('playing');
  }, []);

  const handlePauseToggle = useCallback(() => {
    setScreen((prev) => (prev === 'playing' ? 'paused' : prev === 'paused' ? 'playing' : prev));
  }, []);

  // Main menu Enter/Space quick-start
  useEffect(() => {
    if (screen !== 'menu') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        soundEngine.unlock();
        soundEngine.playClick();
        startSession(gameMode, missionId);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen, gameMode, missionId, startSession]);

  const currentMissionIdx = PARKING_MISSIONS.findIndex((m) => m.id === missionId);
  const hasNextMission =
    gameMode === 'parking' &&
    currentMissionIdx >= 0 &&
    currentMissionIdx + 1 < PARKING_MISSIONS.length;

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#090d16]">
      {/* Isolated 3D WebGL Canvas */}
      <GameCanvas
        screen={screen}
        vehicleId={saveData.selectedVehicle}
        colorId={saveData.selectedColor}
        graphics={saveData.graphics}
        gameMode={gameMode}
        missionId={missionId}
        cameraMode={cameraMode}
        headlights={headlights}
        garageAngle={garageAngle}
        restartNonce={restartNonce}
        touchInputRef={touchInputRef}
        onHudUpdate={setHud}
        onMissionComplete={handleMissionComplete}
        onToggleCamera={handleToggleCamera}
        onToggleHeadlights={handleToggleHeadlights}
        onGearChange={setGear}
        onPauseToggle={handlePauseToggle}
      />

      <OfflineIndicator />

      {/* Landscape Recommendation Banner for Portrait Smartphones */}
      {isPortraitMobile && !portraitDismissed && screen === 'playing' && (
        <div className="fixed top-14 left-1/2 z-50 flex w-[90%] max-w-sm -translate-x-1/2 items-center justify-between gap-2 rounded-xl border border-sky-400/70 bg-[#0d1422]/95 px-3.5 py-2 text-xs font-bold text-sky-100 shadow-2xl">
          <div className="flex items-center gap-2">
            <RotateCw className="h-4 w-4 shrink-0 text-sky-400" />
            <span>Qulay haydash uchun telefonni gorizontal (yonlama) holatga burang.</span>
          </div>
          <button
            type="button"
            onClick={() => setPortraitDismissed(true)}
            className="rounded-lg p-1 text-slate-400 hover:text-white"
            aria-label="Yopish"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* MAIN MENU */}
      {screen === 'menu' && (
        <MainMenu
          selectedVehicle={saveData.selectedVehicle}
          graphics={saveData.graphics}
          soundMuted={!saveData.sound.master}
          totalStars={saveData.totalStars}
          cityBestScore={saveData.cityBestScore}
          onPlayQuick={() => startSession('parking', PARKING_MISSIONS[0].id)}
          onOpenGarage={() => setScreen('garage')}
          onOpenModes={() => setScreen('modes')}
          onOpenSettings={() => setScreen('settings')}
          onCycleGraphics={handleCycleGraphics}
          onToggleSound={handleToggleSound}
        />
      )}

      {/* GARAGE */}
      {screen === 'garage' && (
        <GarageModal
          selectedVehicle={saveData.selectedVehicle}
          selectedColor={saveData.selectedColor}
          garageAngle={garageAngle}
          onSelectVehicle={(id: VehicleId) =>
            updateSave((prev) => ({ ...prev, selectedVehicle: id }))
          }
          onSelectColor={(colorId: string) =>
            updateSave((prev) => ({ ...prev, selectedColor: colorId }))
          }
          onSelectAngle={setGarageAngle}
          onDriveNow={() => startSession(gameMode, missionId)}
          onBack={() => setScreen('menu')}
        />
      )}

      {/* GAME MODES / MISSIONS */}
      {screen === 'modes' && (
        <MissionsModal
          parkingProgress={saveData.parkingProgress}
          cityBestScore={saveData.cityBestScore}
          onStartMode={(mode, mId) => startSession(mode, mId)}
          onBack={() => setScreen('menu')}
        />
      )}

      {/* SETTINGS */}
      {screen === 'settings' && (
        <SettingsModal
          graphics={saveData.graphics}
          controlScheme={saveData.controlScheme}
          sound={saveData.sound}
          onChangeGraphics={(q: GraphicsQuality) =>
            updateSave((prev) => ({ ...prev, graphics: q }))
          }
          onChangeControlScheme={(c: ControlScheme) =>
            updateSave((prev) => ({ ...prev, controlScheme: c }))
          }
          onChangeSound={(s: SoundSettings) =>
            updateSave((prev) => ({ ...prev, sound: s }))
          }
          onBack={() => setScreen('menu')}
        />
      )}

      {/* IN-GAME HUD & MULTI-TOUCH CONTROLS */}
      {screen === 'playing' && (
        <>
          <GameHUD
            gameMode={gameMode}
            missionId={missionId}
            hud={hud}
            soundMuted={!saveData.sound.master}
            onToggleCamera={handleToggleCamera}
            onToggleHeadlights={handleToggleHeadlights}
            onToggleSound={handleToggleSound}
            onRestart={handleRestart}
            onPause={() => setScreen('paused')}
            onHornChange={(active) => {
              touchInputRef.current.horn = active;
              soundEngine.setHorn(active);
            }}
          />
          <TouchControls
            controlScheme={saveData.controlScheme}
            gear={gear}
            onGearChange={setGear}
            touchInputRef={touchInputRef}
          />
        </>
      )}

      {/* PAUSE MODAL */}
      {screen === 'paused' && (
        <PauseModal
          onResume={() => setScreen('playing')}
          onRestart={handleRestart}
          onGarage={() => setScreen('garage')}
          onMainMenu={() => setScreen('menu')}
        />
      )}

      {/* RESULT MODAL */}
      {screen === 'result' && missionResult && (
        <ResultModal
          result={missionResult}
          hasNextMission={hasNextMission}
          onRetry={handleRestart}
          onNextMission={() => {
            if (hasNextMission) {
              startSession('parking', PARKING_MISSIONS[currentMissionIdx + 1].id);
            }
          }}
          onMainMenu={() => setScreen('menu')}
        />
      )}
    </div>
  );
}
