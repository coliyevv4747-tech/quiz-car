import * as THREE from 'three';
import { VEHICLE_COLORS } from '../data/gameData';
import {
  AeroKitStyle,
  CarCustomization,
  RimStyle,
  SpoilerStyle,
  VehicleSpec,
} from '../types/game';
import { CityTextures } from './textures';

export interface VehicleRig {
  root: THREE.Group;
  chassisGroup: THREE.Group;
  bodyMaterial: THREE.MeshPhysicalMaterial;
  glassMaterial: THREE.MeshPhysicalMaterial;
  carbonMaterial: THREE.MeshStandardMaterial;
  steeringWheel: THREE.Group;
  frontLeftPivot: THREE.Group;
  frontRightPivot: THREE.Group;
  wheelSpinGroups: THREE.Group[];
  brakeLightMat: THREE.MeshStandardMaterial;
  reverseLightMat: THREE.MeshStandardMaterial;
  headlightMat: THREE.MeshStandardMaterial;
  headlightSpots: THREE.SpotLight[];
  headlightCones: THREE.Mesh[];
  exhaustFlames: THREE.Mesh[];
  cockpitAnchor: THREE.Object3D;
  chaseAnchor: THREE.Object3D;
  closeAnchor: THREE.Object3D;
  frontAnchor: THREE.Object3D;
  applyCustomization: (custom: CarCustomization) => void;
  setHeadlights: (on: boolean) => void;
  setBrakeAndReverse: (braking: boolean, reversing: boolean) => void;
  setExhaustFlame: (intensity: number) => void;
  dispose: () => void;
}

interface HullStation {
  z: number;
  halfWBot: number;
  halfWMid: number;
  halfWTop: number;
  yBot: number;
  yMid: number;
  yTop: number;
}

/**
 * Generates a smooth, sculpted multi-station automotive body shell (non-boxy!)
 * with tapered nose, flared wheel arches, waist curve, and tumblehome cabin.
 */
function buildSculptedHullGeometry(spec: VehicleSpec): {
  bodyGeo: THREE.BufferGeometry;
  glassGeo: THREE.BufferGeometry;
} {
  const halfL = spec.length * 0.5;
  const halfW = spec.width * 0.5;
  const gc = spec.groundClearance;
  const belt = spec.id === 'hypercar' ? 0.68 : spec.id === 'supercar' ? 0.72 : 0.78;
  const roof = spec.height;

  const frontAxleZ = spec.wheelBase * 0.52;
  const rearAxleZ = -spec.wheelBase * 0.48;
  const archSpan = spec.wheelRadius + 0.14;

  // Define longitudinal stations from rear (-halfL) to front (+halfL)
  const isMidEngine = spec.id === 'supercar' || spec.id === 'hypercar';
  const isMuscle = spec.id === 'muscle';
  const isSedan = spec.id === 'german';

  const rawStations: HullStation[] = [
    // Rear tail fascia
    { z: -halfL, halfWBot: halfW * 0.84, halfWMid: halfW * 0.90, halfWTop: halfW * 0.74, yBot: gc + 0.14, yMid: belt - 0.04, yTop: belt + 0.05 },
    // Rear haunch / over rear axle
    { z: rearAxleZ - archSpan * 0.5, halfWBot: halfW * 0.95, halfWMid: halfW * 1.02, halfWTop: halfW * 0.78, yBot: gc + 0.06, yMid: belt + 0.04, yTop: belt + 0.12 },
    { z: rearAxleZ, halfWBot: halfW * 0.97, halfWMid: halfW * 1.04, halfWTop: halfW * 0.76, yBot: gc + 0.02, yMid: belt + 0.05, yTop: isSedan ? roof * 0.90 : belt + 0.22 },
    // C-pillar / Fastback transition
    { z: rearAxleZ + archSpan * 0.75, halfWBot: halfW * 0.94, halfWMid: halfW * 0.97, halfWTop: halfW * 0.68, yBot: gc, yMid: belt + 0.02, yTop: roof * (isSedan ? 0.98 : 0.94) },
    // Cabin center (doors)
    { z: 0.05, halfWBot: halfW * 0.92, halfWMid: halfW * 0.94, halfWTop: halfW * 0.65, yBot: gc, yMid: belt, yTop: roof },
    // A-pillar base / Windshield base
    { z: isMidEngine ? halfL * 0.30 : isMuscle ? halfL * 0.08 : halfL * 0.18, halfWBot: halfW * 0.93, halfWMid: halfW * 0.96, halfWTop: halfW * 0.72, yBot: gc, yMid: belt - 0.02, yTop: belt + 0.04 },
    // Front fender crown (over front axle)
    { z: frontAxleZ, halfWBot: halfW * 0.95, halfWMid: halfW * 1.01, halfWTop: halfW * 0.78, yBot: gc + 0.02, yMid: belt - 0.08, yTop: belt - 0.04 },
    // Nose slope
    { z: halfL * 0.84, halfWBot: halfW * 0.88, halfWMid: halfW * 0.92, halfWTop: halfW * 0.72, yBot: gc + 0.02, yMid: belt - 0.20, yTop: belt - 0.16 },
    // Front nose tip
    { z: halfL, halfWBot: halfW * 0.76, halfWMid: halfW * 0.80, halfWTop: halfW * 0.62, yBot: gc + 0.04, yMid: gc + 0.26, yTop: gc + 0.32 },
  ];

  // Cross-section ring has 10 points per station (symmetric around X=0, closed loop)
  // Order around cross-section (looking from +Z toward -Z, counter-clockwise):
  // 0: bottom-center, 1: bottom-right(-X), 2: mid-right(-X), 3: shoulder-right(-X),
  // 4: top-right(-X), 5: top-center, 6: top-left(+X), 7: shoulder-left(+X), 8: mid-left(+X), 9: bottom-left(+X)
  const ptsPerRing = 10;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let s = 0; s < rawStations.length; s++) {
    const st = rawStations[s];
    const u = s / (rawStations.length - 1);
    const ring: Array<[number, number, number]> = [
      [0, st.yBot, st.z],
      [-st.halfWBot * 0.88, st.yBot + 0.03, st.z],
      [-st.halfWMid, (st.yBot + st.yMid) * 0.55, st.z],
      [-st.halfWMid * 0.96, st.yMid, st.z],
      [-st.halfWTop, st.yTop - 0.04, st.z],
      [0, st.yTop, st.z],
      [st.halfWTop, st.yTop - 0.04, st.z],
      [st.halfWMid * 0.96, st.yMid, st.z],
      [st.halfWMid, (st.yBot + st.yMid) * 0.55, st.z],
      [st.halfWBot * 0.88, st.yBot + 0.03, st.z],
    ];
    for (let k = 0; k < ptsPerRing; k++) {
      positions.push(ring[k][0], ring[k][1], ring[k][2]);
      uvs.push(u, k / ptsPerRing);
    }
  }

  for (let s = 0; s < rawStations.length - 1; s++) {
    for (let k = 0; k < ptsPerRing; k++) {
      const nextK = (k + 1) % ptsPerRing;
      const a = s * ptsPerRing + k;
      const b = s * ptsPerRing + nextK;
      const c = (s + 1) * ptsPerRing + nextK;
      const d = (s + 1) * ptsPerRing + k;
      indices.push(a, d, b);
      indices.push(b, d, c);
    }
  }

  // Cap rear (station 0) and front (last station)
  const rearCenterIdx = positions.length / 3;
  positions.push(0, (rawStations[0].yBot + rawStations[0].yMid) * 0.5, rawStations[0].z);
  uvs.push(0, 0.5);
  for (let k = 0; k < ptsPerRing; k++) {
    const nextK = (k + 1) % ptsPerRing;
    indices.push(rearCenterIdx, k, nextK);
  }

  const lastS = rawStations.length - 1;
  const frontCenterIdx = positions.length / 3;
  positions.push(0, (rawStations[lastS].yBot + rawStations[lastS].yMid) * 0.5, rawStations[lastS].z);
  uvs.push(1, 0.5);
  for (let k = 0; k < ptsPerRing; k++) {
    const nextK = (k + 1) % ptsPerRing;
    indices.push(frontCenterIdx, lastS * ptsPerRing + nextK, lastS * ptsPerRing + k);
  }

  const bodyGeo = new THREE.BufferGeometry();
  bodyGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  bodyGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  bodyGeo.setIndex(indices);
  bodyGeo.computeVertexNormals();

  // Separate Curved Greenhouse Glass Canopy (wraps smoothly over stations 2..5)
  const gPositions: number[] = [];
  const gIndices: number[] = [];
  const glassStations = rawStations.slice(2, 6);
  const gPts = 5; // right-mid, right-top, top-center, left-top, left-mid
  for (let s = 0; s < glassStations.length; s++) {
    const st = glassStations[s];
    const inset = 0.025;
    const pts: Array<[number, number, number]> = [
      [-st.halfWMid * 0.89, st.yMid + 0.02, st.z],
      [-st.halfWTop * 0.94, st.yTop - 0.025, st.z],
      [0, st.yTop + 0.012, st.z],
      [st.halfWTop * 0.94, st.yTop - 0.025, st.z],
      [st.halfWMid * 0.89, st.yMid + 0.02, st.z],
    ];
    for (let k = 0; k < gPts; k++) {
      gPositions.push(
        pts[k][0] * (1 + inset * 0.2),
        pts[k][1],
        pts[k][2] + (s === 0 ? 0.04 : s === glassStations.length - 1 ? -0.04 : 0)
      );
    }
  }
  for (let s = 0; s < glassStations.length - 1; s++) {
    for (let k = 0; k < gPts - 1; k++) {
      const a = s * gPts + k;
      const b = s * gPts + k + 1;
      const c = (s + 1) * gPts + k + 1;
      const d = (s + 1) * gPts + k;
      gIndices.push(a, d, b, b, d, c);
    }
  }
  const glassGeo = new THREE.BufferGeometry();
  glassGeo.setAttribute('position', new THREE.Float32BufferAttribute(gPositions, 3));
  glassGeo.setIndex(gIndices);
  glassGeo.computeVertexNormals();

  return { bodyGeo, glassGeo };
}

function buildPerformanceWheel(
  radius: number,
  width: number,
  textures: CityTextures,
  rimStyle: RimStyle,
  rimColorHex: string,
  isLeftSide: boolean
): { spinGroup: THREE.Group; caliperGroup: THREE.Group } {
  const spinGroup = new THREE.Group();
  const caliperGroup = new THREE.Group();

  // 1. Curved Performance Tire via LatheGeometry (real rounded shoulder profile!)
  const rOut = radius;
  const rIn = radius * 0.66;
  const hw = width * 0.5;
  const tirePts = [
    new THREE.Vector2(rIn, -hw * 0.88),
    new THREE.Vector2(rOut * 0.93, -hw),
    new THREE.Vector2(rOut, -hw * 0.82),
    new THREE.Vector2(rOut, hw * 0.82),
    new THREE.Vector2(rOut * 0.93, hw),
    new THREE.Vector2(rIn, hw * 0.88),
  ];
  const tireGeo = new THREE.LatheGeometry(tirePts, 28);
  tireGeo.rotateZ(Math.PI / 2);
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x14171c,
    roughness: 0.82,
    metalness: 0.06,
  });
  const tireMesh = new THREE.Mesh(tireGeo, tireMat);
  tireMesh.castShadow = true;
  spinGroup.add(tireMesh);

  // 2. Ventilated Brake Disc Rotor (spins with wheel)
  const discMat = new THREE.MeshStandardMaterial({
    map: textures.brakeDisc,
    metalness: 0.85,
    roughness: 0.3,
  });
  const discGeo = new THREE.CylinderGeometry(radius * 0.55, radius * 0.55, 0.035, 22);
  discGeo.rotateZ(Math.PI / 2);
  const discMesh = new THREE.Mesh(discGeo, discMat);
  spinGroup.add(discMesh);

  // 3. Rim Barrel & Spokes
  const rimMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(rimColorHex),
    metalness: 0.9,
    roughness: 0.18,
  });
  const rimBarrel = new THREE.Mesh(
    new THREE.CylinderGeometry(rIn, rIn, width * 0.84, 24, 1, true).rotateZ(Math.PI / 2),
    rimMat
  );
  spinGroup.add(rimBarrel);

  const spokeCount =
    rimStyle === 'forged' ? 10 : rimStyle === 'turbine' ? 8 : rimStyle === 'mesh' ? 7 : 5;
  const spokeOffset = isLeftSide ? hw * 0.58 : -hw * 0.58;

  for (let i = 0; i < spokeCount; i++) {
    const angle = (i * Math.PI * 2) / spokeCount;
    if (rimStyle === 'mesh') {
      // Y-spoke pair
      [-0.18, 0.18].forEach((off) => {
        const s = new THREE.Mesh(
          new THREE.BoxGeometry(0.032, rIn * 0.92, 0.024),
          rimMat
        );
        s.position.x = spokeOffset;
        s.rotation.x = angle + off;
        s.position.y = Math.cos(angle + off) * rIn * 0.45;
        s.position.z = Math.sin(angle + off) * rIn * 0.45;
        spinGroup.add(s);
      });
    } else if (rimStyle === 'turbine') {
      const s = new THREE.Mesh(
        new THREE.BoxGeometry(0.035, rIn * 0.9, 0.065),
        rimMat
      );
      s.position.x = spokeOffset;
      s.rotation.x = angle;
      s.rotation.y = 0.25;
      s.position.y = Math.cos(angle) * rIn * 0.46;
      s.position.z = Math.sin(angle) * rIn * 0.46;
      spinGroup.add(s);
    } else {
      const s = new THREE.Mesh(
        new THREE.BoxGeometry(0.035, rIn * 0.94, rimStyle === 'sport5' ? 0.048 : 0.028),
        rimMat
      );
      s.position.x = spokeOffset;
      s.rotation.x = angle;
      s.position.y = Math.cos(angle) * rIn * 0.48;
      s.position.z = Math.sin(angle) * rIn * 0.48;
      spinGroup.add(s);
    }
  }

  // Center Hub Nut
  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(rIn * 0.24, rIn * 0.24, width * 0.72, 16).rotateZ(Math.PI / 2),
    rimMat
  );
  spinGroup.add(hub);

  // 4. Stationary Painted Brembo Brake Caliper (attached to caliperGroup, NOT spinGroup)
  const caliperMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    metalness: 0.55,
    roughness: 0.28,
  });
  const caliper = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, radius * 0.34, radius * 0.20),
    caliperMat
  );
  caliper.position.set(isLeftSide ? hw * 0.22 : -hw * 0.22, radius * 0.14, -radius * 0.36);
  caliperGroup.add(caliper);

  return { spinGroup, caliperGroup };
}

function buildSpoilerMesh(
  style: SpoilerStyle,
  spec: VehicleSpec,
  bodyMat: THREE.Material,
  carbonMat: THREE.Material
): THREE.Group {
  const g = new THREE.Group();
  if (style === 'none') return g;

  const halfL = spec.length * 0.5;
  const deckY = spec.id === 'hypercar' ? 0.74 : spec.id === 'supercar' ? 0.78 : 0.84;
  const w = spec.width * 0.86;

  if (style === 'lip') {
    const lip = new THREE.Mesh(new THREE.BoxGeometry(w * 0.85, 0.06, 0.16), carbonMat);
    lip.position.set(0, deckY + 0.03, -halfL + 0.14);
    lip.rotation.x = -0.25;
    g.add(lip);
  } else if (style === 'gt' || style === 'swan') {
    const wingY = deckY + (style === 'swan' ? 0.34 : 0.26);
    const wingZ = -halfL + 0.16;
    const blade = new THREE.Mesh(new THREE.BoxGeometry(w, 0.038, 0.26), carbonMat);
    blade.position.set(0, wingY, wingZ);
    blade.rotation.x = 0.08;
    g.add(blade);

    // Side Endplates
    const endGeo = new THREE.BoxGeometry(0.03, 0.18, 0.32);
    [-w * 0.5, w * 0.5].forEach((ex) => {
      const ep = new THREE.Mesh(endGeo, bodyMat);
      ep.position.set(ex, wingY - 0.02, wingZ);
      g.add(ep);
    });

    // Uprights / Swan-neck pylons
    [-w * 0.28, w * 0.28].forEach((px) => {
      const pylon = new THREE.Mesh(
        new THREE.BoxGeometry(0.035, wingY - deckY + 0.06, 0.14),
        carbonMat
      );
      pylon.position.set(px, (wingY + deckY) * 0.5, wingZ + (style === 'swan' ? 0.08 : 0));
      if (style === 'swan') pylon.rotation.x = -0.28;
      g.add(pylon);
    });
  }
  return g;
}

function buildAeroKitParts(
  spec: VehicleSpec,
  frontKit: AeroKitStyle,
  rearKit: AeroKitStyle,
  skirtKit: AeroKitStyle,
  bodyMat: THREE.Material,
  carbonMat: THREE.Material
): THREE.Group {
  const g = new THREE.Group();
  const halfL = spec.length * 0.5;
  const halfW = spec.width * 0.5;
  const gc = spec.groundClearance;

  // Front Splitter & Canards
  const splitDepth = frontKit === 'track' ? 0.36 : frontKit === 'sport' ? 0.24 : 0.14;
  const splitWidth = frontKit === 'track' ? spec.width * 1.02 : spec.width * 0.94;
  const splitter = new THREE.Mesh(
    new THREE.BoxGeometry(splitWidth, 0.035, splitDepth),
    frontKit === 'stock' ? bodyMat : carbonMat
  );
  splitter.position.set(0, gc + 0.02, halfL - 0.04 + splitDepth * 0.32);
  g.add(splitter);

  if (frontKit === 'track') {
    [-1, 1].forEach((s) => {
      const endplate = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.14, 0.28), carbonMat);
      endplate.position.set(s * splitWidth * 0.5, gc + 0.07, halfL - 0.02);
      g.add(endplate);
    });
  }

  // Rear Diffuser
  const finCount = rearKit === 'track' ? 6 : rearKit === 'sport' ? 4 : 2;
  const diffBase = new THREE.Mesh(
    new THREE.BoxGeometry(spec.width * 0.78, 0.14, 0.22),
    rearKit === 'stock' ? bodyMat : carbonMat
  );
  diffBase.position.set(0, gc + 0.08, -halfL - 0.01);
  g.add(diffBase);

  for (let i = 0; i < finCount; i++) {
    const fx = ((i / Math.max(1, finCount - 1)) - 0.5) * spec.width * 0.62;
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.16, 0.28), carbonMat);
    fin.position.set(fx, gc + 0.07, -halfL - 0.04);
    g.add(fin);
  }

  // Side Skirts
  const skirtW = skirtKit === 'track' ? 0.18 : skirtKit === 'sport' ? 0.12 : 0.06;
  const skirtLen = spec.wheelBase * 0.72;
  [-1, 1].forEach((s) => {
    const skirt = new THREE.Mesh(
      new THREE.BoxGeometry(skirtW, 0.045, skirtLen),
      skirtKit === 'stock' ? bodyMat : carbonMat
    );
    skirt.position.set(s * (halfW - 0.02), gc + 0.03, 0);
    g.add(skirt);
  });

  return g;
}

export function createVehicleModel(
  spec: VehicleSpec,
  initialCustom: CarCustomization,
  textures: CityTextures,
  isSoftwareGl: boolean,
  enableShadows: boolean
): VehicleRig {
  const root = new THREE.Group();
  const chassisGroup = new THREE.Group();
  root.add(chassisGroup);

  const colorOpt = VEHICLE_COLORS.find((c) => c.id === initialCustom.colorId);
  const bodyMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(colorOpt ? colorOpt.hex : '#dc2626'),
    metalness: 0.78,
    roughness: 0.18,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
    envMapIntensity: 1.45,
  });

  const carbonMaterial = new THREE.MeshStandardMaterial({
    map: textures.carbonFiber,
    color: 0x333945,
    roughness: 0.42,
    metalness: 0.35,
  });

  const darkTrimMat = new THREE.MeshStandardMaterial({
    color: 0x0f131a,
    roughness: 0.65,
    metalness: 0.2,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.96,
    roughness: 0.1,
  });

  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x0b1624,
    metalness: 0.15,
    roughness: 0.05,
    transparent: true,
    opacity: isSoftwareGl ? 0.62 : 0.55,
    ior: 1.52,
    clearcoat: 1.0,
    depthWrite: false,
  });

  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    emissive: 0xe0f2fe,
    emissiveIntensity: 0.9,
    roughness: 0.12,
  });

  const brakeLightMat = new THREE.MeshStandardMaterial({
    color: 0x991b1b,
    emissive: 0xef4444,
    emissiveIntensity: 0.65,
    roughness: 0.15,
  });

  const reverseLightMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    emissive: 0xffffff,
    emissiveIntensity: 0.0,
    roughness: 0.2,
  });

  // 1. Sculpted Lofted Body Hull & Curved Glass Canopy
  const { bodyGeo, glassGeo } = buildSculptedHullGeometry(spec);
  const bodyMesh = new THREE.Mesh(bodyGeo, bodyMaterial);
  bodyMesh.castShadow = enableShadows;
  bodyMesh.receiveShadow = enableShadows;
  chassisGroup.add(bodyMesh);

  const glassMesh = new THREE.Mesh(glassGeo, glassMaterial);
  glassMesh.renderOrder = 2;
  chassisGroup.add(glassMesh);

  const halfL = spec.length * 0.5;
  const halfW = spec.width * 0.5;
  const gc = spec.groundClearance;
  const belt = spec.id === 'hypercar' ? 0.68 : spec.id === 'supercar' ? 0.72 : 0.78;

  // 2. Dark Wheel-Well Arch Liners (hides void behind wheels)
  const archGeo = new THREE.CylinderGeometry(
    spec.wheelRadius + 0.09,
    spec.wheelRadius + 0.09,
    0.34,
    18,
    1,
    false,
    0,
    Math.PI
  );
  archGeo.rotateZ(Math.PI / 2);
  archGeo.rotateY(Math.PI / 2);
  [
    [spec.trackWidth * 0.45, spec.wheelRadius, spec.wheelBase * 0.52],
    [-spec.trackWidth * 0.45, spec.wheelRadius, spec.wheelBase * 0.52],
    [spec.trackWidth * 0.45, spec.wheelRadius, -spec.wheelBase * 0.48],
    [-spec.trackWidth * 0.45, spec.wheelRadius, -spec.wheelBase * 0.48],
  ].forEach(([ax, ay, az]) => {
    const liner = new THREE.Mesh(archGeo, darkTrimMat);
    liner.position.set(ax, ay, az);
    chassisGroup.add(liner);
  });

  // 3. Sculpted Front Grille & Intakes + Model-Specific Accents
  const grilleY = gc + 0.16;
  const grilleMesh = new THREE.Mesh(
    new THREE.BoxGeometry(spec.width * 0.54, 0.16, 0.09),
    darkTrimMat
  );
  grilleMesh.position.set(0, grilleY, halfL - 0.01);
  chassisGroup.add(grilleMesh);

  if (spec.id === 'german') {
    // Twin sport kidney grille outline
    [-0.18, 0.18].forEach((gx) => {
      const k = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.20, 0.11), chromeMat);
      k.position.set(gx, grilleY + 0.05, halfL + 0.01);
      chassisGroup.add(k);
    });
  } else if (spec.id === 'muscle') {
    // V8 Hood Blower / Power Scoop
    const scoop = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.10, 0.92), carbonMaterial);
    scoop.position.set(0, belt - 0.02, halfL * 0.45);
    chassisGroup.add(scoop);
  } else if (spec.id === 'supercar' || spec.id === 'hypercar') {
    // Side Air Scoops + Rear Engine Plenum under Louvers
    [-1, 1].forEach((side) => {
      const scoop = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.28, 0.65), carbonMaterial);
      scoop.position.set(side * (halfW - 0.04), belt - 0.14, -0.35);
      chassisGroup.add(scoop);
    });
    const engineBlock = new THREE.Mesh(
      new THREE.BoxGeometry(0.68, 0.16, 0.85),
      new THREE.MeshStandardMaterial({ color: 0x991b1b, metalness: 0.7, roughness: 0.3 })
    );
    engineBlock.position.set(0, belt - 0.02, -halfL * 0.48);
    chassisGroup.add(engineBlock);
  }

  // 4. Aerodynamic Teardrop Side Mirrors & Door Handles
  [-1, 1].forEach((side) => {
    const stalk = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.035, 0.06), carbonMaterial);
    stalk.position.set(side * (halfW + 0.01), belt + 0.05, halfL * 0.22);
    const mirrorCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 12, 10).scale(1.2, 0.65, 1.4),
      bodyMaterial
    );
    mirrorCap.position.set(side * (halfW + 0.08), belt + 0.07, halfL * 0.22);
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.16), chromeMat);
    handle.position.set(side * (halfW * 0.94), belt - 0.06, -0.05);
    chassisGroup.add(stalk, mirrorCap, handle);
  });

  // 5. LED Headlight Blades + Volumetric Beam Cones + SpotLights
  const headlightSpots: THREE.SpotLight[] = [];
  const headlightCones: THREE.Mesh[] = [];
  const coneGeo = new THREE.ConeGeometry(1.75, 10.5, 16, 1, true);
  coneGeo.translate(0, -5.25, 0);
  coneGeo.rotateX(-Math.PI / 2);
  const coneMat = new THREE.MeshBasicMaterial({
    color: 0xe0f2fe,
    transparent: true,
    opacity: 0.14,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });

  [-1, 1].forEach((side) => {
    const hlMain = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.065, 0.14), headlightMat);
    hlMain.position.set(side * (halfW * 0.66), gc + 0.28, halfL - 0.08);
    hlMain.rotation.y = side * -0.25;
    hlMain.rotation.x = 0.15;
    chassisGroup.add(hlMain);

    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.set(side * (halfW * 0.62), gc + 0.28, halfL + 0.05);
    cone.visible = false;
    chassisGroup.add(cone);
    headlightCones.push(cone);

    if (!isSoftwareGl) {
      const spot = new THREE.SpotLight(0xf0f9ff, 0, 34, Math.PI / 4.5, 0.55, 1.4);
      spot.position.set(side * (halfW * 0.62), gc + 0.28, halfL + 0.12);
      spot.target.position.set(side * (halfW * 0.62), 0, halfL + 16);
      chassisGroup.add(spot, spot.target);
      headlightSpots.push(spot);
    }
  });

  // 6. Signature LED Tail Lights + Reverse Lights + Quad Sport Exhausts + Flames
  const tlY = belt - 0.02;
  if (spec.id === 'hypercar') {
    // Full-width LED lightbar
    const bar = new THREE.Mesh(new THREE.BoxGeometry(spec.width * 0.78, 0.045, 0.08), brakeLightMat);
    bar.position.set(0, tlY, -halfL - 0.01);
    chassisGroup.add(bar);
  } else if (spec.id === 'jdm') {
    // Iconic twin round JDM tail lights
    [-1, 1].forEach((side) => {
      [0.14, 0.34].forEach((off) => {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(0.068, 0.018, 8, 16),
          brakeLightMat
        );
        ring.position.set(side * (halfW * 0.56 + off * 0.5), tlY, -halfL - 0.01);
        chassisGroup.add(ring);
      });
    });
  } else {
    [-1, 1].forEach((side) => {
      const tl = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.065, 0.08), brakeLightMat);
      tl.position.set(side * (halfW * 0.58), tlY, -halfL - 0.01);
      chassisGroup.add(tl);
    });
  }

  [-1, 1].forEach((side) => {
    const rl = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.085), reverseLightMat);
    rl.position.set(side * (halfW * 0.36), tlY - 0.06, -halfL - 0.01);
    chassisGroup.add(rl);
  });

  // Quad Exhaust Pipes + Exhaust Backfire Flame Cones
  const exhaustFlames: THREE.Mesh[] = [];
  const exGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.16, 12).rotateX(Math.PI / 2);
  const flameGeo = new THREE.ConeGeometry(0.075, 0.48, 10);
  flameGeo.rotateX(-Math.PI / 2);
  flameGeo.translate(0, 0, -0.24);
  const flameMat = new THREE.MeshBasicMaterial({
    color: 0xf97316,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const exOffsets =
    spec.id === 'supercar' || spec.id === 'hypercar'
      ? [-0.18, -0.07, 0.07, 0.18]
      : [-0.62, -0.49, 0.49, 0.62];
  exOffsets.forEach((ex, i) => {
    const pipe = new THREE.Mesh(exGeo, chromeMat);
    pipe.position.set(ex, gc + 0.10, -halfL - 0.04);
    chassisGroup.add(pipe);
    if (i === 0 || i === 3) {
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.set(ex, gc + 0.10, -halfL - 0.08);
      flame.visible = false;
      chassisGroup.add(flame);
      exhaustFlames.push(flame);
    }
  });

  // Rear License Plate
  const rearPlate = new THREE.Mesh(
    new THREE.PlaneGeometry(0.44, 0.10),
    new THREE.MeshStandardMaterial({ map: textures.licensePlate, roughness: 0.35 })
  );
  rearPlate.position.set(0, gc + 0.24, -halfL - 0.015);
  rearPlate.rotation.y = Math.PI;
  chassisGroup.add(rearPlate);

  // 7. Customizable Containers (Spoiler, Aero Kit, Wheels)
  let spoilerGroup = new THREE.Group();
  let aeroKitGroup = new THREE.Group();
  chassisGroup.add(spoilerGroup, aeroKitGroup);

  // 8. Detailed Racing Cockpit Interior (visible in Camera 3: Salon)
  const interiorGroup = new THREE.Group();
  const dashMat = new THREE.MeshStandardMaterial({ color: 0x11151d, roughness: 0.7 });
  const dash = new THREE.Mesh(new THREE.BoxGeometry(spec.width * 0.72, 0.22, 0.36), dashMat);
  dash.position.set(0, belt - 0.04, halfL * 0.24);
  interiorGroup.add(dash);

  const gaugeScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.36, 0.14),
    new THREE.MeshBasicMaterial({ map: textures.dashboardGauge })
  );
  gaugeScreen.position.set(0.32, belt + 0.05, halfL * 0.24 - 0.185);
  gaugeScreen.rotation.y = Math.PI;
  interiorGroup.add(gaugeScreen);

  // Flat-bottom GT Steering Wheel (+X left-hand drive)
  const steeringWheel = new THREE.Group();
  const wRim = new THREE.Mesh(new THREE.TorusGeometry(0.145, 0.019, 10, 24), darkTrimMat);
  const topMarker = new THREE.Mesh(
    new THREE.BoxGeometry(0.032, 0.025, 0.042),
    new THREE.MeshStandardMaterial({ color: 0xef4444 })
  );
  topMarker.position.y = 0.145;
  const wSpoke = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.028, 0.02), chromeMat);
  const wHub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.042, 0.042, 0.04, 14).rotateX(Math.PI / 2),
    carbonMaterial
  );
  steeringWheel.add(wRim, topMarker, wSpoke, wHub);
  steeringWheel.position.set(0.32, belt + 0.03, halfL * 0.12);
  steeringWheel.rotation.x = -0.32;
  interiorGroup.add(steeringWheel);

  chassisGroup.add(interiorGroup);

  // 9. Four Wheel Pivots
  const halfTrack = spec.trackWidth * 0.5;
  const frontZ = spec.wheelBase * 0.52;
  const rearZ = -spec.wheelBase * 0.48;
  const wheelY = spec.wheelRadius;
  const frontW = spec.id === 'hypercar' || spec.id === 'supercar' ? 0.26 : 0.24;
  const rearW = spec.id === 'muscle' || spec.id === 'hypercar' ? 0.30 : 0.27;

  const frontLeftPivot = new THREE.Group();
  frontLeftPivot.position.set(halfTrack, wheelY, frontZ);
  const frontRightPivot = new THREE.Group();
  frontRightPivot.position.set(-halfTrack, wheelY, frontZ);
  const rearLeftPivot = new THREE.Group();
  rearLeftPivot.position.set(halfTrack, wheelY, rearZ);
  const rearRightPivot = new THREE.Group();
  rearRightPivot.position.set(-halfTrack, wheelY, rearZ);

  root.add(frontLeftPivot, frontRightPivot, rearLeftPivot, rearRightPivot);
  let wheelSpinGroups: THREE.Group[] = [];

  const rebuildWheels = (rimStyle: RimStyle, rimColorHex: string) => {
    const pivots = [
      { p: frontLeftPivot, w: frontW, left: true },
      { p: frontRightPivot, w: frontW, left: false },
      { p: rearLeftPivot, w: rearW, left: true },
      { p: rearRightPivot, w: rearW, left: false },
    ];
    wheelSpinGroups = [];
    pivots.forEach(({ p, w, left }) => {
      while (p.children.length > 0) {
        const child = p.children[0];
        p.remove(child);
        child.traverse((o) => {
          if ((o as THREE.Mesh).isMesh) {
            (o as THREE.Mesh).geometry.dispose();
            const mat = (o as THREE.Mesh).material;
            if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
            else mat.dispose();
          }
        });
      }
      const { spinGroup, caliperGroup } = buildPerformanceWheel(
        spec.wheelRadius,
        w,
        textures,
        rimStyle,
        rimColorHex,
        left
      );
      p.add(spinGroup, caliperGroup);
      wheelSpinGroups.push(spinGroup);
    });
    rig.wheelSpinGroups = wheelSpinGroups;
  };

  // 10. Ground Contact Shadow
  const contactShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(spec.width * 1.48, spec.length * 1.24).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({
      map: textures.contactShadow,
      transparent: true,
      opacity: 0.78,
      depthWrite: false,
    })
  );
  contactShadow.position.y = 0.025;
  root.add(contactShadow);

  // 11. Camera Anchors
  const cockpitAnchor = new THREE.Object3D();
  cockpitAnchor.position.set(0.32, belt + 0.25, -0.06);
  chassisGroup.add(cockpitAnchor);

  const chaseAnchor = new THREE.Object3D();
  chaseAnchor.position.set(0, spec.height + 1.38, -spec.length * 1.34);
  root.add(chaseAnchor);

  const closeAnchor = new THREE.Object3D();
  closeAnchor.position.set(0, spec.height + 0.56, -spec.length * 0.90);
  root.add(closeAnchor);

  const frontAnchor = new THREE.Object3D();
  frontAnchor.position.set(0, belt + 0.06, halfL * 0.65);
  chassisGroup.add(frontAnchor);

  const clearGroup = (g: THREE.Group) => {
    while (g.children.length > 0) {
      const c = g.children[0];
      g.remove(c);
      c.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).geometry.dispose();
      });
    }
  };

  let lastWheelKey = '';

  const applyCustomization = (custom: CarCustomization) => {
    // Body Paint & Finish
    const col = VEHICLE_COLORS.find((c) => c.id === custom.colorId);
    bodyMaterial.color.set(col ? col.hex : '#dc2626');
    if (custom.paintFinish === 'matte') {
      bodyMaterial.metalness = 0.25;
      bodyMaterial.roughness = 0.65;
      bodyMaterial.clearcoat = 0.1;
    } else if (custom.paintFinish === 'chrome') {
      bodyMaterial.metalness = 0.96;
      bodyMaterial.roughness = 0.08;
      bodyMaterial.clearcoat = 1.0;
    } else {
      bodyMaterial.metalness = 0.78;
      bodyMaterial.roughness = 0.18;
      bodyMaterial.clearcoat = 1.0;
    }

    // Window Tint
    const tintMap = {
      light: isSoftwareGl ? 0.36 : 0.28,
      medium: isSoftwareGl ? 0.52 : 0.44,
      dark: isSoftwareGl ? 0.68 : 0.62,
      limo: isSoftwareGl ? 0.85 : 0.82,
    };
    glassMaterial.opacity = tintMap[custom.windowTint];

    // Headlight Color
    const hlColorMap = {
      xenon: 0xe0f2fe,
      gt_gold: 0xfde047,
      laser_cyan: 0x38bdf8,
      neon_violet: 0xc084fc,
    };
    const hlHex = hlColorMap[custom.headlightStyle];
    headlightMat.emissive.setHex(hlHex);
    coneMat.color.setHex(hlHex);
    headlightSpots.forEach((s) => s.color.setHex(hlHex));

    // Rebuild Spoiler
    clearGroup(spoilerGroup);
    const nextSpoiler = buildSpoilerMesh(custom.spoiler, spec, bodyMaterial, carbonMaterial);
    spoilerGroup.add(nextSpoiler);

    // Rebuild Aero Kit (Front Bumper, Rear Bumper, Side Skirts)
    clearGroup(aeroKitGroup);
    const nextAero = buildAeroKitParts(
      spec,
      custom.frontBumper,
      custom.rearBumper,
      custom.sideSkirts,
      bodyMaterial,
      carbonMaterial
    );
    aeroKitGroup.add(nextAero);

    // Rebuild Wheels only when style or rim color changes
    const wheelKey = `${custom.rimStyle}:${custom.rimColorHex}`;
    if (wheelKey !== lastWheelKey) {
      lastWheelKey = wheelKey;
      rebuildWheels(custom.rimStyle, custom.rimColorHex);
    }
  };

  const setHeadlights = (on: boolean) => {
    headlightMat.emissiveIntensity = on ? 2.6 : 0.75;
    headlightCones.forEach((cone) => {
      cone.visible = on;
    });
    headlightSpots.forEach((spot) => {
      spot.intensity = on ? 22 : 0;
    });
  };

  const setBrakeAndReverse = (braking: boolean, reversing: boolean) => {
    brakeLightMat.emissiveIntensity = braking ? 3.2 : 0.55;
    reverseLightMat.emissiveIntensity = reversing ? 2.4 : 0.0;
  };

  const setExhaustFlame = (intensity: number) => {
    const show = intensity > 0.1;
    exhaustFlames.forEach((f) => {
      f.visible = show;
      if (show) {
        const s = 0.6 + intensity * 0.9 + Math.random() * 0.35;
        f.scale.set(1, 1, s);
      }
    });
  };

  const dispose = () => {
    root.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else {
          mesh.material.dispose();
        }
      }
    });
  };

  const rig: VehicleRig = {
    root,
    chassisGroup,
    bodyMaterial,
    glassMaterial,
    carbonMaterial,
    steeringWheel,
    frontLeftPivot,
    frontRightPivot,
    wheelSpinGroups,
    brakeLightMat,
    reverseLightMat,
    headlightMat,
    headlightSpots,
    headlightCones,
    exhaustFlames,
    cockpitAnchor,
    chaseAnchor,
    closeAnchor,
    frontAnchor,
    applyCustomization,
    setHeadlights,
    setBrakeAndReverse,
    setExhaustFlame,
    dispose,
  };

  applyCustomization(initialCustom);
  return rig;
}

export function createStaticParkedCar(
  colorHex: string,
  textures: CityTextures,
  enableShadows: boolean
): THREE.Group {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(colorHex),
    metalness: 0.7,
    roughness: 0.22,
    clearcoat: 0.9,
  });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x14171c, roughness: 0.85 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.12, metalness: 0.45 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.88, roughness: 0.2 });

  const lower = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.54, 4.45), bodyMat);
  lower.position.y = 0.44;
  lower.castShadow = enableShadows;
  lower.receiveShadow = enableShadows;
  group.add(lower);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.48, 2.2), bodyMat);
  cabin.position.set(0, 0.92, -0.15);
  cabin.castShadow = enableShadows;
  group.add(cabin);

  const glass = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.34, 2.26), glassMat);
  glass.position.set(0, 0.90, -0.15);
  group.add(glass);

  const wheelGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.22, 14).rotateZ(Math.PI / 2);
  const rimGeo = new THREE.CylinderGeometry(0.21, 0.21, 0.23, 10).rotateZ(Math.PI / 2);
  [
    [0.84, 1.35],
    [-0.84, 1.35],
    [0.84, -1.35],
    [-0.84, -1.35],
  ].forEach(([wx, wz]) => {
    const w = new THREE.Mesh(wheelGeo, darkMat);
    w.position.set(wx, 0.34, wz);
    const r = new THREE.Mesh(rimGeo, rimMat);
    r.position.copy(w.position);
    group.add(w, r);
  });

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 5.1).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({
      map: textures.contactShadow,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    })
  );
  shadow.position.y = 0.025;
  group.add(shadow);

  return group;
}
