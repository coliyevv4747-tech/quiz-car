export type VehicleId = 'sedan' | 'sport' | 'luxury' | 'suv';

export type GameMode = 'free' | 'parking' | 'city';

export type GraphicsQuality = 'low' | 'medium' | 'high';

export type ControlScheme = 'wheel' | 'buttons';

export type CameraMode = 0 | 1 | 2 | 3;

export type GearMode = 'D' | 'R' | 'N';

export type ScreenState = 'menu' | 'garage' | 'modes' | 'settings' | 'playing' | 'paused' | 'result';

export type GarageAngle = 'front' | 'side' | 'rear' | 'interior';

export interface VehicleSpec {
  id: VehicleId;
  name: string;
  subtitle: string;
  category: string;
  mass: number;
  engineForce: number;
  reverseForce: number;
  brakeForce: number;
  maxSpeedKmh: number;
  maxReverseKmh: number;
  maxSteerAngle: number; // radians
  steerSpeed: number;
  wheelRadius: number;
  wheelBase: number;
  trackWidth: number;
  length: number;
  width: number;
  height: number;
  groundClearance: number;
  suspensionStiffness: number;
  stats: {
    speed: number;
    acceleration: number;
    handling: number;
    braking: number;
  };
}

export interface VehicleColorOption {
  id: string;
  name: string;
  hex: string;
  metalness: number;
  roughness: number;
}

export interface ObstacleProp {
  type: 'car' | 'cone' | 'barrier';
  x: number;
  z: number;
  yaw: number;
  color?: string;
}

export interface ParkingMission {
  id: string;
  number: number;
  title: string;
  location: string;
  description: string;
  difficulty: 'Oson' | "O'rta" | 'Qiyin' | 'Ekspert';
  timeLimitSec: number;
  spawn: { x: number; z: number; yaw: number };
  target: {
    x: number;
    z: number;
    yaw: number;
    width: number;
    length: number;
    requireReverse: boolean;
  };
  waypoints?: Array<{ x: number; z: number }>;
  props: ObstacleProp[];
}

export interface CityCheckpoint {
  id: number;
  x: number;
  z: number;
  label: string;
  hasTrafficLight?: boolean;
}

export interface SoundSettings {
  master: boolean;
  engine: boolean;
  sfx: boolean;
  ambient: boolean;
}

export interface MissionProgress {
  completed: boolean;
  bestTimeSec: number | null;
  bestScore: number;
  stars: number;
}

export interface SaveData {
  selectedVehicle: VehicleId;
  selectedColor: string;
  graphics: GraphicsQuality;
  controlScheme: ControlScheme;
  sound: SoundSettings;
  parkingProgress: Record<string, MissionProgress>;
  cityBestScore: number;
  totalStars: number;
}

export interface HudSnapshot {
  speedKmh: number;
  gear: GearMode;
  rpmRatio: number;
  steerNorm: number;
  headlights: boolean;
  cameraMode: CameraMode;
  elapsedSec: number;
  timeRemainingSec: number | null;
  collisions: number;
  score: number;
  parkingAlignment: number; // 0..1
  parkingDistance: number; // meters
  parkingAngleOk: boolean;
  parkingHoldProgress: number; // 0..1
  parkingReverseWarning: boolean;
  checkpointIndex: number;
  totalCheckpoints: number;
  trafficSignalState: 'green' | 'yellow' | 'red' | null;
  warningMessage: string | null;
}

export interface MissionResult {
  success: boolean;
  mode: GameMode;
  missionTitle: string;
  score: number;
  stars: number;
  timeSec: number;
  collisions: number;
  reason: string;
  missionId?: string;
}
