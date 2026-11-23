import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import {
  CITY_CHECKPOINTS,
  PARKING_MISSIONS,
  VEHICLE_SPECS,
} from '../data/gameData';
import { soundEngine } from '../game/audio';
import { CameraController } from '../game/cameras';
import { buildCityEnvironment, CityEnvironment, ColliderBox } from '../game/city';
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
  GameMode,
  GarageAngle,
  GearMode,
  GraphicsQuality,
  HudSnapshot,
  MissionResult,
  ScreenState,
  VehicleId,
} from '../types/game';

export interface TouchInputRef {
  steer: number; // -1..1
  throttle: number; // 0..1
  brake: number; // 0..1
  handbrake: boolean;
  gear: GearMode;
  horn: boolean;
}

export interface GameCanvasProps {
  screen: ScreenState;
  vehicleId: VehicleId;
  colorId: string;
  graphics: GraphicsQuality;
  gameMode: GameMode;
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
  colorId,
  graphics,
  gameMode,
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
  onPauseToggle,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // Latest props in refs so the WebGL loop never tears down on UI updates
  const propsRef = useRef({
    screen,
    vehicleId,
    colorId,
    graphics,
    gameMode,
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
    onPauseToggle,
  });
  propsRef.current = {
    screen,
    vehicleId,
    colorId,
    graphics,
    gameMode,
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
    onPauseToggle,
  };

  // Drag orbit state for Garage / Menu inspection
  const orbitRef = useRef({
    azimuth: 0.65,
    elevation: 0.24,
    dragging: false,
    lastX: 0,
    lastY: 0,
    targetAzimuth: 0.65,
    targetElevation: 0.24,
    distance: 6.4,
    targetDistance: 6.4,
  });

  // Update orbit target when garageAngle changes
  useEffect(() => {
    const o = orbitRef.current;
    if (garageAngle === 'front') {
      o.targetAzimuth = 0.42;
      o.targetElevation = 0.20;
      o.targetDistance = 5.8;
    } else if (garageAngle === 'side') {
      o.targetAzimuth = Math.PI * 0.5;
      o.targetElevation = 0.16;
      o.targetDistance = 6.2;
    } else if (garageAngle === 'rear') {
      o.targetAzimuth = Math.PI - 0.38;
      o.targetElevation = 0.22;
      o.targetDistance = 5.8;
    } else if (garageAngle === 'interior') {
      o.targetAzimuth = 0.0;
      o.targetElevation = 0.10;
      o.targetDistance = 2.4;
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
      if (isSoftwareGl) {
        renderer.setPixelRatio(1);
        renderer.shadowMap.enabled = false;
      } else if (q === 'low') {
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
    scene.fog = new THREE.FogExp2(0x9ec5e8, 0.0052);

    const camera = new THREE.PerspectiveCamera(
      62,
      Math.max(1, container.clientWidth) / Math.max(1, container.clientHeight),
      0.15,
      450
    );

    // Studio Environment Reflection (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmremGenerator.dispose();

    // Balanced 3-Point Outdoor + Studio Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0xcbe8ff, 0x3b4252, 0.72);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff4dc, 1.85);
    keyLight.position.set(36, 54, 28);
    keyLight.castShadow = !isSoftwareGl && propsRef.current.graphics !== 'low';
    keyLight.shadow.mapSize.set(
      propsRef.current.graphics === 'high' ? 2048 : 1024,
      propsRef.current.graphics === 'high' ? 2048 : 1024
    );
    const d = 38;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.camera.near = 2;
    keyLight.shadow.camera.far = 140;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.025;
    scene.add(keyLight, keyLight.target);

    const rimLight = new THREE.DirectionalLight(0x93c5fd, 0.55);
    rimLight.position.set(-40, 28, -36);
    scene.add(rimLight);

    // Studio Softbox RectAreaLight for Garage / Menu reflections (skipped on software WebGL)
    let studioSoftbox: THREE.RectAreaLight | null = null;
    if (!isSoftwareGl) {
      RectAreaLightUniformsLib.init();
      studioSoftbox = new THREE.RectAreaLight(0xffffff, 2.2, 8, 4);
      studioSoftbox.position.set(0, 5.5, 24);
      studioSoftbox.lookAt(0, 0.8, 24);
      scene.add(studioSoftbox);
    }

    // Procedural Textures & City
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const textures: CityTextures = createCityTextures(maxAniso);
    let cityEnv: CityEnvironment = buildCityEnvironment(
      textures,
      !isSoftwareGl && propsRef.current.graphics !== 'low',
      propsRef.current.graphics
    );
    scene.add(cityEnv.group);

    // Active Vehicle Rig & Physics
    let currentVehicleId: VehicleId = propsRef.current.vehicleId;
    let currentColorId: string = propsRef.current.colorId;
    let currentQuality: GraphicsQuality = propsRef.current.graphics;
    let spec = VEHICLE_SPECS.find((v) => v.id === currentVehicleId) ?? VEHICLE_SPECS[0];
    let rig: VehicleRig = createVehicleModel(
      spec,
      currentColorId,
      textures,
      isSoftwareGl,
      !isSoftwareGl && currentQuality !== 'low'
    );
    scene.add(rig.root);

    const physics = new VehiclePhysics(spec, 0, 24, Math.PI);
    const camCtrl = new CameraController();

    // Mission State
    let missionVisuals: MissionSceneObjects | null = null;
    let activeColliders: ColliderBox[] = cityEnv.colliders;
    let activeSessionKey = '';
    let sessionElapsed = 0;
    let collisions = 0;
    let lastCollisionTime = -10;
    let score = 1000;
    let parkingHoldSec = 0;
    let checkpointIdx = 0;
    let passedRedPenaltyCooldown = 0;
    let activeWarning: string | null = null;
    let warningTimer = 0;
    let missionEnded = false;
    let prevScreen: ScreenState = propsRef.current.screen;
    let prevHeadlights = propsRef.current.headlights;

    const triggerWarning = (msg: string, dur = 2.2) => {
      activeWarning = msg;
      warningTimer = dur;
    };

    const setupMissionOrFreeDrive = () => {
      const p = propsRef.current;
      if (missionVisuals) {
        scene.remove(missionVisuals.group);
        missionVisuals.dispose();
        missionVisuals = null;
      }

      sessionElapsed = 0;
      collisions = 0;
      lastCollisionTime = -10;
      parkingHoldSec = 0;
      checkpointIdx = 0;
      passedRedPenaltyCooldown = 0;
      activeWarning = null;
      warningTimer = 0;
      missionEnded = false;

      if (p.screen !== 'playing' && p.screen !== 'paused' && p.screen !== 'result') {
        // Showcase position on Mustaqillik Boulevard
        physics.reset(0, 24, Math.PI * 0.12);
        rig.root.position.set(0, 0, 24);
        rig.root.rotation.y = Math.PI * 0.12;
        rig.chassisGroup.rotation.set(0, 0, 0);
        rig.frontLeftPivot.rotation.y = 0;
        rig.frontRightPivot.rotation.y = 0;
        activeColliders = cityEnv.colliders;
        return;
      }

      if (p.gameMode === 'parking') {
        const m = PARKING_MISSIONS.find((x) => x.id === p.missionId) ?? PARKING_MISSIONS[0];
        physics.reset(m.spawn.x, m.spawn.z, m.spawn.yaw);
        missionVisuals = createParkingMissionVisuals(
          m,
          textures,
          !isSoftwareGl && p.graphics !== 'low'
        );
        scene.add(missionVisuals.group);
        activeColliders = [...cityEnv.colliders, ...missionVisuals.colliders];
        score = 1000;
      } else if (p.gameMode === 'city') {
        physics.reset(0, 12, Math.PI); // Facing north toward central intersection
        missionVisuals = createCityDrivingVisuals();
        scene.add(missionVisuals.group);
        const first = CITY_CHECKPOINTS[0];
        missionVisuals.setCheckpointPosition(first.x, first.z);
        activeColliders = cityEnv.colliders;
        score = 1000;
      } else {
        // Free drive
        physics.reset(0, 24, Math.PI);
        activeColliders = cityEnv.colliders;
        score = 0;
      }

      rig.root.position.set(physics.state.x, 0, physics.state.z);
      rig.root.rotation.y = physics.state.yaw;
      camCtrl.reset(rig, p.cameraMode, camera);
    };

    setupMissionOrFreeDrive();

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Keyboard Input State (held vs edge-triggered, cleared on blur)
    const keys = {
      up: false,
      down: false,
      left: false,
      right: false,
      handbrake: false,
      horn: false,
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      soundEngine.unlock();
      const code = e.code;
      if (code === 'KeyW' || code === 'ArrowUp') keys.up = true;
      if (code === 'KeyS' || code === 'ArrowDown') keys.down = true;
      if (code === 'KeyA' || code === 'ArrowLeft') keys.left = true;
      if (code === 'KeyD' || code === 'ArrowRight') keys.right = true;
      if (code === 'Space') keys.handbrake = true;
      if (code === 'KeyH') {
        keys.horn = true;
        soundEngine.setHorn(true);
      }

      if (!e.repeat && propsRef.current.screen === 'playing') {
        if (code === 'KeyC') propsRef.current.onToggleCamera();
        if (code === 'KeyL') propsRef.current.onToggleHeadlights();
        if (code === 'KeyR') {
          const cur = touchInputRef.current.gear;
          const next: GearMode = cur === 'R' ? 'D' : 'R';
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
      if (code === 'KeyH') {
        keys.horn = false;
        soundEngine.setHorn(false);
      }
    };

    const handleBlur = () => {
      keys.up = false;
      keys.down = false;
      keys.left = false;
      keys.right = false;
      keys.handbrake = false;
      keys.horn = false;
      touchInputRef.current.throttle = 0;
      touchInputRef.current.brake = 0;
      touchInputRef.current.steer = 0;
      touchInputRef.current.handbrake = false;
      soundEngine.setHorn(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    // Garage / Menu Pointer Orbit Drag on Canvas
    const domEl = renderer.domElement;
    const onPointerDown = (e: PointerEvent) => {
      soundEngine.unlock();
      if (propsRef.current.screen === 'garage' || propsRef.current.screen === 'menu') {
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
        0.08,
        0.75
      );
    };
    const onPointerUp = () => {
      orbitRef.current.dragging = false;
    };

    domEl.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // ResizeObserver for crisp mobile / orientation changes
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

    // Render loop with Software WebGL pacing
    let frameId = 0;
    let disposed = false;
    let lastTimeMs = performance.now();
    let hudEmitTimer = 0;
    let totalClockSec = 0;

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

      // Sync vehicle model change
      if (p.vehicleId !== currentVehicleId) {
        currentVehicleId = p.vehicleId;
        spec = VEHICLE_SPECS.find((v) => v.id === currentVehicleId) ?? VEHICLE_SPECS[0];
        scene.remove(rig.root);
        rig.dispose();
        rig = createVehicleModel(
          spec,
          p.colorId,
          textures,
          isSoftwareGl,
          !isSoftwareGl && currentQuality !== 'low'
        );
        scene.add(rig.root);
        physics.setSpec(spec);
        rig.setHeadlights(p.headlights);
        rig.root.position.set(physics.state.x, 0, physics.state.z);
        rig.root.rotation.y = physics.state.yaw;
      }

      // Sync color change
      if (p.colorId !== currentColorId) {
        currentColorId = p.colorId;
        rig.setBodyColor(currentColorId);
      }

      // Sync graphics quality change
      if (p.graphics !== currentQuality) {
        currentQuality = p.graphics;
        applyRendererQuality(currentQuality);
        keyLight.castShadow = !isSoftwareGl && currentQuality !== 'low';
      }

      // Sync headlights
      if (p.headlights !== prevHeadlights) {
        prevHeadlights = p.headlights;
        rig.setHeadlights(p.headlights);
      }

      // Detect entering/restarting gameplay session
      const sessionKey = `${p.gameMode}:${p.missionId}:${p.restartNonce}`;
      const enteredPlaying =
        p.screen === 'playing' &&
        (prevScreen === 'menu' || prevScreen === 'garage' || prevScreen === 'modes' || prevScreen === 'settings');
      if (enteredPlaying || (p.screen === 'playing' && sessionKey !== activeSessionKey)) {
        activeSessionKey = sessionKey;
        setupMissionOrFreeDrive();
      }
      if (p.screen !== 'playing' && (prevScreen === 'playing' || prevScreen === 'paused' || prevScreen === 'result')) {
        if (p.screen === 'menu' || p.screen === 'garage') {
          setupMissionOrFreeDrive();
          soundEngine.setDrivingActive(false);
        }
      }
      prevScreen = p.screen;

      // Update Traffic Lights in City
      cityEnv.updateTrafficLights(totalClockSec);

      // Update Showcase / Menu / Garage OR Gameplay
      const isShowcase =
        p.screen === 'menu' || p.screen === 'garage' || p.screen === 'modes' || p.screen === 'settings';

      if (isShowcase) {
        soundEngine.setDrivingActive(false);
        const o = orbitRef.current;
        if (p.screen === 'menu' && !o.dragging) {
          o.targetAzimuth += dt * 0.22;
          o.targetElevation = 0.22;
          o.targetDistance = 6.5;
        }
        o.azimuth = THREE.MathUtils.damp(o.azimuth, o.targetAzimuth, 8, dt);
        o.elevation = THREE.MathUtils.damp(o.elevation, o.targetElevation, 8, dt);
        o.distance = THREE.MathUtils.damp(o.distance, o.targetDistance, 8, dt);

        const carX = 0;
        const carZ = 24;
        rig.root.position.set(carX, 0, carZ);
        rig.root.rotation.y = Math.PI * 0.15;

        const rHoriz = Math.cos(o.elevation) * o.distance;
        const camY = 0.9 + Math.sin(o.elevation) * o.distance;
        _camGoal.set(
          carX + Math.sin(o.azimuth) * rHoriz,
          camY,
          carZ + Math.cos(o.azimuth) * rHoriz
        );
        _camTarget.set(carX, 0.78, carZ);
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

          // Combine Touch + Keyboard inputs
          const tIn = touchInputRef.current;
          const kbThrottle = keys.up ? 1 : 0;
          const kbBrake = keys.down ? 1 : 0;
          const kbSteer = (keys.left ? 1 : 0) - (keys.right ? 1 : 0);

          const combinedInput: VehicleInput = {
            throttle: Math.max(tIn.throttle, kbThrottle),
            brake: Math.max(tIn.brake, kbBrake),
            steer: Math.abs(tIn.steer) > 0.05 ? tIn.steer : kbSteer,
            handbrake: tIn.handbrake || keys.handbrake,
            gear: tIn.gear,
          };

          const { collisionIntensity } = physics.step(dt, combinedInput, activeColliders, rig);

          if (collisionIntensity > 0.05) {
            camCtrl.addShake(collisionIntensity * 0.35);
            soundEngine.playCollision(collisionIntensity);
            if (sessionElapsed - lastCollisionTime > 0.8) {
              collisions += 1;
              lastCollisionTime = sessionElapsed;
              score = Math.max(0, score - 120);
              triggerWarning("To'qnashuv! Ehtiyot bo'ling (-120 ball)", 1.8);
            }
          }

          soundEngine.updateEngine(
            physics.state.rpmRatio,
            combinedInput.throttle,
            physics.state.skidAmount
          );

          // Update Shadow Light tracking around player car
          keyLight.position.set(physics.state.x + 32, 54, physics.state.z + 26);
          keyLight.target.position.set(physics.state.x, 0, physics.state.z);

          if (warningTimer > 0) {
            warningTimer -= dt;
            if (warningTimer <= 0) activeWarning = null;
          }
          if (passedRedPenaltyCooldown > 0) passedRedPenaltyCooldown -= dt;

          const speedKmh = Math.abs(physics.state.forwardSpeed) * 3.6;

          // Mode-specific Evaluation
          let parkAlign = 0;
          let parkDist = 0;
          let parkAngleOk = false;
          let parkRevWarn = false;
          let timeRemaining: number | null = null;
          let signalState: 'green' | 'yellow' | 'red' | null = null;

          if (p.gameMode === 'parking') {
            const m = PARKING_MISSIONS.find((x) => x.id === p.missionId) ?? PARKING_MISSIONS[0];
            timeRemaining = Math.max(0, m.timeLimitSec - sessionElapsed);

            const dx = physics.state.x - m.target.x;
            const dz = physics.state.z - m.target.z;
            parkDist = Math.sqrt(dx * dx + dz * dz);

            // Heading alignment dot product
            const carFwdX = Math.sin(physics.state.yaw);
            const carFwdZ = Math.cos(physics.state.yaw);
            const tgtFwdX = Math.sin(m.target.yaw);
            const tgtFwdZ = Math.cos(m.target.yaw);
            const dot = carFwdX * tgtFwdX + carFwdZ * tgtFwdZ; // +1 exact, -1 opposite

            parkAngleOk = Math.abs(dot) > 0.965; // within ~15 deg
            parkAlign = Math.max(0, Math.min(1, 1 - parkDist / 6)) * 0.5 + Math.abs(dot) * 0.5;

            if (m.target.requireReverse && parkDist < 4.5 && tIn.gear !== 'R' && speedKmh > 2) {
              parkRevWarn = true;
            }

            const insideBay = parkDist < 1.15 && parkAngleOk;
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
                const timeBonus = Math.round(timeRemaining * 8);
                const finalScore = Math.max(100, score + timeBonus);
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
                  reason: "Avtomobil mukammal parkovka qilindi!",
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
          } else if (p.gameMode === 'city') {
            signalState = cityEnv.getSignalStateNear(physics.state.x, physics.state.z);
            if (signalState === 'red' && speedKmh > 24 && passedRedPenaltyCooldown <= 0) {
              passedRedPenaltyCooldown = 4.0;
              score = Math.max(0, score - 150);
              triggerWarning("Qizil chiroqdan o'tdingiz! (-150 ball)", 2.4);
            } else if (speedKmh > 72 && passedRedPenaltyCooldown <= 0) {
              passedRedPenaltyCooldown = 3.5;
              score = Math.max(0, score - 60);
              triggerWarning("Tezlik chegarasi 60 km/soat! (-60 ball)", 2.0);
            }

            const cp = CITY_CHECKPOINTS[checkpointIdx];
            if (cp) {
              const dx = physics.state.x - cp.x;
              const dz = physics.state.z - cp.z;
              if (dx * dx + dz * dz < 4.8 * 4.8) {
                soundEngine.playCheckpoint();
                score += 150;
                checkpointIdx += 1;
                if (checkpointIdx >= CITY_CHECKPOINTS.length) {
                  missionEnded = true;
                  soundEngine.setDrivingActive(false);
                  soundEngine.playSuccess();
                  const stars = score >= 2100 && collisions === 0 ? 3 : score >= 1600 ? 2 : 1;
                  p.onMissionComplete({
                    success: true,
                    mode: 'city',
                    missionTitle: 'Shaharda Haydash',
                    score,
                    stars,
                    timeSec: Math.round(sessionElapsed),
                    collisions,
                    reason: "Barcha shahar nazorat nuqtalarini muvaffaqiyatli bosib o'tdingiz!",
                  });
                } else {
                  const nextCp = CITY_CHECKPOINTS[checkpointIdx];
                  missionVisuals?.setCheckpointPosition(nextCp.x, nextCp.z);
                }
              }
            }
            missionVisuals?.updateVisuals(totalClockSec, false, 0);
          }

          // Emit throttled HUD snapshot (~20Hz)
          hudEmitTimer += dt;
          if (hudEmitTimer >= 0.05) {
            hudEmitTimer = 0;
            p.onHudUpdate({
              speedKmh: Math.round(speedKmh),
              gear: tIn.gear,
              rpmRatio: physics.state.rpmRatio,
              steerNorm: physics.state.steerAngle / spec.maxSteerAngle,
              headlights: p.headlights,
              cameraMode: p.cameraMode,
              elapsedSec: Math.round(sessionElapsed),
              timeRemainingSec: timeRemaining !== null ? Math.ceil(timeRemaining) : null,
              collisions,
              score,
              parkingAlignment: parkAlign,
              parkingDistance: Number(parkDist.toFixed(1)),
              parkingAngleOk: parkAngleOk,
              parkingHoldProgress: Math.min(1, parkingHoldSec / 1.1),
              parkingReverseWarning: parkRevWarn,
              checkpointIndex: checkpointIdx,
              totalCheckpoints: CITY_CHECKPOINTS.length,
              trafficSignalState: signalState,
              warningMessage: activeWarning,
            });
          }
        } else {
          soundEngine.setDrivingActive(false);
        }

        // Smooth camera update even while paused/result
        camCtrl.update(camera, rig, p.cameraMode, dt);
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    if (isSoftwareGl) {
      afterDraw(tick);
    } else {
      frameId = requestAnimationFrame(tick);
    }

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
      cityEnv.dispose();
      rig.dispose();
      textures.dispose();
      envTex.dispose();
      renderer.dispose();
      if (domEl.parentNode === container) {
        container.removeChild(domEl);
      }
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
