import * as THREE from 'three';
import { CITY_CHECKPOINTS } from '../data/gameData';
import { ParkingMission } from '../types/game';
import { ColliderBox } from './city';
import { CityTextures } from './textures';
import { createStaticParkedCar } from './vehicles';

export interface MissionSceneObjects {
  group: THREE.Group;
  colliders: ColliderBox[];
  updateVisuals: (timeSec: number, alignmentOk: boolean, distance: number) => void;
  setParkingBayColor: (state: 'far' | 'close' | 'aligned') => void;
  setCheckpointPosition: (x: number, z: number) => void;
  dispose: () => void;
}

function createConeMesh(): THREE.Group {
  const g = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(0.46, 0.06, 0.46),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 })
  );
  base.position.y = 0.03;
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(0.18, 0.62, 12),
    new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.45 })
  );
  cone.position.y = 0.35;
  const stripe = new THREE.Mesh(
    new THREE.CylinderGeometry(0.10, 0.14, 0.14, 12),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, emissive: 0xffffff, emissiveIntensity: 0.15 })
  );
  stripe.position.y = 0.38;
  g.add(base, cone, stripe);
  return g;
}

function createBarrierMesh(): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.82, 0.45),
    new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.6 })
  );
  body.position.y = 0.41;
  const band = new THREE.Mesh(
    new THREE.BoxGeometry(2.22, 0.22, 0.47),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 })
  );
  band.position.y = 0.54;
  g.add(body, band);
  return g;
}

export function createParkingMissionVisuals(
  mission: ParkingMission,
  textures: CityTextures,
  enableShadows: boolean
): MissionSceneObjects {
  const group = new THREE.Group();
  const colliders: ColliderBox[] = [];

  // 1. Glowing Parking Bay Perimeter
  const bayGroup = new THREE.Group();
  bayGroup.position.set(mission.target.x, 0.035, mission.target.z);
  bayGroup.rotation.y = mission.target.yaw;

  const bayMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const fillMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.16,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const bw = mission.target.width;
  const bl = mission.target.length;
  const lineW = 0.16;

  const makeStrip = (w: number, l: number, px: number, pz: number) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, l).rotateX(-Math.PI / 2), bayMat);
    m.position.set(px, 0, pz);
    return m;
  };

  bayGroup.add(
    makeStrip(lineW, bl, bw * 0.5, 0),
    makeStrip(lineW, bl, -bw * 0.5, 0),
    makeStrip(bw, lineW, 0, bl * 0.5),
    makeStrip(bw, lineW, 0, -bl * 0.5)
  );

  const floorGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(bw - 0.2, bl - 0.2).rotateX(-Math.PI / 2),
    fillMat
  );
  floorGlow.position.y = -0.005;
  bayGroup.add(floorGlow);

  // Corner beacons
  const cornerGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.35, 8);
  cornerGeo.translate(0, 0.675, 0);
  [
    [bw * 0.5, bl * 0.5],
    [-bw * 0.5, bl * 0.5],
    [bw * 0.5, -bl * 0.5],
    [-bw * 0.5, -bl * 0.5],
  ].forEach(([cx, cz]) => {
    const post = new THREE.Mesh(cornerGeo, bayMat);
    post.position.set(cx, 0, cz);
    bayGroup.add(post);
  });

  // Floating direction arrow above parking bay
  const arrowGroup = new THREE.Group();
  const arrowCone = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.9, 8), bayMat);
  arrowCone.rotation.x = Math.PI;
  arrowGroup.add(arrowCone);
  arrowGroup.position.set(0, 2.3, 0);
  bayGroup.add(arrowGroup);

  group.add(bayGroup);

  // 2. Waypoints if any
  const wpMeshes: THREE.Mesh[] = [];
  if (mission.waypoints) {
    mission.waypoints.forEach((wp) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(2.2, 0.14, 10, 28),
        new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.85 })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.set(wp.x, 0.25, wp.z);
      group.add(ring);
      wpMeshes.push(ring);
    });
  }

  // 3. Obstacle Props (Cars, Cones, Barriers) + Colliders
  mission.props.forEach((prop) => {
    if (prop.type === 'car') {
      const car = createStaticParkedCar(prop.color ?? '#64748b', textures, enableShadows);
      car.position.set(prop.x, 0, prop.z);
      car.rotation.y = prop.yaw;
      group.add(car);

      // Compute oriented bounding box projection onto axis-aligned bounds (props are 0 or +-PI/2)
      const isRotated90 = Math.abs(Math.sin(prop.yaw)) > 0.7;
      const hx = isRotated90 ? 2.25 : 0.95;
      const hz = isRotated90 ? 0.95 : 2.25;
      colliders.push({
        minX: prop.x - hx,
        maxX: prop.x + hx,
        minZ: prop.z - hz,
        maxZ: prop.z + hz,
        tag: 'prop',
      });
    } else if (prop.type === 'cone') {
      const cone = createConeMesh();
      cone.position.set(prop.x, 0, prop.z);
      group.add(cone);
      colliders.push({
        minX: prop.x - 0.28,
        maxX: prop.x + 0.28,
        minZ: prop.z - 0.28,
        maxZ: prop.z + 0.28,
        tag: 'prop',
      });
    } else if (prop.type === 'barrier') {
      const barrier = createBarrierMesh();
      barrier.position.set(prop.x, 0, prop.z);
      barrier.rotation.y = prop.yaw;
      group.add(barrier);
      const isRotated90 = Math.abs(Math.sin(prop.yaw)) > 0.7;
      const hx = isRotated90 ? 0.25 : 1.1;
      const hz = isRotated90 ? 1.1 : 0.25;
      colliders.push({
        minX: prop.x - hx,
        maxX: prop.x + hx,
        minZ: prop.z - hz,
        maxZ: prop.z + hz,
        tag: 'prop',
      });
    }
  });

  const setParkingBayColor = (state: 'far' | 'close' | 'aligned') => {
    if (state === 'aligned') {
      bayMat.color.setHex(0x10b981);
      fillMat.color.setHex(0x10b981);
      fillMat.opacity = 0.28;
    } else if (state === 'close') {
      bayMat.color.setHex(0x38bdf8);
      fillMat.color.setHex(0x38bdf8);
      fillMat.opacity = 0.20;
    } else {
      bayMat.color.setHex(0xf59e0b);
      fillMat.color.setHex(0xf59e0b);
      fillMat.opacity = 0.14;
    }
  };

  const updateVisuals = (timeSec: number) => {
    arrowGroup.position.y = 2.25 + Math.sin(timeSec * 3.5) * 0.28;
    arrowGroup.rotation.y = timeSec * 1.4;
    wpMeshes.forEach((m, idx) => {
      m.position.y = 0.22 + Math.sin(timeSec * 3 + idx) * 0.12;
    });
  };

  const dispose = () => {
    group.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose());
        else mesh.material.dispose();
      }
    });
  };

  return {
    group,
    colliders,
    updateVisuals,
    setParkingBayColor,
    setCheckpointPosition: () => {},
    dispose,
  };
}

export function createCityDrivingVisuals(colorHex = 0x10b981): MissionSceneObjects {
  const group = new THREE.Group();
  const cpMat = new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: 0.88,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const ring = new THREE.Mesh(new THREE.TorusGeometry(4.0, 0.24, 12, 32), cpMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.26;

  const pillar = new THREE.Mesh(
    new THREE.CylinderGeometry(3.6, 3.6, 9.0, 24, 1, true),
    new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  pillar.position.y = 4.5;

  const arrow = new THREE.Mesh(
    new THREE.ConeGeometry(0.9, 1.8, 8),
    new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.9 })
  );
  arrow.rotation.x = Math.PI;
  arrow.position.y = 5.5;

  const marker = new THREE.Group();
  marker.add(ring, pillar, arrow);
  if (CITY_CHECKPOINTS.length > 0) {
    marker.position.set(CITY_CHECKPOINTS[0].x, 0, CITY_CHECKPOINTS[0].z);
  }
  group.add(marker);

  const setCheckpointPosition = (x: number, z: number) => {
    marker.position.set(x, 0, z);
  };

  const updateVisuals = (timeSec: number) => {
    ring.position.y = 0.24 + Math.sin(timeSec * 4) * 0.12;
    pillar.rotation.y = timeSec * 0.9;
    arrow.position.y = 5.4 + Math.sin(timeSec * 4.5) * 0.35;
    arrow.rotation.y = timeSec * 1.5;
  };

  const dispose = () => {
    group.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose());
        else mesh.material.dispose();
      }
    });
  };

  return {
    group,
    colliders: [],
    updateVisuals,
    setParkingBayColor: () => {},
    setCheckpointPosition,
    dispose,
  };
}
