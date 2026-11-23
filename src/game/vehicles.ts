import * as THREE from 'three';
import { VEHICLE_COLORS } from '../data/gameData';
import { VehicleSpec } from '../types/game';
import { CityTextures } from './textures';

export interface VehicleRig {
  root: THREE.Group;
  chassisGroup: THREE.Group;
  bodyMaterial: THREE.MeshPhysicalMaterial;
  steeringWheel: THREE.Group;
  frontLeftPivot: THREE.Group;
  frontRightPivot: THREE.Group;
  wheelMeshes: THREE.Group[];
  brakeLightMat: THREE.MeshStandardMaterial;
  reverseLightMat: THREE.MeshStandardMaterial;
  headlightMat: THREE.MeshStandardMaterial;
  headlightSpots: THREE.SpotLight[];
  headlightCones: THREE.Mesh[];
  cockpitAnchor: THREE.Object3D;
  chaseAnchor: THREE.Object3D;
  closeAnchor: THREE.Object3D;
  frontAnchor: THREE.Object3D;
  setBodyColor: (colorIdOrHex: string) => void;
  setHeadlights: (on: boolean) => void;
  setBrakeAndReverse: (braking: boolean, reversing: boolean) => void;
  dispose: () => void;
}

function createBodyProfileShape(spec: VehicleSpec): THREE.Shape {
  const halfL = spec.length * 0.5;
  const baseH = spec.groundClearance;
  const beltY = spec.id === 'suv' ? 0.96 : spec.id === 'sport' ? 0.72 : 0.80;
  const roofY = spec.height;
  const noseY = spec.id === 'sport' ? 0.48 : spec.id === 'suv' ? 0.78 : 0.58;
  const hoodZ = halfL * 0.36;
  const windshieldTopZ = spec.id === 'sport' ? halfL * 0.06 : halfL * 0.14;
  const roofRearZ = spec.id === 'suv' ? -halfL * 0.74 : spec.id === 'sport' ? -halfL * 0.38 : -halfL * 0.45;
  const trunkZ = -halfL * 0.86;

  // Profile in (Z, Y) plane, then extruded along X
  const shape = new THREE.Shape();
  shape.moveTo(-halfL, baseH + 0.08);
  shape.lineTo(halfL - 0.14, baseH + 0.02);
  shape.quadraticCurveTo(halfL + 0.04, baseH + 0.06, halfL, noseY);
  shape.lineTo(halfL - 0.15, beltY - 0.08);
  shape.lineTo(hoodZ, beltY);
  shape.lineTo(windshieldTopZ, roofY);
  shape.lineTo(roofRearZ, roofY);
  shape.lineTo(trunkZ, beltY + 0.04);
  shape.lineTo(-halfL + 0.04, beltY - 0.02);
  shape.lineTo(-halfL, baseH + 0.08);
  return shape;
}

function buildWheel(radius: number, width: number, isSport: boolean): THREE.Group {
  const wheel = new THREE.Group();

  // Tire (cylinder rotated along X)
  const tireGeo = new THREE.CylinderGeometry(radius, radius, width, 24);
  tireGeo.rotateZ(Math.PI / 2);
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x181b20,
    roughness: 0.85,
    metalness: 0.05,
  });
  const tire = new THREE.Mesh(tireGeo, tireMat);
  tire.castShadow = true;
  wheel.add(tire);

  // Sidewall bevel ring
  const sideGeo = new THREE.TorusGeometry(radius * 0.72, radius * 0.09, 8, 24);
  sideGeo.rotateY(Math.PI / 2);
  const sideL = new THREE.Mesh(sideGeo, tireMat);
  sideL.position.x = width * 0.44;
  const sideR = sideL.clone();
  sideR.position.x = -width * 0.44;
  wheel.add(sideL, sideR);

  // Alloy Rim Dish
  const rimGeo = new THREE.CylinderGeometry(radius * 0.64, radius * 0.64, width * 0.88, 20);
  rimGeo.rotateZ(Math.PI / 2);
  const rimMat = new THREE.MeshStandardMaterial({
    color: isSport ? 0x334155 : 0xcbd5e1,
    metalness: 0.88,
    roughness: 0.22,
  });
  const rim = new THREE.Mesh(rimGeo, rimMat);
  wheel.add(rim);

  // Spokes (5 twin spokes)
  const spokeMat = new THREE.MeshStandardMaterial({
    color: isSport ? 0xf8fafc : 0xe2e8f0,
    metalness: 0.92,
    roughness: 0.18,
  });
  const spokeGeo = new THREE.BoxGeometry(width * 0.94, radius * 1.15, radius * 0.11);
  for (let i = 0; i < 5; i++) {
    const spoke = new THREE.Mesh(spokeGeo, spokeMat);
    spoke.rotation.x = (i * Math.PI) / 5;
    wheel.add(spoke);
  }

  // Center Hub Cap
  const hubGeo = new THREE.CylinderGeometry(radius * 0.18, radius * 0.18, width * 0.96, 14);
  hubGeo.rotateZ(Math.PI / 2);
  const hubMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    metalness: 0.7,
    roughness: 0.25,
  });
  wheel.add(new THREE.Mesh(hubGeo, hubMat));

  return wheel;
}

export function createVehicleModel(
  spec: VehicleSpec,
  colorIdOrHex: string,
  textures: CityTextures,
  isSoftwareGl: boolean,
  enableShadows: boolean
): VehicleRig {
  const root = new THREE.Group();
  const chassisGroup = new THREE.Group();
  root.add(chassisGroup);

  const foundColor = VEHICLE_COLORS.find((c) => c.id === colorIdOrHex);
  const initialHex = foundColor ? foundColor.hex : colorIdOrHex;

  // 1. Primary Metallic Clearcoat Car Paint Material
  const bodyMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(initialHex),
    metalness: foundColor ? foundColor.metalness : 0.65,
    roughness: foundColor ? foundColor.roughness : 0.22,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    envMapIntensity: 1.25,
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x11151c,
    roughness: 0.55,
    metalness: 0.25,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.95,
    roughness: 0.12,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x102030,
    metalness: 0.1,
    roughness: 0.08,
    transparent: true,
    opacity: isSoftwareGl ? 0.52 : 0.42,
    ior: 1.5,
    clearcoat: 1.0,
    depthWrite: false,
  });

  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    emissive: 0xfffbeb,
    emissiveIntensity: 0.35,
    roughness: 0.15,
    metalness: 0.1,
  });

  const brakeLightMat = new THREE.MeshStandardMaterial({
    color: 0x991b1b,
    emissive: 0xef4444,
    emissiveIntensity: 0.35,
    roughness: 0.2,
  });

  const reverseLightMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    emissive: 0xffffff,
    emissiveIntensity: 0.0,
    roughness: 0.2,
  });

  // 2. Extruded Sculpted Body Hull (centered along X)
  const profile = createBodyProfileShape(spec);
  const bodyWidth = spec.width - 0.16;
  const extrudeGeo = new THREE.ExtrudeGeometry(profile, {
    steps: 1,
    depth: bodyWidth,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.06,
    bevelSegments: 3,
  });
  // ExtrudeGeometry extrudes in +Z from 2D (X, Y). Rotate so profile X->Z and extrusion Z->X
  extrudeGeo.translate(0, 0, -bodyWidth * 0.5);
  extrudeGeo.rotateY(-Math.PI / 2);
  // Wait: rotating -Math.PI/2 around Y maps +X -> +Z, +Z -> -X. Let's verify:
  // Profile had x = Z_coord (-halfL to +halfL). After rotateY(-PI/2): newX = -oldZ, newZ = oldX!
  // Since oldZ was centered [-bodyWidth/2, +bodyWidth/2], newX is centered! And oldX (-halfL..+halfL) becomes newZ!
  extrudeGeo.computeVertexNormals();

  const bodyMesh = new THREE.Mesh(extrudeGeo, bodyMaterial);
  bodyMesh.castShadow = enableShadows;
  bodyMesh.receiveShadow = enableShadows;
  chassisGroup.add(bodyMesh);

  const halfL = spec.length * 0.5;
  const halfW = spec.width * 0.5;

  // 3. Lower Bumpers & Side Skirts (accent trim)
  const skirtGeo = new THREE.BoxGeometry(spec.width * 0.96, 0.13, spec.length * 0.99);
  const skirt = new THREE.Mesh(skirtGeo, trimMat);
  skirt.position.set(0, spec.groundClearance + 0.06, 0);
  skirt.castShadow = enableShadows;
  chassisGroup.add(skirt);

  // 4. Tinted Greenhouse / Windows (Front windshield, rear window, side windows)
  const beltY = spec.id === 'suv' ? 0.96 : spec.id === 'sport' ? 0.72 : 0.80;
  const roofY = spec.height;
  const cabinH = roofY - beltY;
  const frontGlassZ = halfL * 0.24;
  const rearGlassZ = spec.id === 'suv' ? -halfL * 0.72 : -halfL * 0.58;

  const frontWindshield = new THREE.Mesh(
    new THREE.PlaneGeometry(spec.width * 0.76, cabinH * 1.48),
    glassMat
  );
  frontWindshield.position.set(0, beltY + cabinH * 0.48, frontGlassZ + 0.06);
  frontWindshield.rotation.x = -Math.PI * 0.31;
  frontWindshield.renderOrder = 2;
  chassisGroup.add(frontWindshield);

  const rearWindshield = new THREE.Mesh(
    new THREE.PlaneGeometry(spec.width * 0.74, cabinH * 1.38),
    glassMat
  );
  rearWindshield.position.set(0, beltY + cabinH * 0.48, rearGlassZ - 0.02);
  rearWindshield.rotation.x = Math.PI * 0.28;
  rearWindshield.rotation.y = Math.PI;
  rearWindshield.renderOrder = 2;
  chassisGroup.add(rearWindshield);

  // Side window strips
  const sideWinLen = Math.abs(frontGlassZ - rearGlassZ) * 0.86;
  const sideWinGeo = new THREE.BoxGeometry(spec.width * 0.92, cabinH * 0.68, sideWinLen);
  const sideWin = new THREE.Mesh(sideWinGeo, glassMat);
  sideWin.position.set(0, beltY + cabinH * 0.46, (frontGlassZ + rearGlassZ) * 0.5);
  sideWin.renderOrder = 2;
  chassisGroup.add(sideWin);

  // 5. Front Grille & Chrome Bar
  const grilleY = spec.groundClearance + (spec.id === 'suv' ? 0.40 : 0.28);
  const grille = new THREE.Mesh(
    new THREE.BoxGeometry(spec.width * 0.52, spec.id === 'luxury' ? 0.28 : 0.20, 0.08),
    spec.id === 'luxury' ? chromeMat : trimMat
  );
  grille.position.set(0, grilleY, halfL + 0.02);
  chassisGroup.add(grille);

  // 6. Side Mirrors (Left & Right)
  const mirrorGeo = new THREE.BoxGeometry(0.18, 0.11, 0.13);
  const mirrorStemGeo = new THREE.BoxGeometry(0.10, 0.05, 0.06);
  [-1, 1].forEach((side) => {
    const mGroup = new THREE.Group();
    const housing = new THREE.Mesh(mirrorGeo, bodyMaterial);
    const stem = new THREE.Mesh(mirrorStemGeo, trimMat);
    stem.position.x = -side * 0.09;
    mGroup.add(housing, stem);
    mGroup.position.set(side * (halfW + 0.05), beltY + 0.07, halfL * 0.24);
    chassisGroup.add(mGroup);
  });

  // 7. Uzbek License Plates (Front & Rear)
  const plateGeo = new THREE.PlaneGeometry(0.46, 0.11);
  const plateMat = new THREE.MeshStandardMaterial({
    map: textures.licensePlate,
    roughness: 0.35,
    metalness: 0.1,
  });
  const frontPlate = new THREE.Mesh(plateGeo, plateMat);
  frontPlate.position.set(0, spec.groundClearance + 0.15, halfL + 0.065);
  const rearPlate = new THREE.Mesh(plateGeo, plateMat);
  rearPlate.position.set(0, spec.groundClearance + 0.30, -halfL - 0.065);
  rearPlate.rotation.y = Math.PI;
  chassisGroup.add(frontPlate, rearPlate);

  // 8. Model-Specific Aero / Accents (Spoiler for Sport, Roof Rails for SUV, Chrome Trim for Luxury)
  if (spec.id === 'sport') {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(spec.width * 0.84, 0.04, 0.24), trimMat);
    wing.position.set(0, beltY + 0.18, -halfL + 0.18);
    const pylonGeo = new THREE.BoxGeometry(0.05, 0.14, 0.12);
    const pL = new THREE.Mesh(pylonGeo, trimMat);
    pL.position.set(0.42, beltY + 0.10, -halfL + 0.18);
    const pR = pL.clone();
    pR.position.x = -0.42;
    chassisGroup.add(wing, pL, pR);
  } else if (spec.id === 'suv') {
    const railGeo = new THREE.BoxGeometry(0.06, 0.06, spec.length * 0.48);
    const rL = new THREE.Mesh(railGeo, chromeMat);
    rL.position.set(halfW * 0.64, roofY + 0.05, -0.25);
    const rR = rL.clone();
    rR.position.x = -halfW * 0.64;
    chassisGroup.add(rL, rR);
  } else if (spec.id === 'luxury') {
    const chromeStrip = new THREE.Mesh(
      new THREE.BoxGeometry(spec.width * 0.95, 0.035, spec.length * 0.90),
      chromeMat
    );
    chromeStrip.position.set(0, beltY - 0.02, 0);
    chassisGroup.add(chromeStrip);
  }

  // Twin Exhaust Tips
  const exhaustGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.14, 12);
  exhaustGeo.rotateX(Math.PI / 2);
  [-0.55, 0.55].forEach((ex) => {
    const tip = new THREE.Mesh(exhaustGeo, chromeMat);
    tip.position.set(ex, spec.groundClearance + 0.07, -halfL - 0.02);
    chassisGroup.add(tip);
  });

  // 9. Headlights + Volumetric Beam Cones + SpotLights
  const hlGeo = new THREE.BoxGeometry(0.28, 0.11, 0.08);
  const hlY = grilleY + 0.06;
  const headlightSpots: THREE.SpotLight[] = [];
  const headlightCones: THREE.Mesh[] = [];
  const coneGeo = new THREE.ConeGeometry(1.6, 8.5, 16, 1, true);
  coneGeo.translate(0, -4.25, 0);
  coneGeo.rotateX(-Math.PI / 2);
  const coneMat = new THREE.MeshBasicMaterial({
    color: 0xfef3c7,
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });

  [-1, 1].forEach((side) => {
    const hl = new THREE.Mesh(hlGeo, headlightMat);
    hl.position.set(side * (halfW - 0.28), hlY, halfL + 0.02);
    chassisGroup.add(hl);

    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.set(side * (halfW - 0.28), hlY, halfL + 0.08);
    cone.visible = false;
    chassisGroup.add(cone);
    headlightCones.push(cone);

    if (!isSoftwareGl) {
      const spot = new THREE.SpotLight(0xfffbeb, 0, 26, Math.PI / 5, 0.5, 1.5);
      spot.position.set(side * (halfW - 0.28), hlY, halfL + 0.12);
      spot.target.position.set(side * (halfW - 0.28), 0, halfL + 14);
      chassisGroup.add(spot, spot.target);
      headlightSpots.push(spot);
    }
  });

  // 10. Rear Brake & Reverse Lights
  const tlGeo = new THREE.BoxGeometry(0.32, 0.11, 0.08);
  const rlGeo = new THREE.BoxGeometry(0.14, 0.07, 0.085);
  const tlY = beltY - 0.08;
  [-1, 1].forEach((side) => {
    const tl = new THREE.Mesh(tlGeo, brakeLightMat);
    tl.position.set(side * (halfW - 0.28), tlY, -halfL - 0.02);
    chassisGroup.add(tl);

    const rl = new THREE.Mesh(rlGeo, reverseLightMat);
    rl.position.set(side * (halfW - 0.52), tlY - 0.03, -halfL - 0.025);
    chassisGroup.add(rl);
  });

  // 11. Detailed Cockpit Interior (visible in Camera 3: Salon)
  const interiorGroup = new THREE.Group();
  const dashMat = new THREE.MeshStandardMaterial({ color: 0x161b24, roughness: 0.72, metalness: 0.1 });
  const dash = new THREE.Mesh(new THREE.BoxGeometry(spec.width * 0.78, 0.24, 0.38), dashMat);
  dash.position.set(0, beltY - 0.04, halfL * 0.26);
  interiorGroup.add(dash);

  const gaugeScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.34, 0.14),
    new THREE.MeshBasicMaterial({ map: textures.dashboardGauge })
  );
  gaugeScreen.position.set(0.34, beltY + 0.05, halfL * 0.26 - 0.195);
  gaugeScreen.rotation.y = Math.PI;
  interiorGroup.add(gaugeScreen);

  // Steering Wheel on Left Side (+X = driver side)
  const steeringWheel = new THREE.Group();
  const wheelRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.155, 0.02, 10, 24),
    trimMat
  );
  const wheelHub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.045, 0.04, 14),
    trimMat
  );
  wheelHub.rotation.x = Math.PI / 2;
  const wheelSpoke = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.028, 0.02), chromeMat);
  steeringWheel.add(wheelRim, wheelHub, wheelSpoke);
  steeringWheel.position.set(0.35, beltY + 0.03, halfL * 0.14);
  steeringWheel.rotation.x = -0.32;
  interiorGroup.add(steeringWheel);

  // Driver & Passenger Seat Headrests
  const seatGeo = new THREE.BoxGeometry(0.42, 0.48, 0.16);
  [-0.36, 0.36].forEach((sx) => {
    const seat = new THREE.Mesh(seatGeo, dashMat);
    seat.position.set(sx, beltY - 0.10, -0.35);
    interiorGroup.add(seat);
  });
  chassisGroup.add(interiorGroup);

  // 12. Four Wheels (Front Left/Right with steering pivots, Rear Left/Right)
  const wheelW = spec.id === 'sport' ? 0.26 : 0.23;
  const halfTrack = spec.trackWidth * 0.5;
  const frontZ = spec.wheelBase * 0.52;
  const rearZ = -spec.wheelBase * 0.48;
  const wheelY = spec.wheelRadius;

  const frontLeftPivot = new THREE.Group();
  frontLeftPivot.position.set(halfTrack, wheelY, frontZ);
  const flWheel = buildWheel(spec.wheelRadius, wheelW, spec.id === 'sport');
  frontLeftPivot.add(flWheel);

  const frontRightPivot = new THREE.Group();
  frontRightPivot.position.set(-halfTrack, wheelY, frontZ);
  const frWheel = buildWheel(spec.wheelRadius, wheelW, spec.id === 'sport');
  frontRightPivot.add(frWheel);

  const rlWheel = buildWheel(spec.wheelRadius, wheelW, spec.id === 'sport');
  rlWheel.position.set(halfTrack, wheelY, rearZ);

  const rrWheel = buildWheel(spec.wheelRadius, wheelW, spec.id === 'sport');
  rrWheel.position.set(-halfTrack, wheelY, rearZ);

  root.add(frontLeftPivot, frontRightPivot, rlWheel, rrWheel);
  const wheelMeshes = [flWheel, frWheel, rlWheel, rrWheel];

  // 13. Ground Contact Shadow Plane (y = 0.025)
  const contactShadowGeo = new THREE.PlaneGeometry(spec.width * 1.45, spec.length * 1.25);
  contactShadowGeo.rotateX(-Math.PI / 2);
  const contactShadowMat = new THREE.MeshBasicMaterial({
    map: textures.contactShadow,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
  });
  const contactShadow = new THREE.Mesh(contactShadowGeo, contactShadowMat);
  contactShadow.position.y = 0.025;
  root.add(contactShadow);

  // 14. Camera Anchors
  const cockpitAnchor = new THREE.Object3D();
  cockpitAnchor.position.set(0.35, beltY + 0.30, -0.05);
  chassisGroup.add(cockpitAnchor);

  const chaseAnchor = new THREE.Object3D();
  chaseAnchor.position.set(0, spec.height + 1.55, -spec.length * 1.38);
  root.add(chaseAnchor);

  const closeAnchor = new THREE.Object3D();
  closeAnchor.position.set(0, spec.height + 0.65, -spec.length * 0.92);
  root.add(closeAnchor);

  const frontAnchor = new THREE.Object3D();
  frontAnchor.position.set(0, beltY + 0.14, halfL * 0.62);
  chassisGroup.add(frontAnchor);

  const setBodyColor = (colorId: string) => {
    const c = VEHICLE_COLORS.find((item) => item.id === colorId);
    if (c) {
      bodyMaterial.color.set(c.hex);
      bodyMaterial.metalness = c.metalness;
      bodyMaterial.roughness = c.roughness;
    } else {
      bodyMaterial.color.set(colorId);
    }
  };

  const setHeadlights = (on: boolean) => {
    headlightMat.emissiveIntensity = on ? 2.4 : 0.35;
    headlightCones.forEach((cone) => {
      cone.visible = on;
    });
    headlightSpots.forEach((spot) => {
      spot.intensity = on ? 18 : 0;
    });
  };

  const setBrakeAndReverse = (braking: boolean, reversing: boolean) => {
    brakeLightMat.emissiveIntensity = braking ? 2.8 : 0.4;
    reverseLightMat.emissiveIntensity = reversing ? 2.2 : 0.0;
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

  return {
    root,
    chassisGroup,
    bodyMaterial,
    steeringWheel,
    frontLeftPivot,
    frontRightPivot,
    wheelMeshes,
    brakeLightMat,
    reverseLightMat,
    headlightMat,
    headlightSpots,
    headlightCones,
    cockpitAnchor,
    chaseAnchor,
    closeAnchor,
    frontAnchor,
    setBodyColor,
    setHeadlights,
    setBrakeAndReverse,
    dispose,
  };
}

// Lightweight static parked car for parking mission props & city parking lots
export function createStaticParkedCar(
  colorHex: string,
  textures: CityTextures,
  enableShadows: boolean
): THREE.Group {
  const group = new THREE.Group();

  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(colorHex),
    metalness: 0.65,
    roughness: 0.25,
    clearcoat: 0.85,
  });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x181b20, roughness: 0.85 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.15, metalness: 0.4 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.85, roughness: 0.25 });

  // Lower body
  const lower = new THREE.Mesh(new THREE.BoxGeometry(1.86, 0.56, 4.45), bodyMat);
  lower.position.y = 0.46;
  lower.castShadow = enableShadows;
  lower.receiveShadow = enableShadows;
  group.add(lower);

  // Cabin
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.52, 2.25), bodyMat);
  cabin.position.set(0, 0.96, -0.15);
  cabin.castShadow = enableShadows;
  group.add(cabin);

  // Glass band
  const glass = new THREE.Mesh(new THREE.BoxGeometry(1.60, 0.36, 2.30), glassMat);
  glass.position.set(0, 0.94, -0.15);
  group.add(glass);

  // Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.22, 14);
  wheelGeo.rotateZ(Math.PI / 2);
  const rimGeo = new THREE.CylinderGeometry(0.20, 0.20, 0.23, 10);
  rimGeo.rotateZ(Math.PI / 2);
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

  // Contact shadow
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
