import * as THREE from 'three';
import { CityTextures } from './textures';

export interface ColliderBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  tag?: 'building' | 'curb' | 'prop' | 'pole';
}

export interface TrafficLightController {
  x: number;
  z: number;
  axis: 'ns' | 'ew';
  phaseOffset: number;
  redMesh: THREE.Mesh;
  yellowMesh: THREE.Mesh;
  greenMesh: THREE.Mesh;
}

export interface CityEnvironment {
  group: THREE.Group;
  colliders: ColliderBox[];
  updateTrafficLights: (elapsedSec: number) => void;
  getSignalStateNear: (x: number, z: number) => 'green' | 'yellow' | 'red' | null;
  setNightMode: (night: boolean) => void;
  dispose: () => void;
}

export function buildCityEnvironment(
  textures: CityTextures,
  enableShadows: boolean,
  quality: 'low' | 'medium' | 'high'
): CityEnvironment {
  const group = new THREE.Group();
  const colliders: ColliderBox[] = [];
  const trafficLights: TrafficLightController[] = [];

  // 1. Sky Dome
  const skyGeo = new THREE.SphereGeometry(320, 24, 16);
  const skyMat = new THREE.MeshBasicMaterial({
    map: textures.skyDome,
    side: THREE.BackSide,
    fog: false,
  });
  const skyDome = new THREE.Mesh(skyGeo, skyMat);
  group.add(skyDome);

  // 2. Infinite Horizon Ground (Grass / Steppe Parkland)
  const groundGeo = new THREE.PlaneGeometry(600, 600);
  groundGeo.rotateX(-Math.PI / 2);
  const groundMat = new THREE.MeshStandardMaterial({
    map: textures.grass,
    roughness: 0.92,
    metalness: 0.0,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.position.y = 0;
  ground.receiveShadow = enableShadows;
  group.add(ground);

  // 3. Road Network Asphalt (Offset y = 0.015 to avoid Z-fighting)
  const asphaltMat = new THREE.MeshStandardMaterial({
    map: textures.asphalt,
    roughness: 0.82,
    metalness: 0.04,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  const addRoadPad = (cx: number, cz: number, w: number, d: number) => {
    const geo = new THREE.PlaneGeometry(w, d);
    geo.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geo, asphaltMat);
    mesh.position.set(cx, 0.015, cz);
    mesh.receiveShadow = enableShadows;
    group.add(mesh);
  };

  // Main North-South Mustaqillik Boulevard (x in [-16, 16], z in [-72, 72])
  addRoadPad(0, 0, 32, 144);
  // Central East-West Avenue (x in [-64, 64], z in [-10, 10])
  addRoadPad(0, 0, 128, 20);
  // Northern Ring Avenue (z in [-56, -40])
  addRoadPad(0, -48, 128, 16);
  // Southern Ring Avenue (z in [40, 56])
  addRoadPad(0, 48, 128, 16);
  // Eastern Ring Avenue (x in [42, 60])
  addRoadPad(51, 0, 18, 112);
  // Western Ring Avenue (x in [-60, -42])
  addRoadPad(-51, 0, 18, 112);

  // Savdo Markazi Parking Lot (East-South: x in [16, 46], z in [10, 40])
  addRoadPad(31, 25, 30, 30);
  // Toshkent Plaza Parking Lot (East-North: x in [16, 46], z in [-40, -10])
  addRoadPad(31, -25, 30, 30);
  // Avtoservis Courtyard (West-South: x in [-60, -36], z in [18, 42])
  addRoadPad(-48, 30, 24, 24);
  // Business VIP Parking Lot (West-North: x in [-60, -36], z in [-42, -34])
  addRoadPad(-48, -38, 24, 14);

  // 4. Road Markings (Double Yellow Centerlines, Dashed Lanes, Crosswalks, Parking Bays)
  const whiteLineMat = new THREE.MeshBasicMaterial({
    color: 0xe2e8f0,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const yellowLineMat = new THREE.MeshBasicMaterial({
    color: 0xfbbf24,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });

  const addStripe = (x: number, z: number, w: number, d: number, yellow = false) => {
    const geo = new THREE.PlaneGeometry(w, d);
    geo.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(geo, yellow ? yellowLineMat : whiteLineMat);
    m.position.set(x, 0.025, z);
    group.add(m);
  };

  // Central Boulevard double yellow centerline (broken at intersections)
  [
    [-62, -14],
    [14, 38],
  ].forEach(([z1, z2]) => {
    const len = z2 - z1;
    const mid = (z1 + z2) * 0.5;
    addStripe(-0.22, mid, 0.16, len, true);
    addStripe(0.22, mid, 0.16, len, true);
  });

  // Dashed lane dividers along Mustaqillik Boulevard
  for (let z = -60; z <= 36; z += 6) {
    if (Math.abs(z) < 12) continue;
    addStripe(-6.5, z, 0.16, 2.8);
    addStripe(6.5, z, 0.16, 2.8);
  }

  // East-West Avenue centerlines & crosswalks
  [-32, 32].forEach((cx) => {
    addStripe(cx, -0.2, 24, 0.16, true);
    addStripe(cx, 0.2, 24, 0.16, true);
  });
  // Zebra Crosswalks around central intersection
  for (let i = -10; i <= 10; i += 2.2) {
    addStripe(i, -11.5, 1.0, 2.6);
    addStripe(i, 11.5, 1.0, 2.6);
  }
  for (let i = -7; i <= 7; i += 2.2) {
    addStripe(-17.5, i, 2.6, 1.0);
    addStripe(17.5, i, 2.6, 1.0);
  }

  // Painted Parking Bays in Savdo Markazi & Toshkent Plaza
  [13.5, 18.0, 22.5, 27.0].forEach((pz) => {
    addStripe(40, pz - 1.6, 5.6, 0.12);
    addStripe(40, pz + 1.6, 5.6, 0.12);
    addStripe(42.8, pz, 0.12, 3.2);
  });
  [-29.5, -34.0, -38.5].forEach((pz) => {
    addStripe(42, pz - 1.6, 5.6, 0.12);
    addStripe(42, pz + 1.6, 5.6, 0.12);
    addStripe(44.8, pz, 0.12, 3.2);
  });

  // 5. Raised Sidewalks & Curbs (y = 0.08, offset cleanly)
  const sidewalkMat = new THREE.MeshStandardMaterial({
    map: textures.sidewalk,
    roughness: 0.85,
    metalness: 0.02,
  });

  const addSidewalkBlock = (cx: number, cz: number, w: number, d: number, addCollider = false) => {
    const geo = new THREE.BoxGeometry(w, 0.14, d);
    const mesh = new THREE.Mesh(geo, sidewalkMat);
    mesh.position.set(cx, 0.07, cz);
    mesh.receiveShadow = enableShadows;
    group.add(mesh);
    if (addCollider) {
      colliders.push({
        minX: cx - w * 0.5,
        maxX: cx + w * 0.5,
        minZ: cz - d * 0.5,
        maxZ: cz + d * 0.5,
        tag: 'curb',
      });
    }
  };

  // Inner quadrant raised islands (buildings sit on top of these)
  addSidewalkBlock(-28, -24, 18, 20, true); // NW Business block
  addSidewalkBlock(-28, 24, 18, 20, true);  // SW Service/Cafe block
  // Outer perimeter sidewalks
  addSidewalkBlock(75, 0, 26, 130, false);
  addSidewalkBlock(-75, 0, 26, 130, false);
  addSidewalkBlock(0, -75, 130, 26, false);
  addSidewalkBlock(0, 75, 130, 26, false);

  // 6. Modern Central Asian Buildings & Landmarks
  const glassMat = new THREE.MeshStandardMaterial({
    map: textures.glassFacade,
    roughness: 0.25,
    metalness: 0.65,
  });
  const sandstoneMat = new THREE.MeshStandardMaterial({
    map: textures.sandstoneFacade,
    roughness: 0.78,
    metalness: 0.05,
  });
  const turquoiseMat = new THREE.MeshStandardMaterial({
    color: 0x0891b2,
    roughness: 0.3,
    metalness: 0.4,
  });
  const goldTrimMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    roughness: 0.3,
    metalness: 0.85,
  });
  const concreteMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.85,
  });

  const addBuilding = (
    cx: number,
    cz: number,
    w: number,
    d: number,
    h: number,
    style: 'glass' | 'sandstone' | 'dome' | 'garage'
  ) => {
    const bGroup = new THREE.Group();
    const baseMat = style === 'glass' ? glassMat : style === 'garage' ? concreteMat : sandstoneMat;
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), baseMat);
    body.position.y = h * 0.5;
    body.castShadow = enableShadows;
    body.receiveShadow = enableShadows;
    bGroup.add(body);

    // Crown / Cornice trim
    const crown = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.5, 0.7, d + 0.5),
      style === 'glass' ? turquoiseMat : goldTrimMat
    );
    crown.position.y = h + 0.2;
    bGroup.add(crown);

    if (style === 'dome') {
      // Iconic Turquoise Central Asian Dome on roof!
      const drum = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.26, w * 0.28, 3.2, 20), sandstoneMat);
      drum.position.y = h + 1.8;
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(w * 0.27, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.58),
        turquoiseMat
      );
      dome.position.y = h + 3.4;
      const spire = new THREE.Mesh(new THREE.ConeGeometry(0.45, 2.4, 8), goldTrimMat);
      spire.position.y = h + 3.4 + w * 0.27 + 0.8;
      bGroup.add(drum, dome, spire);
    } else if (style === 'garage') {
      // Dark garage bays on front face
      for (let i = -1; i <= 1; i++) {
        const door = new THREE.Mesh(
          new THREE.BoxGeometry(0.3, 4.2, 4.8),
          new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 })
        );
        door.position.set(w * 0.5 + 0.05, 2.1, i * 6.5);
        bGroup.add(door);
      }
    }

    bGroup.position.set(cx, 0, cz);
    group.add(bGroup);

    colliders.push({
      minX: cx - w * 0.5,
      maxX: cx + w * 0.5,
      minZ: cz - d * 0.5,
      maxZ: cz + d * 0.5,
      tag: 'building',
    });
  };

  // Inner quadrant buildings
  addBuilding(-28, -24, 14, 15, 22, 'glass'); // Biznes Markaz
  addBuilding(-28, 24, 14, 14, 10, 'sandstone'); // Park Cafeteria / Shops

  // Perimeter skyline buildings
  addBuilding(75, -30, 18, 22, 34, 'glass'); // Toshkent City Tower
  addBuilding(75, 24, 18, 24, 14, 'sandstone'); // Savdo Markazi Mall
  addBuilding(74, 54, 16, 18, 20, 'sandstone');
  addBuilding(74, -56, 16, 16, 22, 'glass');

  addBuilding(-74, 30, 16, 22, 9, 'garage'); // Avtoservis
  addBuilding(-74, -26, 16, 24, 20, 'sandstone');
  addBuilding(-74, 2, 14, 16, 26, 'glass');

  addBuilding(0, -75, 34, 14, 26, 'glass'); // Hotel Uzbekistan style
  addBuilding(-40, -75, 24, 14, 18, 'sandstone');
  addBuilding(40, -75, 24, 14, 24, 'glass');

  addBuilding(0, 75, 32, 14, 14, 'dome'); // Chorsu Turquoise Dome Cultural Center
  addBuilding(-42, 75, 22, 14, 20, 'sandstone');
  addBuilding(42, 75, 24, 14, 12, 'sandstone');

  // 7. Instanced Trees (Trunk + Lush Canopy with ±15% scale & color variation)
  const treePositions: Array<[number, number]> = [
    [-21, -32], [-35, -32], [-21, -16], [-35, -16],
    [-21, 16], [-35, 16], [-21, 32], [-35, 32],
    [64, -12], [64, 4], [64, 44], [64, -44],
    [-64, -12], [-64, 12], [-64, 52], [-64, -52],
    [-22, -64], [22, -64], [-22, 64], [22, 64],
    [18, -42], [18, 42], [-18, -42], [-18, 42],
  ];
  if (quality !== 'low') {
    treePositions.push(
      [-58, -64], [58, -64], [-58, 64], [58, 64],
      [68, -68], [-68, -68], [68, 68], [-68, 68]
    );
  }

  const trunkGeo = new THREE.CylinderGeometry(0.22, 0.34, 2.6, 8);
  trunkGeo.translate(0, 1.3, 0);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.92 });
  const canopyGeo = new THREE.DodecahedronGeometry(1.75, 1);
  canopyGeo.translate(0, 3.8, 0);
  const canopyMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.8 });

  const trunkInst = new THREE.InstancedMesh(trunkGeo, trunkMat, treePositions.length);
  const canopyInst = new THREE.InstancedMesh(canopyGeo, canopyMat, treePositions.length);
  canopyInst.castShadow = enableShadows;

  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  treePositions.forEach(([tx, tz], idx) => {
    const sc = 0.85 + ((idx * 37) % 30) / 100; // ±15%
    dummy.position.set(tx, 0, tz);
    dummy.rotation.y = idx * 0.9;
    dummy.scale.set(sc, sc, sc);
    dummy.updateMatrix();
    trunkInst.setMatrixAt(idx, dummy.matrix);
    canopyInst.setMatrixAt(idx, dummy.matrix);

    color.setHSL(0.32 + ((idx % 5) - 2) * 0.015, 0.48, 0.32 + (idx % 3) * 0.04);
    canopyInst.setColorAt(idx, color);

    colliders.push({
      minX: tx - 0.5,
      maxX: tx + 0.5,
      minZ: tz - 0.5,
      maxZ: tz + 0.5,
      tag: 'prop',
    });
  });
  trunkInst.instanceMatrix.needsUpdate = true;
  canopyInst.instanceMatrix.needsUpdate = true;
  if (canopyInst.instanceColor) canopyInst.instanceColor.needsUpdate = true;
  trunkInst.computeBoundingSphere();
  canopyInst.computeBoundingSphere();
  group.add(trunkInst, canopyInst);

  // 8. Instanced Street Lamps
  const lampPositions: Array<[number, number, number]> = [
    [-16.5, -24, 0], [-16.5, 24, 0], [16.5, -24, Math.PI], [16.5, 24, Math.PI],
    [-34, -10.5, Math.PI / 2], [34, -10.5, Math.PI / 2],
    [-34, 10.5, -Math.PI / 2], [34, 10.5, -Math.PI / 2],
    [-16.5, -56, 0], [16.5, -56, Math.PI],
    [-16.5, 56, 0], [16.5, 56, Math.PI],
  ];
  const poleGeo = new THREE.CylinderGeometry(0.09, 0.14, 5.8, 8);
  poleGeo.translate(0, 2.9, 0);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.35 });
  const bulbGeo = new THREE.BoxGeometry(0.9, 0.16, 0.35);
  bulbGeo.translate(0.45, 5.75, 0);
  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xfde047,
    emissiveIntensity: 1.2,
  });

  const poleInst = new THREE.InstancedMesh(poleGeo, poleMat, lampPositions.length);
  const bulbInst = new THREE.InstancedMesh(bulbGeo, bulbMat, lampPositions.length);
  lampPositions.forEach(([lx, lz, rot], idx) => {
    dummy.position.set(lx, 0, lz);
    dummy.rotation.set(0, rot, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    poleInst.setMatrixAt(idx, dummy.matrix);
    bulbInst.setMatrixAt(idx, dummy.matrix);
    colliders.push({ minX: lx - 0.3, maxX: lx + 0.3, minZ: lz - 0.3, maxZ: lz + 0.3, tag: 'pole' });
  });
  poleInst.instanceMatrix.needsUpdate = true;
  bulbInst.instanceMatrix.needsUpdate = true;
  poleInst.computeBoundingSphere();
  bulbInst.computeBoundingSphere();
  group.add(poleInst, bulbInst);

  // 9. Traffic Lights at Major Intersections
  const addTrafficLight = (x: number, z: number, rotY: number, axis: 'ns' | 'ew', phaseOffset: number) => {
    const tlGroup = new THREE.Group();
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 4.4, 8), poleMat);
    post.position.y = 2.2;
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.45, 0.45), new THREE.MeshStandardMaterial({ color: 0x111827 }));
    box.position.y = 4.4;

    const mkLamp = (yOff: number, col: number) => {
      const m = new THREE.Mesh(
        new THREE.CircleGeometry(0.16, 12),
        new THREE.MeshBasicMaterial({ color: col })
      );
      m.position.set(0, 4.4 + yOff, 0.235);
      return m;
    };
    const redMesh = mkLamp(0.42, 0xef4444);
    const yellowMesh = mkLamp(0, 0xf59e0b);
    const greenMesh = mkLamp(-0.42, 0x10b981);

    tlGroup.add(post, box, redMesh, yellowMesh, greenMesh);
    tlGroup.position.set(x, 0, z);
    tlGroup.rotation.y = rotY;
    group.add(tlGroup);

    colliders.push({ minX: x - 0.3, maxX: x + 0.3, minZ: z - 0.3, maxZ: z + 0.3, tag: 'pole' });
    trafficLights.push({ x, z, axis, phaseOffset, redMesh, yellowMesh, greenMesh });
  };

  addTrafficLight(16.5, -11.5, Math.PI, 'ns', 0);
  addTrafficLight(-16.5, 11.5, 0, 'ns', 0);
  addTrafficLight(43.5, -11.5, Math.PI, 'ns', 7);
  addTrafficLight(-43.5, 11.5, 0, 'ns', 7);

  // 10. Traffic Signs (Parking P, Speed 60, Stop)
  const addSign = (x: number, z: number, rotY: number, map: THREE.CanvasTexture) => {
    const sGroup = new THREE.Group();
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.8, 8), poleMat);
    post.position.y = 1.4;
    const board = new THREE.Mesh(
      new THREE.PlaneGeometry(0.9, 0.9),
      new THREE.MeshStandardMaterial({ map, roughness: 0.4, side: THREE.DoubleSide })
    );
    board.position.y = 2.75;
    sGroup.add(post, board);
    sGroup.position.set(x, 0, z);
    sGroup.rotation.y = rotY;
    group.add(sGroup);
  };

  addSign(17, 13, -Math.PI / 2, textures.parkingSign);
  addSign(17, -14, -Math.PI / 2, textures.parkingSign);
  addSign(16.5, -30, 0, textures.speedSign);
  addSign(-16.5, 30, Math.PI, textures.speedSign);
  addSign(-17, -11.5, Math.PI / 2, textures.stopSign);
  addSign(43.5, 11.5, -Math.PI / 2, textures.stopSign);

  // Outer perimeter natural barrier fence/curb at ±96
  const worldLimit = 96;
  colliders.push(
    { minX: -120, maxX: 120, minZ: worldLimit, maxZ: 120, tag: 'curb' },
    { minX: -120, maxX: 120, minZ: -120, maxZ: -worldLimit, tag: 'curb' },
    { minX: worldLimit, maxX: 120, minZ: -120, maxZ: 120, tag: 'curb' },
    { minX: -120, maxX: -worldLimit, minZ: -120, maxZ: 120, tag: 'curb' }
  );

  const getCycleState = (elapsedSec: number, phaseOffset: number): 'green' | 'yellow' | 'red' => {
    const t = (elapsedSec + phaseOffset) % 18;
    if (t < 8) return 'green';
    if (t < 10) return 'yellow';
    return 'red';
  };

  const updateTrafficLights = (elapsedSec: number) => {
    for (const tl of trafficLights) {
      const state = getCycleState(elapsedSec, tl.phaseOffset);
      (tl.redMesh.material as THREE.MeshBasicMaterial).color.setHex(
        state === 'red' ? 0xff3b30 : 0x3f1515
      );
      (tl.yellowMesh.material as THREE.MeshBasicMaterial).color.setHex(
        state === 'yellow' ? 0xfbbf24 : 0x3f2e10
      );
      (tl.greenMesh.material as THREE.MeshBasicMaterial).color.setHex(
        state === 'green' ? 0x22c55e : 0x103820
      );
    }
  };

  const getSignalStateNear = (x: number, z: number): 'green' | 'yellow' | 'red' | null => {
    for (const tl of trafficLights) {
      const dx = x - tl.x;
      const dz = z - tl.z;
      if (dx * dx + dz * dz < 18 * 18) {
        return getCycleState(performance.now() * 0.001, tl.phaseOffset);
      }
    }
    return null;
  };

  // Store exact cycle time when updated so signal queries match visual bulbs
  let lastElapsed = 0;
  const wrappedUpdate = (elapsedSec: number) => {
    lastElapsed = elapsedSec;
    updateTrafficLights(elapsedSec);
  };
  const wrappedSignalQuery = (x: number, z: number): 'green' | 'yellow' | 'red' | null => {
    for (const tl of trafficLights) {
      const dx = x - tl.x;
      const dz = z - tl.z;
      if (dx * dx + dz * dz < 18 * 18) {
        return getCycleState(lastElapsed, tl.phaseOffset);
      }
    }
    return null;
  };

  const setNightMode = (night: boolean) => {
    skyMat.map = night ? textures.skyDomeNight : textures.skyDome;
    skyMat.needsUpdate = true;
    bulbMat.emissiveIntensity = night ? 2.4 : 1.0;
  };

  const dispose = () => {
    group.traverse((obj) => {
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
    group,
    colliders,
    updateTrafficLights: wrappedUpdate,
    getSignalStateNear: wrappedSignalQuery,
    setNightMode,
    dispose,
  };
}
