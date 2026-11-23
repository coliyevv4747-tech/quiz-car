import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import {
  CIRCUIT_WAYPOINTS,
  PARKING_MISSIONS,
  STREET_RACE_WAYPOINTS,
  VEHICLE_SPECS,
} from '../data/gameData';
import { AiRacerManager } from '../game/aiRacer';
import { soundEngine } from '../game/audio';
import { CameraController } from '../game/cameras';
import { buildCircuitEnvironment, CircuitEnvironment } from '../game/circuit';
import { buildCityEnvironment, CityEnvironment, ColliderBox } from '../game/city';
import { RacingEffects } from '../game/effects';
import {
  createCityDrivingVisuals,
  createParkingMissionVisuals,
  MissionSceneObjects,
} from '../game/missions';
import { VehicleInput, VehiclePhysics } from '../game/physics';
import { CityTextures, createCityTextures } from '../game/textures';
import { createVehicleModel, VehicleRig } from '../game/vehicles';
import {
  CameraMode,
  CarCustomization,
  GameMode,
  GarageAngle,
  GearMode,
  GraphicsQuality,
  HudSnapshot,
  MissionResult,
  RaceStanding,
  ScreenState,
  TimeOfDay,
  VehicleId,
} from '../types/game';

export interface TouchInputRef {
  steer: number;
  throttle: number;
  brake: number;
  handbrake: boolean;
  gear: GearMode;
  horn: boolean;
}

export interface GameCanvasProps {
  screen: ScreenState;
  vehicleId: VehicleId;
  customization: CarCustomization;
  graphics: GraphicsQuality;
  gameMode: GameMode;
  timeOfDay: TimeOfDay;
  autoTransmission: boolean;
  missionId: string;
  cameraMode: CameraMode;
  headlights: boolean;
  garageAngle: GarageAngle;
  restartNonce: number;
  touchInputRef: React.MutableRefObject<TouchInputRef>;
  onHudUpdate: (hud: HudSnapshot) => void;
  onMissionComplete: (result: MissionResult) => void;
  onToggleCamera: () => void;
  onToggleHeadlights: () => void;
  onGearChange: (gear: GearMode) => void;
  onGearUp: () => void;
  onGearDown: () => void;
  onPauseToggle: () => void;
}

const _camTarget = new THREE.Vector3();
const _camGoal = new THREE.Vector3();

function detectSoftwareWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  screen,
  vehicleId,
  customization,
  graphics,
  gameMode,
  timeOfDay,
  autoTransmission,
  missionId,
  cameraMode,
  headlights,
  garageAngle,
  restartNonce,
  touchInputRef,
  onHudUpdate,
  onMissionComplete,
  onToggleCamera,
  onToggleHeadlights,
  onGearChange,
  onGearUp,
  onGearDown,
  onPauseToggle,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  const propsRef = useRef({
    screen,
    vehicleId,
    customization,
    graphics,
    gameMode,
    timeOfDay,
    autoTransmission,
    missionId,
    cameraMode,
    headlights,
    garageAngle,
    restartNonce,
    onHudUpdate,
    onMissionComplete,
    onToggleCamera,
    onToggleHeadlights,
    onGearChange,
    onGearUp,
    onGearDown,
    onPauseToggle,
  });
  propsRef.current = {
    screen,
    vehicleId,
    customization,
    graphics,
    gameMode,
    timeOfDay,
    autoTransmission,
    missionId,
    cameraMode,
    headlights,
    garageAngle,
    restartNonce,
    onHudUpdate,
    onMissionComplete,
    onToggleCamera,
    onToggleHeadlights,
    onGearChange,
    onGearUp,
    onGearDown,
    onPauseToggle,
  };

  const orbitRef = useRef({
    azimuth: 0.65,
    elevation: 0.22,
    dragging: false,
    lastX: 0,
    lastY: 0,
    targetAzimuth: 0.65,
    targetElevation: 0.22,
    distance: 5.8,
    targetDistance: 5.8,
  });

  useEffect(() => {
    const o = orbitRef.current;
    if (garageAngle === 'front') {
      o.targetAzimuth = 0.45;
      o.targetElevation = 0.18;
      o.targetDistance = 5.4;
    } else if (garageAngle === 'side') {
      o.targetAzimuth = Math.PI * 0.5;
      o.targetElevation = 0.14;
      o.targetDistance = 5.8;
    } else if (garageAngle === 'rear') {
      o.targetAzimuth = Math.PI - 0.38;
      o.targetElevation = 0.20;
      o.targetDistance = 5.4;
    } else if (garageAngle === 'interior') {
      o.targetAzimuth = 0.0;
      o.targetElevation = 0.10;
      o.targetDistance = 2.3;
    }
  }, [garageAngle]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareWebGL();
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl && propsRef.current.graphics !== 'low',
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.shadowMap.enabled = !isSoftwareGl && propsRef.current.graphics !== 'low';
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const applyRendererQuality = (q: GraphicsQuality) => {
      if (isSoftwareGl || q === 'low') {
        renderer.setPixelRatio(1);
        renderer.shadowMap.enabled = false;
      } else if (q === 'medium') {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.shadowMap.enabled = true;
      } else {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
      }
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    applyRendererQuality(propsRef.current.graphics);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x9ec5e8);
    scene.fog = new THREE.FogExp2(0x9ec5e8, 0.0042);

    const camera = new THREE.PerspectiveCamera(
      62,
      Math.max(1, container.clientWidth) / Math.max(1, container.clientHeight),
      0.15,
      520
    );

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmremGenerator.dispose();

    const hemiLight = new THREE.HemisphereLight(0xcbe8ff, 0x3b4252, 0.72);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff4dc, 1.9);
    keyLight.position.set(42, 62, 34);
    keyLight.castShadow = !isSoftwareGl && propsRef.current.graphics !== 'low';
    keyLight.shadow.mapSize.set(
      propsRef.current.graphics === 'high' ? 2048 : 1024,
      propsRef.current.graphics === 'high' ? 2048 : 1024
    );
    const d = 42;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.camera.near = 2;
    keyLight.shadow.camera.far = 160;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.025;
    scene.add(keyLight, keyLight.target);

    const rimLight = new THREE.DirectionalLight(0x93c5fd, 0.58);
    rimLight.position.set(-45, 30, -40);
    scene.add(rimLight);

    let studioSoftbox: THREE.RectAreaLight | null = null;
    if (!isSoftwareGl) {
      RectAreaLightUniformsLib.init();
      studioSoftbox = new THREE.RectAreaLight(0xffffff, 2.4, 9, 4.5);
      studioSoftbox.position.set(0, 5.5, 24);
      studioSoftbox.lookAt(0, 0.8, 24);
      scene.add(studioSoftbox);
    }

    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const textures: CityTextures = createCityTextures(maxAniso);

    // Lazy Environment Slots (Only 1 environment loaded at a time!)
    let cityEnv: CityEnvironment | null = null;
    let circuitEnv: CircuitEnvironment | null = null;
    let activeEnvType: 'city' | 'circuit' | null = null;

    const ensureEnvironment = (needed: 'city' | 'circuit', q: GraphicsQuality, night: boolean) => {
      if (activeEnvType === needed) {
        if (cityEnv) cityEnv.setNightMode(night);
        return;
      }
      if (cityEnv) {
        scene.remove(cityEnv.group);
        cityEnv.dispose();
        cityEnv = null;
      }
      if (circuitEnv) {
        scene.remove(circuitEnv.group);
        circuitEnv.dispose();
        circuitEnv = null;
      }
      const shadows = !isSoftwareGl && q !== 'low';
      if (needed === 'circuit') {
        circuitEnv = buildCircuitEnvironment(textures, shadows, q);
        scene.add(circuitEnv.group);
      } else {
        cityEnv = buildCityEnvironment(textures, shadows, q);
        cityEnv.setNightMode(night);
        scene.add(cityEnv.group);
      }
      activeEnvType = needed;
    };

    const applyLightingTime = (night: boolean, neededEnv: 'city' | 'circuit') => {
      if (night && neededEnv === 'city') {
        scene.background = new THREE.Color(0x091124);
        (scene.fog as THREE.FogExp2).color.setHex(0x091124);
        (scene.fog as THREE.FogExp2).density = 0.0068;
        hemiLight.intensity = 0.35;
        keyLight.intensity = 0.45;
        keyLight.color.setHex(0x93c5fd);
        rimLight.intensity = 0.38;
        renderer.toneMappingExposure = 1.25;
      } else {
        scene.background = new THREE.Color(0x9ec5e8);
        (scene.fog as THREE.FogExp2).color.setHex(0x9ec5e8);
        (scene.fog as THREE.FogExp2).density = 0.0038;
        hemiLight.intensity = 0.72;
        keyLight.intensity = 1.9;
        keyLight.color.setHex(0xfff4dc);
        rimLight.intensity = 0.58;
        renderer.toneMappingExposure = 1.12;
      }
    };

    // Active Player Vehicle & Physics
    let currentVehicleId: VehicleId = propsRef.current.vehicleId;
    let currentCustomJson = JSON.stringify(propsRef.current.customization);
    let currentQuality: GraphicsQuality = propsRef.current.graphics;
    let currentTimeOfDay: TimeOfDay = propsRef.current.timeOfDay;

    let spec = VEHICLE_SPECS.find((v) => v.id === currentVehicleId) ?? VEHICLE_SPECS[0];
    let rig: VehicleRig = createVehicleModel(
      spec,
      propsRef.current.customization,
      textures,
      isSoftwareGl,
      !isSoftwareGl && currentQuality !== 'low'
    );
    scene.add(rig.root);

    const physics = new VehiclePhysics(spec, propsRef.current.customization, 0, 24, Math.PI * 0.12);
    const camCtrl = new CameraController();
    const effects = new RacingEffects(textures, currentQuality === 'low' ? 28 : 64);
    scene.add(effects.group);
    const aiManager = new AiRacerManager();
    scene.add(aiManager.group);

    // Session State
    let missionVisuals: MissionSceneObjects | null = null;
    let activeColliders: ColliderBox[] = [];
    let activeSessionKey = '';
    let sessionElapsed = 0;
    let raceElapsed = 0;
    let countdownTimer = 0;
    let countdownText: string | null = null;
    let collisions = 0;
    let lastCollisionTime = -10;
    let score = 1000;
    let parkingHoldSec = 0;
    let checkpointIdx = 0;
    let currentLap = 1;
    const TOTAL_LAPS = 3;
    let lapStartTime = 0;
    let bestLapTimeSec: number | null = null;
    let circuitSplineIdx = 0;
    let activeWarning: string | null = null;
    let warningTimer = 0;
    let missionEnded = false;
    let prevScreen: ScreenState = propsRef.current.screen;
    let prevHeadlights = propsRef.current.headlights;

    const triggerWarning = (msg: string, dur = 2.0) => {
      activeWarning = msg;
      warningTimer = dur;
    };

    const isShowcaseScreen = (s: ScreenState) =>
      s === 'menu' || s === 'cars' || s === 'garage' || s === 'tuning' || s === 'modes' || s === 'settings';

    const setupSession = () => {
      const p = propsRef.current;
      if (missionVisuals) {
        scene.remove(missionVisuals.group);
        missionVisuals.dispose();
        missionVisuals = null;
      }
      aiManager.dispose();
      effects.clear();

      sessionElapsed = 0;
      raceElapsed = 0;
      countdownTimer = 0;
      countdownText = null;
      collisions = 0;
      lastCollisionTime = -10;
      parkingHoldSec = 0;
      checkpointIdx = 0;
      currentLap = 1;
      lapStartTime = 0;
      bestLapTimeSec = null;
      circuitSplineIdx = 1;
      activeWarning = null;
      warningTimer = 0;
      missionEnded = false;

      const showcase = isShowcaseScreen(p.screen);
      const neededEnv: 'city' | 'circuit' =
        !showcase && (p.gameMode === 'circuit' || p.gameMode === 'timeattack') ? 'circuit' : 'city';

      ensureEnvironment(neededEnv, p.graphics, p.timeOfDay === 'night');
      applyLightingTime(p.timeOfDay === 'night', neededEnv);

      if (showcase) {
        physics.reset(0, 24, Math.PI * 0.14);
        rig.root.position.set(0, 0, 24);
        rig.root.rotation.y = Math.PI * 0.14;
        rig.chassisGroup.rotation.set(0, 0, 0);
        rig.frontLeftPivot.rotation.y = 0;
        rig.frontRightPivot.rotation.y = 0;
        activeColliders = cityEnv ? cityEnv.colliders : [];
        return;
      }

      if (p.gameMode === 'circuit' || p.gameMode === 'timeattack') {
        const cEnv = circuitEnv!;
        const s0 = cEnv.samples[0];
        const yaw = Math.atan2(s0.tangent.x, s0.tangent.z);

        if (p.gameMode === 'circuit') {
          // Player starts P4 on Grid, 3 AI Racers ahead
          const gx = s0.pos.x + s0.normal.x * 2.8 - s0.tangent.x * 21.6;
          const gz = s0.pos.z + s0.normal.z * 2.8 - s0.tangent.z * 21.6;
          physics.reset(gx, gz, yaw);
          aiManager.spawnRacers(
            true,
            cEnv.samples,
            textures,
            isSoftwareGl,
            !isSoftwareGl && p.graphics !== 'low'
          );
          countdownTimer = 3.5;
          cEnv.setStartLightState('red');
        } else {
          // Time Attack solo flying/grid start
          const gx = s0.pos.x - s0.tangent.x * 10;
          const gz = s0.pos.z - s0.tangent.z * 10;
          physics.reset(gx, gz, yaw);
          countdownTimer = 1.6;
          cEnv.setStartLightState('green');
        }

        missionVisuals = createCityDrivingVisuals(0x38bdf8);
        scene.add(missionVisuals.group);
        const cpPt = cEnv.samples[Math.floor((1 / CIRCUIT_WAYPOINTS.length) * cEnv.samples.length)].pos;
        missionVisuals.setCheckpointPosition(cpPt.x, cpPt.z);
        activeColliders = cEnv.colliders;
        score = 1000;
      } else if (p.gameMode === 'street') {
        // Street Racing in City against 3 AI opponents
        physics.reset(2.6, 40, Math.PI);
        aiManager.spawnRacers(
          false,
          [],
          textures,
          isSoftwareGl,
          !isSoftwareGl && p.graphics !== 'low'
        );
        aiManager.setHeadlights(p.timeOfDay === 'night' || p.headlights);
        missionVisuals = createCityDrivingVisuals(0xf97316);
        scene.add(missionVisuals.group);
        missionVisuals.setCheckpointPosition(STREET_RACE_WAYPOINTS[0].x, STREET_RACE_WAYPOINTS[0].z);
        activeColliders = cityEnv ? cityEnv.colliders : [];
        countdownTimer = 3.5;
        score = 1200;
      } else if (p.gameMode === 'parking') {
        const m = PARKING_MISSIONS.find((x) => x.id === p.missionId) ?? PARKING_MISSIONS[0];
        physics.reset(m.spawn.x, m.spawn.z, m.spawn.yaw);
        missionVisuals = createParkingMissionVisuals(
          m,
          textures,
          !isSoftwareGl && p.graphics !== 'low'
        );
        scene.add(missionVisuals.group);
        activeColliders = [...(cityEnv ? cityEnv.colliders : []), ...missionVisuals.colliders];
        score = 1000;
      } else {
        // Free drive
        physics.reset(0, 24, Math.PI);
        activeColliders = cityEnv ? cityEnv.colliders : [];
        score = 0;
      }

      rig.root.position.set(physics.state.x, 0, physics.state.z);
      rig.root.rotation.y = physics.state.yaw;
      rig.setHeadlights(p.headlights || p.timeOfDay === 'night');
      camCtrl.reset(rig, p.cameraMode, camera);
    };

    setupSession();

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Keyboard Support (cleared on blur)
    const keys = {
      up: false,
      down: false,
      left: false,
      right: false,
      handbrake: false,
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      soundEngine.unlock();
      const code = e.code;
      if (code === 'KeyW' || code === 'ArrowUp') keys.up = true;
      if (code === 'KeyS' || code === 'ArrowDown') keys.down = true;
      if (code === 'KeyA' || code === 'ArrowLeft') keys.left = true;
      if (code === 'KeyD' || code === 'ArrowRight') keys.right = true;
      if (code === 'Space') keys.handbrake = true;
      if (code === 'KeyH') soundEngine.setHorn(true);

      if (!e.repeat && propsRef.current.screen === 'playing') {
        if (code === 'KeyC') propsRef.current.onToggleCamera();
        if (code === 'KeyL') propsRef.current.onToggleHeadlights();
        if (code === 'KeyE') propsRef.current.onGearUp();
        if (code === 'KeyQ') propsRef.current.onGearDown();
        if (code === 'KeyR') {
          const cur = touchInputRef.current.gear;
          const next: GearMode = cur === 'R' ? '1' : 'R';
          touchInputRef.current.gear = next;
          propsRef.current.onGearChange(next);
          soundEngine.playGearShift();
        }
        if (code === 'Escape') propsRef.current.onPauseToggle();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const code = e.code;
      if (code === 'KeyW' || code === 'ArrowUp') keys.up = false;
      if (code === 'KeyS' || code === 'ArrowDown') keys.down = false;
      if (code === 'KeyA' || code === 'ArrowLeft') keys.left = false;
      if (code === 'KeyD' || code === 'ArrowRight') keys.right = false;
      if (code === 'Space') keys.handbrake = false;
      if (code === 'KeyH') soundEngine.setHorn(false);
    };

    const handleBlur = () => {
      keys.up = false;
      keys.down = false;
      keys.left = false;
      keys.right = false;
      keys.handbrake = false;
      touchInputRef.current.throttle = 0;
      touchInputRef.current.brake = 0;
      touchInputRef.current.steer = 0;
      touchInputRef.current.handbrake = false;
      soundEngine.setHorn(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    // Showcase Orbit Pointer Drag
    const domEl = renderer.domElement;
    const onPointerDown = (e: PointerEvent) => {
      soundEngine.unlock();
      if (isShowcaseScreen(propsRef.current.screen)) {
        orbitRef.current.dragging = true;
        orbitRef.current.lastX = e.clientX;
        orbitRef.current.lastY = e.clientY;
      }
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!orbitRef.current.dragging) return;
      const dx = e.clientX - orbitRef.current.lastX;
      const dy = e.clientY - orbitRef.current.lastY;
      orbitRef.current.lastX = e.clientX;
      orbitRef.current.lastY = e.clientY;
      orbitRef.current.targetAzimuth -= dx * 0.008;
      orbitRef.current.targetElevation = THREE.MathUtils.clamp(
        orbitRef.current.targetElevation + dy * 0.005,
        0.06,
        0.72
      );
    };
    const onPointerUp = () => {
      orbitRef.current.dragging = false;
    };

    domEl.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    const onResize = () => {
      const w = Math.max(1, container.clientWidth);
      const h = Math.max(1, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(container);
    window.addEventListener('resize', onResize);

    let frameId = 0;
    let disposed = false;
    let lastTimeMs = performance.now();
    let hudEmitTimer = 0;
    let totalClockSec = 0;
    let prevCountdownStep = -1;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) {
          if (sync) gl.deleteSync(sync);
          return;
        }
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const tick = () => {
      if (disposed) return;

      const nowMs = performance.now();
      const rawDt = (nowMs - lastTimeMs) * 0.001;
      lastTimeMs = nowMs;
      const dt = Math.min(Math.max(rawDt, 0.001), 0.05);
      totalClockSec += dt;

      const p = propsRef.current;
      const showcase = isShowcaseScreen(p.screen);

      // Sync vehicle change (lazy swap: disposes previous car geometry)
      if (p.vehicleId !== currentVehicleId) {
        currentVehicleId = p.vehicleId;
        currentCustomJson = JSON.stringify(p.customization);
        spec = VEHICLE_SPECS.find((v) => v.id === currentVehicleId) ?? VEHICLE_SPECS[0];
        scene.remove(rig.root);
        rig.dispose();
        rig = createVehicleModel(
          spec,
          p.customization,
          textures,
          isSoftwareGl,
          !isSoftwareGl && currentQuality !== 'low'
        );
        scene.add(rig.root);
        physics.setSpecAndCustom(spec, p.customization);
        rig.setHeadlights(p.headlights || p.timeOfDay === 'night');
        rig.root.position.set(physics.state.x, 0, physics.state.z);
        rig.root.rotation.y = physics.state.yaw;
      }

      // Sync customization & upgrades live
      const nextCustomJson = JSON.stringify(p.customization);
      if (nextCustomJson !== currentCustomJson) {
        currentCustomJson = nextCustomJson;
        rig.applyCustomization(p.customization);
        physics.setSpecAndCustom(spec, p.customization);
      }

      // Sync graphics quality
      if (p.graphics !== currentQuality) {
        currentQuality = p.graphics;
        applyRendererQuality(currentQuality);
        keyLight.castShadow = !isSoftwareGl && currentQuality !== 'low';
      }

      // Sync Time of Day
      if (p.timeOfDay !== currentTimeOfDay) {
        currentTimeOfDay = p.timeOfDay;
        const neededEnv =
          !showcase && (p.gameMode === 'circuit' || p.gameMode === 'timeattack') ? 'circuit' : 'city';
        if (cityEnv) cityEnv.setNightMode(currentTimeOfDay === 'night');
        applyLightingTime(currentTimeOfDay === 'night', neededEnv);
        rig.setHeadlights(p.headlights || currentTimeOfDay === 'night');
      }

      if (p.headlights !== prevHeadlights) {
        prevHeadlights = p.headlights;
        rig.setHeadlights(p.headlights || p.timeOfDay === 'night');
      }

      // Detect entering/restarting session
      const sessionKey = `${p.gameMode}:${p.missionId}:${p.restartNonce}`;
      const enteredPlaying = p.screen === 'playing' && isShowcaseScreen(prevScreen);
      if (enteredPlaying || (p.screen === 'playing' && sessionKey !== activeSessionKey)) {
        activeSessionKey = sessionKey;
        setupSession();
      }
      if (p.screen !== 'playing' && !showcase && (p.screen === 'menu' || p.screen === 'garage' || p.screen === 'cars' || p.screen === 'tuning')) {
        setupSession();
        soundEngine.setDrivingActive(false);
      }
      prevScreen = p.screen;

      if (cityEnv) {
        cityEnv.updateTrafficLights(totalClockSec);
      }

      if (showcase) {
        soundEngine.setDrivingActive(false);
        const o = orbitRef.current;
        if (p.screen === 'menu' && !o.dragging) {
          o.targetAzimuth += dt * 0.24;
          o.targetElevation = 0.20;
          o.targetDistance = 5.9;
        }
        o.azimuth = THREE.MathUtils.damp(o.azimuth, o.targetAzimuth, 8, dt);
        o.elevation = THREE.MathUtils.damp(o.elevation, o.targetElevation, 8, dt);
        o.distance = THREE.MathUtils.damp(o.distance, o.targetDistance, 8, dt);

        const carX = 0;
        const carZ = 24;
        rig.root.position.set(carX, 0, carZ);
        rig.root.rotation.y = Math.PI * 0.16;

        const rHoriz = Math.cos(o.elevation) * o.distance;
        const camY = 0.85 + Math.sin(o.elevation) * o.distance;
        _camGoal.set(
          carX + Math.sin(o.azimuth) * rHoriz,
          camY,
          carZ + Math.cos(o.azimuth) * rHoriz
        );
        _camTarget.set(carX, 0.72, carZ);
        camera.position.copy(_camGoal);
        camera.lookAt(_camTarget);

        keyLight.position.set(carX + 36, 54, carZ + 28);
        keyLight.target.position.set(carX, 0, carZ);
        if (studioSoftbox) studioSoftbox.visible = true;
      } else {
        if (studioSoftbox) studioSoftbox.visible = false;

        if (p.screen === 'playing' && !missionEnded) {
          soundEngine.setDrivingActive(true);
          sessionElapsed += dt;

          // Countdown logic
          let raceActive = true;
          if (countdownTimer > 0) {
            countdownTimer -= dt;
            raceActive = false;
            const step = Math.ceil(countdownTimer);
            if (step !== prevCountdownStep && step > 0 && step <= 3) {
              prevCountdownStep = step;
              soundEngine.playCheckpoint();
            }
            countdownText = countdownTimer > 0.4 ? String(Math.min(3, Math.ceil(countdownTimer))) : 'START!';
            if (countdownTimer <= 0) {
              countdownTimer = 0;
              countdownText = 'START!';
              circuitEnv?.setStartLightState('green');
              soundEngine.playSuccess();
            }
          } else {
            raceElapsed += dt;
            if (raceElapsed > 0.9) countdownText = null;
          }

          const tIn = touchInputRef.current;
          const kbThrottle = keys.up ? 1 : 0;
          const kbBrake = keys.down ? 1 : 0;
          const kbSteer = (keys.left ? 1 : 0) - (keys.right ? 1 : 0);

          const combinedInput: VehicleInput = {
            throttle: raceActive ? Math.max(tIn.throttle, kbThrottle) : 0,
            brake: raceActive ? Math.max(tIn.brake, kbBrake) : 1,
            steer: raceActive ? (Math.abs(tIn.steer) > 0.05 ? tIn.steer : kbSteer) : 0,
            handbrake: tIn.handbrake || keys.handbrake,
            gear: tIn.gear,
            autoTransmission: p.autoTransmission,
          };

          const trackConstrain =
            (p.gameMode === 'circuit' || p.gameMode === 'timeattack') && circuitEnv
              ? circuitEnv.constrainToTrack
              : undefined;

          const { collisionIntensity, gearChangedTo } = physics.step(
            dt,
            combinedInput,
            activeColliders,
            rig,
            trackConstrain
          );

          if (gearChangedTo && gearChangedTo !== tIn.gear && p.autoTransmission) {
            tIn.gear = gearChangedTo;
            p.onGearChange(gearChangedTo);
          }

          // Update AI Opponents & Car-to-Car Collisions
          if (p.gameMode === 'circuit' || p.gameMode === 'street') {
            aiManager.update(
              dt,
              raceActive,
              p.gameMode === 'circuit' ? TOTAL_LAPS : 1,
              raceElapsed,
              physics.state.x,
              physics.state.z
            );
            const aiCol = aiManager.resolvePlayerCollisions(
              physics.state.x,
              physics.state.z,
              physics.state.vx,
              physics.state.vz
            );
            if (aiCol.impact > 0.05) {
              physics.state.x = aiCol.x;
              physics.state.z = aiCol.z;
              physics.state.vx = aiCol.vx;
              physics.state.vz = aiCol.vz;
              camCtrl.addShake(aiCol.impact * 0.25);
              soundEngine.playCollision(aiCol.impact);
            }
          }

          if (collisionIntensity > 0.05) {
            camCtrl.addShake(collisionIntensity * 0.28);
            soundEngine.playCollision(collisionIntensity);
            if (sessionElapsed - lastCollisionTime > 0.8) {
              collisions += 1;
              lastCollisionTime = sessionElapsed;
              score = Math.max(0, score - 100);
              triggerWarning("To'qnashuv! (-100 ball)", 1.5);
            }
          }

          // Tire Smoke & Skid Marks
          effects.update(
            dt,
            physics.state.x,
            physics.state.z,
            physics.state.yaw,
            physics.state.vx,
            physics.state.vz,
            -spec.wheelBase * 0.48,
            spec.trackWidth * 0.5,
            physics.state.driftIntensity
          );

          soundEngine.updateEngine(
            physics.state.rpmRatio,
            raceActive ? Math.max(tIn.throttle, kbThrottle) : Math.max(tIn.throttle, kbThrottle) * 0.7,
            physics.state.skidAmount
          );

          keyLight.position.set(physics.state.x + 36, 58, physics.state.z + 28);
          keyLight.target.position.set(physics.state.x, 0, physics.state.z);

          if (warningTimer > 0) {
            warningTimer -= dt;
            if (warningTimer <= 0) activeWarning = null;
          }

          const speedKmh = Math.abs(physics.state.forwardSpeed) * 3.6;

          // Mode-specific race/mission progress
          let parkAlign = 0;
          let parkDist = 0;
          let parkAngleOk = false;
          let parkRevWarn = false;
          let timeRemaining: number | null = null;
          let raceProgress = 0;
          let position = 1;
          let totalRacers = 1;

          if ((p.gameMode === 'circuit' || p.gameMode === 'timeattack') && circuitEnv) {
            const samples = circuitEnv.samples;
            const len = samples.length;
            let bestIdx = circuitSplineIdx;
            let bestD2 = Infinity;
            for (let i = 0; i < len; i++) {
              const sp = samples[i].pos;
              const d2 = (physics.state.x - sp.x) ** 2 + (physics.state.z - sp.z) ** 2;
              if (d2 < bestD2) {
                bestD2 = d2;
                bestIdx = i;
              }
            }

            // Detect finish-line crossing (wrapped from last 15% to first 15%)
            if (circuitSplineIdx > len * 0.82 && bestIdx < len * 0.18) {
              const lapDur = raceElapsed - lapStartTime;
              lapStartTime = raceElapsed;
              if (lapDur > 10 && (bestLapTimeSec === null || lapDur < bestLapTimeSec)) {
                bestLapTimeSec = lapDur;
              }
              soundEngine.playCheckpoint();

              if (p.gameMode === 'circuit') {
                if (currentLap < TOTAL_LAPS) {
                  currentLap += 1;
                  triggerWarning(`Aylana ${currentLap} / ${TOTAL_LAPS}!`, 1.8);
                } else if (!missionEnded) {
                  missionEnded = true;
                  soundEngine.setDrivingActive(false);
                  soundEngine.playSuccess();

                  const playerTotalProg = TOTAL_LAPS;
                  const standings: RaceStanding[] = [
                    {
                      name: 'Siz',
                      isPlayer: true,
                      vehicleName: spec.name,
                      position: 1,
                      finishTimeSec: Number(raceElapsed.toFixed(2)),
                    },
                    ...aiManager.racers.map((r) => ({
                      name: r.name,
                      isPlayer: false,
                      vehicleName: r.vehicleName,
                      position: 1,
                      finishTimeSec: r.finishTimeSec
                        ? Number(r.finishTimeSec.toFixed(2))
                        : Number((raceElapsed + (TOTAL_LAPS - r.progress) * 32).toFixed(2)),
                    })),
                  ].sort((a, b) => (a.finishTimeSec ?? 9999) - (b.finishTimeSec ?? 9999));
                  standings.forEach((s, idx) => (s.position = idx + 1));
                  const pPos = standings.find((s) => s.isPlayer)?.position ?? 1;

                  p.onMissionComplete({
                    success: pPos <= 3,
                    mode: 'circuit',
                    missionTitle: "O'zbekiston Xalqaro Avtodromi",
                    score: Math.max(200, (5 - pPos) * 500 - collisions * 80),
                    stars: pPos === 1 ? 3 : pPos === 2 ? 2 : 1,
                    timeSec: Math.round(raceElapsed),
                    bestLapSec: bestLapTimeSec ? Number(bestLapTimeSec.toFixed(2)) : null,
                    position: pPos,
                    totalRacers: 4,
                    standings,
                    collisions,
                    reason:
                      pPos === 1
                        ? "1-o'rin! Chempionlik g'alabasi!"
                        : `${pPos}-o'rin bilan marraga yetib keldingiz!`,
                  });
                }
              } else {
                // Time Attack: finish after 2 timed laps or update best lap
                if (currentLap < 2) {
                  currentLap += 1;
                  triggerWarning(`2-Aylana! Eng yaxshi: ${bestLapTimeSec?.toFixed(1)}s`, 2.0);
                } else if (!missionEnded) {
                  missionEnded = true;
                  soundEngine.setDrivingActive(false);
                  soundEngine.playSuccess();
                  const best = bestLapTimeSec ?? raceElapsed;
                  p.onMissionComplete({
                    success: true,
                    mode: 'timeattack',
                    missionTitle: 'Vaqtga Qarshi Poyga',
                    score: Math.max(500, Math.round(2800 - best * 15)),
                    stars: best < 42 ? 3 : best < 55 ? 2 : 1,
                    timeSec: Math.round(raceElapsed),
                    bestLapSec: Number(best.toFixed(2)),
                    collisions,
                    reason: `Eng yaxshi aylana vaqti: ${best.toFixed(2)} soniya!`,
                  });
                }
              }
            }
            circuitSplineIdx = bestIdx;

            // Update next visual beacon ahead along track
            const beaconIdx = (bestIdx + 22) % len;
            missionVisuals?.setCheckpointPosition(samples[beaconIdx].pos.x, samples[beaconIdx].pos.z);
            missionVisuals?.updateVisuals(totalClockSec, false, 0);

            const playerProgress = (currentLap - 1) + bestIdx / len;
            raceProgress = Math.min(1, playerProgress / (p.gameMode === 'circuit' ? TOTAL_LAPS : 2));

            if (p.gameMode === 'circuit') {
              totalRacers = aiManager.racers.length + 1;
              let aheadCount = 0;
              for (const r of aiManager.racers) {
                if (r.progress > playerProgress) aheadCount += 1;
              }
              position = aheadCount + 1;
            }
          } else if (p.gameMode === 'street') {
            totalRacers = aiManager.racers.length + 1;
            const cp = STREET_RACE_WAYPOINTS[checkpointIdx];
            if (cp) {
              const dx = physics.state.x - cp.x;
              const dz = physics.state.z - cp.z;
              if (dx * dx + dz * dz < 6.5 * 6.5) {
                soundEngine.playCheckpoint();
                score += 150;
                checkpointIdx += 1;
                if (checkpointIdx >= STREET_RACE_WAYPOINTS.length) {
                  missionEnded = true;
                  soundEngine.setDrivingActive(false);
                  soundEngine.playSuccess();

                  const standings: RaceStanding[] = [
                    {
                      name: 'Siz',
                      isPlayer: true,
                      vehicleName: spec.name,
                      position: 1,
                      finishTimeSec: Number(raceElapsed.toFixed(2)),
                    },
                    ...aiManager.racers.map((r) => ({
                      name: r.name,
                      isPlayer: false,
                      vehicleName: r.vehicleName,
                      position: 1,
                      finishTimeSec: r.finishTimeSec
                        ? Number(r.finishTimeSec.toFixed(2))
                        : Number((raceElapsed + (1 - r.progress) * 40).toFixed(2)),
                    })),
                  ].sort((a, b) => (a.finishTimeSec ?? 9999) - (b.finishTimeSec ?? 9999));
                  standings.forEach((s, idx) => (s.position = idx + 1));
                  const pPos = standings.find((s) => s.isPlayer)?.position ?? 1;

                  p.onMissionComplete({
                    success: true,
                    mode: 'street',
                    missionTitle: "Toshkent Ko'cha Poygasi",
                    score: Math.max(300, score + (5 - pPos) * 400),
                    stars: pPos === 1 ? 3 : pPos === 2 ? 2 : 1,
                    timeSec: Math.round(raceElapsed),
                    position: pPos,
                    totalRacers: 4,
                    standings,
                    collisions,
                    reason:
                      pPos === 1
                        ? "Ko'cha poygasida mutlaq g'olib bo'ldingiz!"
                        : `${pPos}-o'rin bilan marraga yetib keldingiz!`,
                  });
                } else {
                  const nextCp = STREET_RACE_WAYPOINTS[checkpointIdx];
                  missionVisuals?.setCheckpointPosition(nextCp.x, nextCp.z);
                }
              }
            }
            missionVisuals?.updateVisuals(totalClockSec, false, 0);

            const playerProg = checkpointIdx / STREET_RACE_WAYPOINTS.length;
            raceProgress = playerProg;
            let ahead = 0;
            for (const r of aiManager.racers) {
              if (r.progress > playerProg) ahead += 1;
            }
            position = ahead + 1;
          } else if (p.gameMode === 'parking') {
            const m = PARKING_MISSIONS.find((x) => x.id === p.missionId) ?? PARKING_MISSIONS[0];
            timeRemaining = Math.max(0, m.timeLimitSec - sessionElapsed);
            const dx = physics.state.x - m.target.x;
            const dz = physics.state.z - m.target.z;
            parkDist = Math.sqrt(dx * dx + dz * dz);

            const dot =
              Math.sin(physics.state.yaw) * Math.sin(m.target.yaw) +
              Math.cos(physics.state.yaw) * Math.cos(m.target.yaw);
            parkAngleOk = Math.abs(dot) > 0.96;
            parkAlign = Math.max(0, Math.min(1, 1 - parkDist / 6)) * 0.5 + Math.abs(dot) * 0.5;
            if (m.target.requireReverse && parkDist < 4.5 && tIn.gear !== 'R' && speedKmh > 2) {
              parkRevWarn = true;
            }

            const insideBay = parkDist < 1.2 && parkAngleOk;
            const isStopped = speedKmh < 1.8;
            if (missionVisuals) {
              missionVisuals.updateVisuals(totalClockSec, insideBay, parkDist);
              missionVisuals.setParkingBayColor(
                insideBay ? 'aligned' : parkDist < 6.0 ? 'close' : 'far'
              );
            }

            if (insideBay && isStopped) {
              parkingHoldSec += dt;
              if (parkingHoldSec >= 1.1) {
                missionEnded = true;
                soundEngine.setDrivingActive(false);
                soundEngine.playSuccess();
                const finalScore = Math.max(100, score + Math.round(timeRemaining * 8));
                const stars =
                  collisions === 0 && timeRemaining > m.timeLimitSec * 0.35
                    ? 3
                    : collisions <= 1
                    ? 2
                    : 1;
                p.onMissionComplete({
                  success: true,
                  mode: 'parking',
                  missionTitle: m.title,
                  missionId: m.id,
                  score: finalScore,
                  stars,
                  timeSec: Math.round(sessionElapsed),
                  collisions,
                  reason: 'Avtomobil mukammal parkovka qilindi!',
                });
              }
            } else {
              parkingHoldSec = Math.max(0, parkingHoldSec - dt * 1.5);
            }

            if (timeRemaining <= 0 && !missionEnded) {
              missionEnded = true;
              soundEngine.setDrivingActive(false);
              p.onMissionComplete({
                success: false,
                mode: 'parking',
                missionTitle: m.title,
                missionId: m.id,
                score: 0,
                stars: 0,
                timeSec: m.timeLimitSec,
                collisions,
                reason: "Vaqt tugadi! Qaytadan urinib ko'ring.",
              });
            }
          }

          hudEmitTimer += dt;
          if (hudEmitTimer >= 0.05) {
            hudEmitTimer = 0;
            p.onHudUpdate({
              speedKmh: Math.round(speedKmh),
              gear: physics.state.activeGear,
              rpmRatio: physics.state.rpmRatio,
              steerNorm: physics.state.steerAngle / spec.maxSteerAngle,
              headlights: p.headlights || p.timeOfDay === 'night',
              cameraMode: p.cameraMode,
              elapsedSec: Math.round(raceElapsed),
              currentLapTimeSec: Number((raceElapsed - lapStartTime).toFixed(1)),
              bestLapTimeSec: bestLapTimeSec ? Number(bestLapTimeSec.toFixed(2)) : null,
              lap: currentLap,
              totalLaps: p.gameMode === 'circuit' ? TOTAL_LAPS : p.gameMode === 'timeattack' ? 2 : 1,
              position,
              totalRacers,
              countdownText,
              raceProgress,
              isDrifting: physics.state.driftIntensity > 0.35,
              timeRemainingSec: timeRemaining !== null ? Math.ceil(timeRemaining) : null,
              collisions,
              score,
              parkingAlignment: parkAlign,
              parkingDistance: Number(parkDist.toFixed(1)),
              parkingAngleOk: parkAngleOk,
              parkingHoldProgress: Math.min(1, parkingHoldSec / 1.1),
              parkingReverseWarning: parkRevWarn,
              checkpointIndex: checkpointIdx,
              totalCheckpoints: STREET_RACE_WAYPOINTS.length,
              warningMessage: activeWarning,
            });
          }
        } else {
          soundEngine.setDrivingActive(false);
        }

        camCtrl.update(
          camera,
          rig,
          p.cameraMode,
          dt,
          physics.state.forwardSpeed,
          physics.state.lateralSpeed
        );
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) afterDraw(tick);
      else frameId = requestAnimationFrame(tick);
    };

    if (isSoftwareGl) afterDraw(tick);
    else frameId = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      soundEngine.setDrivingActive(false);
      soundEngine.setHorn(false);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      domEl.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', onResize);
      resizeObserver.disconnect();
      if (missionVisuals) missionVisuals.dispose();
      aiManager.dispose();
      effects.dispose();
      if (cityEnv) cityEnv.dispose();
      if (circuitEnv) circuitEnv.dispose();
      rig.dispose();
      textures.dispose();
      envTex.dispose();
      renderer.dispose();
      if (domEl.parentNode === container) container.removeChild(domEl);
    };
  }, [touchInputRef]);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 w-full h-full overflow-hidden"
      style={{ touchAction: 'none' }}
    />
  );
};
