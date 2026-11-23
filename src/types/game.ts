export type VehicleId = 'supercar' | 'jdm' | 'german' | 'muscle' | 'hypercar';

export type GameMode = 'circuit' | 'street' | 'timeattack' | 'parking' | 'free';

export type TimeOfDay = 'day' | 'night';

export type GraphicsQuality = 'low' | 'medium' | 'high';

export type ControlScheme = 'buttons' | 'wheel';

export type CameraMode = 0 | 1 | 2 | 3;

export type GearMode = 'R' | 'N' | '1' | '2' | '3' | '4' | '5' | '6';

export type ScreenState =
  | 'menu'
  | 'cars'
  | 'garage'
  | 'tuning'
  | 'modes'
  | 'settings'
  | 'playing'
  | 'paused'
  | 'result';

export type GarageAngle = 'front' | 'side' | 'rear' | 'interior';

export type PaintFinish = 'metallic' | 'matte' | 'chrome';
export type RimStyle = 'sport5' | 'mesh' | 'turbine' | 'forged';
export type SpoilerStyle = 'none' | 'lip' | 'gt' | 'swan';
export type AeroKitStyle = 'stock' | 'sport' | 'track';
export type WindowTintLevel = 'light' | 'medium' | 'dark' | 'limo';
export type HeadlightStyle = 'xenon' | 'gt_gold' | 'laser_cyan' | 'neon_violet';

export interface CarCustomization {
  colorId: string;
  paintFinish: PaintFinish;
  rimStyle: RimStyle;
  rimColorHex: string;
  spoiler: SpoilerStyle;
  frontBumper: AeroKitStyle;
  rearBumper: AeroKitStyle;
  sideSkirts: AeroKitStyle;
  windowTint: WindowTintLevel;
  headlightStyle: HeadlightStyle;
  upgrades: {
    engine: number; // 0..3
    transmission: number; // 0..3
    brakes: number; // 0..3
    tires: number; // 0..3
    suspension: number; // 0..3
  };
}

export interface VehicleSpec {
  id: VehicleId;
  name: string;
  subtitle: string;
  origin: string;
  description: string;
  mass: number;
  engineForce: number;
  reverseForce: number;
  brakeForce: number;
  maxSpeedKmh: number;
  maxReverseKmh: number;
  maxSteerAngle: number;
  steerSpeed: number;
  wheelRadius: number;
  wheelBase: number;
  trackWidth: number;
  length: number;
  width: number;
  height: number;
  groundClearance: number;
  suspensionStiffness: number;
  lateralGrip: number;
  driftFactor: number;
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
  customizations: Record<VehicleId, CarCustomization>;
  graphics: GraphicsQuality;
  controlScheme: ControlScheme;
  timeOfDay: TimeOfDay;
  autoTransmission: boolean;
  sound: SoundSettings;
  parkingProgress: Record<string, MissionProgress>;
  bestCircuitLapSec: number | null;
  bestStreetTimeSec: number | null;
  bestTimeAttackLapSec: number | null;
  raceWins: number;
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
  currentLapTimeSec: number;
  bestLapTimeSec: number | null;
  lap: number;
  totalLaps: number;
  position: number;
  totalRacers: number;
  countdownText: string | null;
  raceProgress: number; // 0..1
  isDrifting: boolean;
  timeRemainingSec: number | null;
  collisions: number;
  score: number;
  parkingAlignment: number;
  parkingDistance: number;
  parkingAngleOk: boolean;
  parkingHoldProgress: number;
  parkingReverseWarning: boolean;
  checkpointIndex: number;
  totalCheckpoints: number;
  warningMessage: string | null;
}

export interface RaceStanding {
  name: string;
  isPlayer: boolean;
  vehicleName: string;
  position: number;
  finishTimeSec: number | null;
}

export interface MissionResult {
  success: boolean;
  mode: GameMode;
  missionTitle: string;
  score: number;
  stars: number;
  timeSec: number;
  bestLapSec?: number | null;
  position?: number;
  totalRacers?: number;
  standings?: RaceStanding[];
  collisions: number;
  reason: string;
  missionId?: string;
}
