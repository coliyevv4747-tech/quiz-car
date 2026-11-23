import {
  CarCustomization,
  CityCheckpoint,
  ParkingMission,
  VehicleColorOption,
  VehicleId,
  VehicleSpec,
} from '../types/game';

export const VEHICLE_SPECS: VehicleSpec[] = [
  {
    id: 'supercar',
    name: 'Veloce Strada V10',
    subtitle: 'Yevropa Superkari',
    origin: 'Italiya Dizayni',
    description: "O'rta motorli aerodinamik superkar. Yuqori burchak tezligi va keskin burilish aniqligi.",
    mass: 1360,
    engineForce: 10800,
    reverseForce: 4800,
    brakeForce: 15500,
    maxSpeedKmh: 248,
    maxReverseKmh: 48,
    maxSteerAngle: 0.56,
    steerSpeed: 4.1,
    wheelRadius: 0.34,
    wheelBase: 2.66,
    trackWidth: 1.76,
    length: 4.56,
    width: 1.98,
    height: 1.22,
    groundClearance: 0.11,
    suspensionStiffness: 1.38,
    lateralGrip: 11.2,
    driftFactor: 0.72,
    stats: {
      speed: 90,
      acceleration: 89,
      handling: 94,
      braking: 92,
    },
  },
  {
    id: 'jdm',
    name: 'Kuroki GT-R',
    subtitle: 'Yapon Sport Kupesi',
    origin: 'Yaponiya JDM',
    description: "Turbo quvvatli JDM kupe. Boshqariladigan drift va agressiv ko'cha poygalari qiroli.",
    mass: 1420,
    engineForce: 10100,
    reverseForce: 4600,
    brakeForce: 14600,
    maxSpeedKmh: 228,
    maxReverseKmh: 46,
    maxSteerAngle: 0.62,
    steerSpeed: 4.3,
    wheelRadius: 0.34,
    wheelBase: 2.72,
    trackWidth: 1.74,
    length: 4.62,
    width: 1.94,
    height: 1.32,
    groundClearance: 0.13,
    suspensionStiffness: 1.22,
    lateralGrip: 9.4,
    driftFactor: 1.15,
    stats: {
      speed: 85,
      acceleration: 87,
      handling: 91,
      braking: 87,
    },
  },
  {
    id: 'german',
    name: 'Bavaria M-Line',
    subtitle: 'Nemis Sport Sedani',
    origin: 'Germaniya Muhandisligi',
    description: "To'liq uzatmali premium sport sedani. Yuqori barqarorlik va muvozanatli boshqaruv.",
    mass: 1640,
    engineForce: 10400,
    reverseForce: 4700,
    brakeForce: 15200,
    maxSpeedKmh: 235,
    maxReverseKmh: 45,
    maxSteerAngle: 0.58,
    steerSpeed: 3.7,
    wheelRadius: 0.35,
    wheelBase: 2.86,
    trackWidth: 1.74,
    length: 4.84,
    width: 1.94,
    height: 1.40,
    groundClearance: 0.14,
    suspensionStiffness: 1.12,
    lateralGrip: 10.6,
    driftFactor: 0.85,
    stats: {
      speed: 86,
      acceleration: 85,
      handling: 88,
      braking: 90,
    },
  },
  {
    id: 'muscle',
    name: 'Titan V8 Muscle',
    subtitle: 'Amerika Maskl-Kari',
    origin: 'AQSH V8 Klassika',
    description: "Katta hajmli V8 dvigatel va kuchli orqa g'ildirak tortishi. Keng drift va tezkor start.",
    mass: 1710,
    engineForce: 11400,
    reverseForce: 5000,
    brakeForce: 13800,
    maxSpeedKmh: 224,
    maxReverseKmh: 44,
    maxSteerAngle: 0.60,
    steerSpeed: 3.5,
    wheelRadius: 0.36,
    wheelBase: 2.78,
    trackWidth: 1.78,
    length: 4.82,
    width: 1.98,
    height: 1.36,
    groundClearance: 0.14,
    suspensionStiffness: 0.95,
    lateralGrip: 8.6,
    driftFactor: 1.28,
    stats: {
      speed: 84,
      acceleration: 92,
      handling: 79,
      braking: 81,
    },
  },
  {
    id: 'hypercar',
    name: 'Samarqand Apex-X',
    subtitle: 'Zamonaviy Giperkar',
    origin: 'Ekstremal Aerodinamika',
    description: "Eng yuqori tezlik, faol aerodinamika va rekord darajadagi tezlanishga ega giperkar.",
    mass: 1280,
    engineForce: 12900,
    reverseForce: 5200,
    brakeForce: 17500,
    maxSpeedKmh: 285,
    maxReverseKmh: 52,
    maxSteerAngle: 0.54,
    steerSpeed: 4.5,
    wheelRadius: 0.35,
    wheelBase: 2.70,
    trackWidth: 1.82,
    length: 4.68,
    width: 2.04,
    height: 1.16,
    groundClearance: 0.10,
    suspensionStiffness: 1.52,
    lateralGrip: 12.2,
    driftFactor: 0.65,
    stats: {
      speed: 99,
      acceleration: 98,
      handling: 96,
      braking: 97,
    },
  },
];

export const VEHICLE_COLORS: VehicleColorOption[] = [
  { id: 'crimson', name: 'Yoqut Qizil', hex: '#dc2626' },
  { id: 'registon', name: 'Registon Moviy', hex: '#0284c7' },
  { id: 'pearl', name: 'Marvarid Oq', hex: '#f1f5f9' },
  { id: 'obsidian', name: 'Qora Obsidiyan', hex: '#111827' },
  { id: 'gold', name: 'Samarqand Oltin', hex: '#d97706' },
  { id: 'emerald', name: 'Zumrad Yashil', hex: '#059669' },
  { id: 'lime', name: 'Acid Yashil', hex: '#65a30d' },
  { id: 'purple', name: 'Qirollik Binafsha', hex: '#7c3aed' },
  { id: 'titanium', name: 'Titan Kumush', hex: '#94a3b8' },
  { id: 'orange', name: 'Vulkan Apelsin', hex: '#ea580c' },
];

export const RIM_COLORS = [
  { id: 'silver', name: 'Kumush', hex: '#cbd5e1' },
  { id: 'black', name: 'Qora Mat', hex: '#1e293b' },
  { id: 'gold', name: 'Bronza Oltin', hex: '#d97706' },
  { id: 'red', name: 'Poyga Qizil', hex: '#ef4444' },
  { id: 'cyan', name: 'Neon Moviy', hex: '#06b6d4' },
];

export function createDefaultCustomization(vehicleId: VehicleId): CarCustomization {
  const defaultColors: Record<VehicleId, string> = {
    supercar: 'crimson',
    jdm: 'registon',
    german: 'pearl',
    muscle: 'orange',
    hypercar: 'gold',
  };
  return {
    colorId: defaultColors[vehicleId],
    paintFinish: 'metallic',
    rimStyle: vehicleId === 'muscle' ? 'forged' : vehicleId === 'jdm' ? 'mesh' : 'sport5',
    rimColorHex: vehicleId === 'hypercar' ? '#d97706' : '#cbd5e1',
    spoiler:
      vehicleId === 'hypercar'
        ? 'swan'
        : vehicleId === 'jdm'
        ? 'gt'
        : vehicleId === 'german'
        ? 'lip'
        : 'lip',
    frontBumper: vehicleId === 'hypercar' || vehicleId === 'jdm' ? 'track' : 'sport',
    rearBumper: vehicleId === 'hypercar' ? 'track' : 'sport',
    sideSkirts: 'sport',
    windowTint: 'dark',
    headlightStyle: vehicleId === 'hypercar' ? 'laser_cyan' : 'xenon',
    upgrades: {
      engine: 0,
      transmission: 0,
      brakes: 0,
      tires: 0,
      suspension: 0,
    },
  };
}

// Professional Motorsport Circuit Closed-Loop Waypoints (World X, Z)
// Clockwise/Counter-clockwise GP layout (~1050m lap)
export const CIRCUIT_WAYPOINTS: Array<{ x: number; z: number }> = [
  { x: 0, z: 95 },     // Main Straight Start/Finish
  { x: 85, z: 95 },    // End of Main Straight
  { x: 138, z: 68 },   // Turn 1 Sweeper Entry
  { x: 145, z: 10 },   // Turn 1 Exit
  { x: 112, z: -38 },  // S-Curve Left
  { x: 132, z: -92 },  // S-Curve Right
  { x: 88, z: -135 },  // North Hairpin Entry
  { x: 12, z: -130 },  // North Back Straight
  { x: -75, z: -125 }, // West High-Speed Bend
  { x: -135, z: -72 }, // West Chicane Entry
  { x: -115, z: -12 }, // West Chicane Exit
  { x: -138, z: 48 },  // Final Hairpin Entry
  { x: -92, z: 92 },   // Final Corner onto Main Straight
];

// Street Racing Checkpoints on the Modern City Streets
export const STREET_RACE_WAYPOINTS: Array<{ x: number; z: number; label: string }> = [
  { x: 0, z: -16, label: 'Markaziy Chorraha' },
  { x: 0, z: -48, label: 'Shimoliy Xiyobon' },
  { x: 46, z: -48, label: 'Toshkent Plaza Burilishi' },
  { x: 51, z: 0, label: "Sharqiy Shoh Ko'cha" },
  { x: 51, z: 46, label: 'Savdo Markazi' },
  { x: 0, z: 48, label: 'Janubiy Shoh Kocha' },
  { x: -51, z: 48, label: "Avtoservis Burilishi" },
  { x: -51, z: -4, label: "G'arbiy Xiyobon" },
  { x: -51, z: -48, label: 'Biznes Markaz' },
  { x: 0, z: -48, label: 'Shimoliy Finish Chizig‘i' },
  { x: 0, z: 18, label: 'Mustaqillik Marrasi' },
];

export interface AiRacerConfig {
  id: string;
  name: string;
  vehicleId: VehicleId;
  colorId: string;
  paceFactor: number; // 0.88 .. 0.99
}

export const AI_RACERS: AiRacerConfig[] = [
  { id: 'ai-1', name: 'Sardor GT', vehicleId: 'jdm', colorId: 'crimson', paceFactor: 0.95 },
  { id: 'ai-2', name: 'Temur Apex', vehicleId: 'supercar', colorId: 'emerald', paceFactor: 0.91 },
  { id: 'ai-3', name: 'Jasur V8', vehicleId: 'muscle', colorId: 'purple', paceFactor: 0.87 },
];

// Preserved Parking Missions (from UZB PARKING 3D)
export const PARKING_MISSIONS: ParkingMission[] = [
  {
    id: 'park-1',
    number: 1,
    title: "To'g'ri Parkovka",
    location: 'Savdo Markazi Avtoturargohi',
    description: "Oldinga yurib belgilangan ko'k parkovka chiziqlari ichiga tekis joylashing.",
    difficulty: 'Oson',
    timeLimitSec: 75,
    spawn: { x: 26, z: 32, yaw: 0 },
    target: { x: 40, z: 18, yaw: Math.PI / 2, width: 3.2, length: 5.9, requireReverse: false },
    props: [
      { type: 'car', x: 40, z: 13.5, yaw: Math.PI / 2, color: '#94a3b8' },
      { type: 'car', x: 40, z: 22.5, yaw: Math.PI / 2, color: '#1e293b' },
      { type: 'cone', x: 35.8, z: 15.2, yaw: 0 },
      { type: 'cone', x: 35.8, z: 20.8, yaw: 0 },
    ],
  },
  {
    id: 'park-2',
    number: 2,
    title: 'Teskari Parkovka',
    location: 'Toshkent Plaza Shimoliy Qismi',
    description: "Mashinani orqaga (R uzatma) haydab, orqa tomoni bilan to'g'ri joylashtiring.",
    difficulty: 'Oson',
    timeLimitSec: 90,
    spawn: { x: 28, z: -26, yaw: Math.PI },
    target: { x: 42, z: -34, yaw: -Math.PI / 2, width: 3.2, length: 5.9, requireReverse: true },
    props: [
      { type: 'car', x: 42, z: -38.5, yaw: -Math.PI / 2, color: '#0284c7' },
      { type: 'car', x: 42, z: -29.5, yaw: -Math.PI / 2, color: '#f8fafc' },
      { type: 'cone', x: 37.5, z: -31.5, yaw: 0 },
      { type: 'cone', x: 37.5, z: -36.5, yaw: 0 },
    ],
  },
  {
    id: 'park-3',
    number: 3,
    title: 'Parallel Parkovka',
    location: "Mustaqillik Shoh Ko'chasi",
    description: "Yo'l chetidagi ikki avtomobil orasiga ehtiyotkorlik bilan parallel parkovka qiling.",
    difficulty: "O'rta",
    timeLimitSec: 95,
    spawn: { x: -11, z: -18, yaw: 0 },
    target: { x: -13.2, z: 0, yaw: 0, width: 3.0, length: 6.1, requireReverse: false },
    props: [
      { type: 'car', x: -13.2, z: -7.2, yaw: 0, color: '#dc2626' },
      { type: 'car', x: -13.2, z: 7.2, yaw: 0, color: '#141821' },
      { type: 'cone', x: -11.4, z: -3.6, yaw: 0 },
      { type: 'cone', x: -11.4, z: 3.6, yaw: 0 },
    ],
  },
  {
    id: 'park-4',
    number: 4,
    title: 'Tor Joyga Kirish',
    location: 'Avtoservis Hovlisi',
    description: "Konuslar va to'siqlar orasidan o'tib, tor joyga zarar yetkazmasdan kiring.",
    difficulty: 'Qiyin',
    timeLimitSec: 110,
    spawn: { x: -34, z: 46, yaw: -Math.PI / 2 },
    target: { x: -50, z: 28, yaw: Math.PI, width: 3.0, length: 5.8, requireReverse: false },
    waypoints: [{ x: -46, z: 42 }],
    props: [
      { type: 'barrier', x: -42, z: 38, yaw: 0 },
      { type: 'barrier', x: -42, z: 46, yaw: 0 },
      { type: 'car', x: -46.2, z: 28, yaw: Math.PI, color: '#d97706' },
      { type: 'car', x: -53.8, z: 28, yaw: Math.PI, color: '#475569' },
      { type: 'cone', x: -48.1, z: 32.5, yaw: 0 },
      { type: 'cone', x: -51.9, z: 32.5, yaw: 0 },
    ],
  },
  {
    id: 'park-5',
    number: 5,
    title: 'Ikki Mashina Orasiga Teskari',
    location: 'Biznes Markaz VIP Hududi',
    description: "Slalom yo'lakdan o'tib, VIP avtomobillar orasiga teskari (R) holatda kiring.",
    difficulty: 'Qiyin',
    timeLimitSec: 115,
    spawn: { x: 16, z: -48, yaw: Math.PI / 2 },
    target: { x: -40, z: -42, yaw: 0, width: 3.0, length: 5.9, requireReverse: true },
    waypoints: [{ x: -12, z: -48 }],
    props: [
      { type: 'car', x: -44.0, z: -42, yaw: 0, color: '#1e3a8a' },
      { type: 'car', x: -36.0, z: -42, yaw: 0, color: '#e2e8f0' },
      { type: 'cone', x: -24, z: -46.5, yaw: 0 },
      { type: 'cone', x: -28, z: -49.5, yaw: 0 },
      { type: 'cone', x: -32, z: -46.5, yaw: 0 },
    ],
  },
  {
    id: 'park-6',
    number: 6,
    title: 'Usta Haydovchi Sinovi',
    location: 'Chorsu Maydoni',
    description: "Nazorat nuqtalaridan o'tib, markaziy maydonning eng tor parallel joyiga teskari joylashing.",
    difficulty: 'Ekspert',
    timeLimitSec: 125,
    spawn: { x: 52, z: 0, yaw: Math.PI / 2 },
    target: { x: 13.2, z: -26, yaw: Math.PI, width: 2.9, length: 5.8, requireReverse: true },
    waypoints: [
      { x: 26, z: 0 },
      { x: 10, z: -12 },
    ],
    props: [
      { type: 'car', x: 13.2, z: -19.2, yaw: Math.PI, color: '#059669' },
      { type: 'car', x: 13.2, z: -32.8, yaw: Math.PI, color: '#141821' },
      { type: 'cone', x: 11.1, z: -22.8, yaw: 0 },
      { type: 'cone', x: 11.1, z: -29.2, yaw: 0 },
      { type: 'barrier', x: 6.5, z: -26, yaw: Math.PI / 2 },
    ],
  },
];

export const CITY_CHECKPOINTS: CityCheckpoint[] = STREET_RACE_WAYPOINTS.map((wp, i) => ({
  id: i + 1,
  x: wp.x,
  z: wp.z,
  label: wp.label,
}));

export const CAMERA_LABELS = [
  'Orqa Kamera',
  'Yaqin Kamera',
  'Salon (Ichki)',
  'Old Bamper',
] as const;
