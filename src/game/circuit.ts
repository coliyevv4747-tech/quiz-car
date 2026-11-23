import * as THREE from 'three';
import { CIRCUIT_WAYPOINTS } from '../data/gameData';
import { ColliderBox } from './city';
import { CityTextures } from './textures';

export interface SplineSample {
  pos: THREE.Vector3;
  tangent: THREE.Vector3;
  normal: THREE.Vector3;
  progress: number; // 0..1
}

export interface CircuitEnvironment {
  group: THREE.Group;
  spline: THREE.CatmullRomCurve3;
  samples: SplineSample[];
  trackHalfWidth: number;
  barrierHalfWidth: number;
  colliders: ColliderBox[];
  startLights: THREE.Mesh[];
  setStartLightState: (phase: 'off' | 'red' | 'green') => void;
  constrainToTrack: (
    x: number,
    z: number,
    vx: number,
    vz: number,
    carRadius: number
  ) => { x: number; z: number; vx: number; vz: number; impact: number };
  dispose: () => void;
}

export function buildCircuitEnvironment(
  textures: CityTextures,
  enableShadows: boolean,
  quality: 'low' | 'medium' | 'high'
): CircuitEnvironment {
  const group = new THREE.Group();
  const colliders: ColliderBox[] = [];

  // 1. Sky Dome
  const skyDome = new THREE.Mesh(
    new THREE.SphereGeometry(420, 24, 16),
    new THREE.MeshBasicMaterial({ map: textures.skyDome, side: THREE.BackSide, fog: false })
  );
  group.add(skyDome);

  // 2. Vast Circuit Terrain Ground
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(800, 800).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ map: textures.grass, roughness: 0.94, metalness: 0 })
  );
  ground.receiveShadow = enableShadows;
  group.add(ground);

  // 3. Closed Catmull-Rom Track Spline
  const pts = CIRCUIT_WAYPOINTS.map((p) => new THREE.Vector3(p.x, 0, p.z));
  const spline = new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.45);

  const SEGMENTS = 260;
  const trackHalfWidth = 8.2; // 16.4m wide GP track!
  const barrierHalfWidth = 12.2; // Runoff + barrier

  const samples: SplineSample[] = [];
  for (let i = 0; i < SEGMENTS; i++) {
    const t = i / SEGMENTS;
    const pos = spline.getPointAt(t);
    const tangent = spline.getTangentAt(t).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    samples.push({ pos, tangent, normal, progress: t });
  }

  // 4. Build Track Asphalt Ribbon + Racing Curbs + Barrier Walls Geometry
  const roadPos: number[] = [];
  const roadUvs: number[] = [];
  const roadIdx: number[] = [];

  const curbPos: number[] = [];
  const curbColors: number[] = [];
  const curbIdx: number[] = [];

  const wallPos: number[] = [];
  const wallIdx: number[] = [];

  for (let i = 0; i <= SEGMENTS; i++) {
    const s = samples[i % SEGMENTS];
    const u = i / SEGMENTS;

    // Road left & right vertices
    const lx = s.pos.x + s.normal.x * trackHalfWidth;
    const lz = s.pos.z + s.normal.z * trackHalfWidth;
    const rx = s.pos.x - s.normal.x * trackHalfWidth;
    const rz = s.pos.z - s.normal.z * trackHalfWidth;
    roadPos.push(lx, 0.02, lz, rx, 0.02, rz);
    roadUvs.push(0, u * 40, 1, u * 40);

    // Curbs (left & right strips outside road edge)
    const curbW = 1.05;
    const cLInX = s.pos.x + s.normal.x * trackHalfWidth;
    const cLInZ = s.pos.z + s.normal.z * trackHalfWidth;
    const cLOutX = s.pos.x + s.normal.x * (trackHalfWidth + curbW);
    const cLOutZ = s.pos.z + s.normal.z * (trackHalfWidth + curbW);

    const cRInX = s.pos.x - s.normal.x * trackHalfWidth;
    const cRInZ = s.pos.z - s.normal.z * trackHalfWidth;
    const cROutX = s.pos.x - s.normal.x * (trackHalfWidth + curbW);
    const cROutZ = s.pos.z - s.normal.z * (trackHalfWidth + curbW);

    const isRed = i % 2 === 0;
    const rCol = isRed ? 0.86 : 0.94;
    const gCol = isRed ? 0.14 : 0.95;
    const bCol = isRed ? 0.16 : 0.96;

    curbPos.push(
      cLInX, 0.032, cLInZ,
      cLOutX, 0.032, cLOutZ,
      cRInX, 0.032, cRInZ,
      cROutX, 0.032, cROutZ
    );
    for (let k = 0; k < 4; k++) curbColors.push(rCol, gCol, bCol);

    // Guardrail Barrier Wall along ±barrierHalfWidth
    const wH = 1.15;
    const wLX = s.pos.x + s.normal.x * barrierHalfWidth;
    const wLZ = s.pos.z + s.normal.z * barrierHalfWidth;
    const wRX = s.pos.x - s.normal.x * barrierHalfWidth;
    const wRZ = s.pos.z - s.normal.z * barrierHalfWidth;
    wallPos.push(wLX, 0, wLZ, wLX, wH, wLZ, wRX, 0, wRZ, wRX, wH, wRZ);

    if (i < SEGMENTS) {
      const b = i * 2;
      roadIdx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);

      const cb = i * 4;
      curbIdx.push(cb, cb + 1, cb + 4, cb + 1, cb + 5, cb + 4);
      curbIdx.push(cb + 2, cb + 6, cb + 3, cb + 3, cb + 6, cb + 7);

      const wb = i * 4;
      wallIdx.push(wb, wb + 4, wb + 1, wb + 1, wb + 4, wb + 5);
      wallIdx.push(wb + 2, wb + 3, wb + 6, wb + 3, wb + 7, wb + 6);
    }
  }

  const roadGeo = new THREE.BufferGeometry();
  roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadPos, 3));
  roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUvs, 2));
  roadGeo.setIndex(roadIdx);
  roadGeo.computeVertexNormals();
  const roadMesh = new THREE.Mesh(
    roadGeo,
    new THREE.MeshStandardMaterial({
      map: textures.trackAsphalt,
      roughness: 0.78,
      metalness: 0.05,
    })
  );
  roadMesh.receiveShadow = enableShadows;
  group.add(roadMesh);

  const curbGeo = new THREE.BufferGeometry();
  curbGeo.setAttribute('position', new THREE.Float32BufferAttribute(curbPos, 3));
  curbGeo.setAttribute('color', new THREE.Float32BufferAttribute(curbColors, 3));
  curbGeo.setIndex(curbIdx);
  curbGeo.computeVertexNormals();
  group.add(
    new THREE.Mesh(
      curbGeo,
      new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.65 })
    )
  );

  const wallGeo = new THREE.BufferGeometry();
  wallGeo.setAttribute('position', new THREE.Float32BufferAttribute(wallPos, 3));
  wallGeo.setIndex(wallIdx);
  wallGeo.computeVertexNormals();
  group.add(
    new THREE.Mesh(
      wallGeo,
      new THREE.MeshStandardMaterial({
        color: 0x334155,
        metalness: 0.55,
        roughness: 0.45,
        side: THREE.DoubleSide,
      })
    )
  );

  // 5. Start / Finish Line + Overhead Gantry with Countdown Lights
  const startSample = samples[0];
  const startGroup = new THREE.Group();
  startGroup.position.copy(startSample.pos);
  startGroup.rotation.y = Math.atan2(startSample.tangent.x, startSample.tangent.z);

  const finishStrip = new THREE.Mesh(
    new THREE.PlaneGeometry(trackHalfWidth * 2, 3.2).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ map: textures.checkeredLine })
  );
  finishStrip.position.y = 0.035;
  startGroup.add(finishStrip);

  // Starting Grid Boxes
  const gridMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
  for (let slot = 0; slot < 4; slot++) {
    const gx = slot % 2 === 0 ? -2.8 : 2.8;
    const gz = -6 - slot * 5.2;
    const line = new THREE.Mesh(
      new THREE.PlaneGeometry(2.6, 0.25).rotateX(-Math.PI / 2),
      gridMat
    );
    line.position.set(gx, 0.033, gz);
    startGroup.add(line);
  }

  // Gantry Pillars & Overhead Bridge
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.35 });
  const pGeo = new THREE.BoxGeometry(0.9, 7.5, 0.9);
  const pL = new THREE.Mesh(pGeo, pillarMat);
  pL.position.set(trackHalfWidth + 1.5, 3.75, 0);
  const pR = new THREE.Mesh(pGeo, pillarMat);
  pR.position.set(-trackHalfWidth - 1.5, 3.75, 0);
  const bridge = new THREE.Mesh(
    new THREE.BoxGeometry(trackHalfWidth * 2 + 4.2, 1.5, 1.4),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.6, roughness: 0.3 })
  );
  bridge.position.set(0, 7.2, 0);
  startGroup.add(pL, pR, bridge);

  // 3 Countdown Start Lights on Gantry
  const startLights: THREE.Mesh[] = [];
  [-2.0, 0, 2.0].forEach((lx) => {
    const lamp = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 12, 10),
      new THREE.MeshBasicMaterial({ color: 0x3f1515 })
    );
    lamp.position.set(lx, 7.1, -0.75);
    startGroup.add(lamp);
    startLights.push(lamp);
  });
  group.add(startGroup);

  // 6. Grandstands & Pit Garages along Main Straight (z = 95)
  const standMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.5, roughness: 0.35 });
  const seatColors = [0xef4444, 0x38bdf8, 0xfbbf24, 0x10b981];

  [-20, 22, 62].forEach((gx, idx) => {
    const gs = new THREE.Group();
    for (let tier = 0; tier < 5; tier++) {
      const step = new THREE.Mesh(
        new THREE.BoxGeometry(30, 0.9, 2.4),
        tier % 2 === 0 ? standMat : new THREE.MeshStandardMaterial({ color: seatColors[(idx + tier) % 4] })
      );
      step.position.set(0, 0.6 + tier * 0.95, tier * 2.1);
      step.castShadow = enableShadows;
      gs.add(step);
    }
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(31, 0.4, 11), roofMat);
    canopy.position.set(0, 7.5, 4.5);
    gs.add(canopy);
    gs.position.set(gx, 0, 118);
    gs.rotation.y = Math.PI;
    group.add(gs);
  });

  // Pit Lane Team Garages (opposite Grandstand at z = 72)
  const pitBuilding = new THREE.Mesh(
    new THREE.BoxGeometry(68, 5.5, 10),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.65 })
  );
  pitBuilding.position.set(16, 2.75, 72);
  pitBuilding.castShadow = enableShadows;
  group.add(pitBuilding);

  for (let b = -24; b <= 56; b += 10) {
    const door = new THREE.Mesh(
      new THREE.BoxGeometry(6.5, 3.6, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 })
    );
    door.position.set(b, 1.8, 77.1);
    group.add(door);
  }

  // 7. Instanced Track Floodlights & Surrounding Trees
  const lightCount = 18;
  const poleGeo = new THREE.CylinderGeometry(0.14, 0.22, 11, 8).translate(0, 5.5, 0);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7 });
  const headGeo = new THREE.BoxGeometry(1.8, 0.5, 0.8).translate(0, 11.1, 0);
  const headMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

  const poleInst = new THREE.InstancedMesh(poleGeo, poleMat, lightCount);
  const headInst = new THREE.InstancedMesh(headGeo, headMat, lightCount);
  const dummy = new THREE.Object3D();

  for (let i = 0; i < lightCount; i++) {
    const s = samples[Math.floor((i / lightCount) * SEGMENTS)];
    const side = i % 2 === 0 ? 1 : -1;
    dummy.position.set(
      s.pos.x + s.normal.x * side * (barrierHalfWidth + 2.5),
      0,
      s.pos.z + s.normal.z * side * (barrierHalfWidth + 2.5)
    );
    dummy.rotation.y = Math.atan2(s.tangent.x, s.tangent.z);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    poleInst.setMatrixAt(i, dummy.matrix);
    headInst.setMatrixAt(i, dummy.matrix);
  }
  poleInst.instanceMatrix.needsUpdate = true;
  headInst.instanceMatrix.needsUpdate = true;
  poleInst.computeBoundingSphere();
  headInst.computeBoundingSphere();
  group.add(poleInst, headInst);

  // Perimeter Trees
  const treeCount = quality === 'low' ? 32 : 60;
  const trunkGeo = new THREE.CylinderGeometry(0.25, 0.38, 3.0, 7).translate(0, 1.5, 0);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 });
  const crownGeo = new THREE.DodecahedronGeometry(2.2, 1).translate(0, 4.4, 0);
  const crownMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.8 });
  const tInst = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
  const cInst = new THREE.InstancedMesh(crownGeo, crownMat, treeCount);
  const col = new THREE.Color();

  for (let i = 0; i < treeCount; i++) {
    const ang = (i / treeCount) * Math.PI * 2;
    const rad = 165 + (i % 5) * 14;
    dummy.position.set(Math.cos(ang) * rad, 0, Math.sin(ang) * rad);
    const sc = 0.85 + ((i * 23) % 30) / 100;
    dummy.scale.set(sc, sc, sc);
    dummy.rotation.y = i;
    dummy.updateMatrix();
    tInst.setMatrixAt(i, dummy.matrix);
    cInst.setMatrixAt(i, dummy.matrix);
    col.setHSL(0.32 + ((i % 4) - 2) * 0.015, 0.5, 0.3 + (i % 3) * 0.04);
    cInst.setColorAt(i, col);
  }
  tInst.instanceMatrix.needsUpdate = true;
  cInst.instanceMatrix.needsUpdate = true;
  if (cInst.instanceColor) cInst.instanceColor.needsUpdate = true;
  tInst.computeBoundingSphere();
  cInst.computeBoundingSphere();
  group.add(tInst, cInst);

  const setStartLightState = (phase: 'off' | 'red' | 'green') => {
    startLights.forEach((m) => {
      const mat = m.material as THREE.MeshBasicMaterial;
      if (phase === 'red') mat.color.setHex(0xff2d20);
      else if (phase === 'green') mat.color.setHex(0x22c55e);
      else mat.color.setHex(0x3f1515);
    });
  };

  // Smooth curved track barrier constraint (zero jagged wall snagging!)
  const constrainToTrack = (
    x: number,
    z: number,
    vx: number,
    vz: number,
    carRadius: number
  ) => {
    let bestDistSq = Infinity;
    let bestIdx = 0;
    for (let i = 0; i < samples.length; i++) {
      const sp = samples[i].pos;
      const dx = x - sp.x;
      const dz = z - sp.z;
      const d2 = dx * dx + dz * dz;
      if (d2 < bestDistSq) {
        bestDistSq = d2;
        bestIdx = i;
      }
    }

    const s = samples[bestIdx];
    const relX = x - s.pos.x;
    const relZ = z - s.pos.z;
    const lateral = relX * s.normal.x + relZ * s.normal.z;
    const maxLat = barrierHalfWidth - carRadius;

    if (Math.abs(lateral) > maxLat) {
      const sign = Math.sign(lateral);
      const excess = Math.abs(lateral) - maxLat;
      const nx = -sign * s.normal.x;
      const nz = -sign * s.normal.z;

      const outX = x + nx * excess;
      const outZ = z + nz * excess;

      let outVx = vx;
      let outVz = vz;
      let impact = 0;
      const vn = vx * nx + vz * nz;
      if (vn < 0) {
        impact = Math.min(1, Math.abs(vn) / 14);
        outVx -= 1.15 * vn * nx;
        outVz -= 1.15 * vn * nz;
        outVx *= 0.88;
        outVz *= 0.88;
      }
      return { x: outX, z: outZ, vx: outVx, vz: outVz, impact };
    }

    return { x, z, vx, vz, impact: 0 };
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
    spline,
    samples,
    trackHalfWidth,
    barrierHalfWidth,
    colliders,
    startLights,
    setStartLightState,
    constrainToTrack,
    dispose,
  };
}
