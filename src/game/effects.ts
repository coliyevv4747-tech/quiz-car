import * as THREE from 'three';
import { CityTextures } from './textures';

interface SmokeParticle {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  age: number;
  life: number;
  scale: number;
}

const _dummy = new THREE.Object3D();

export class RacingEffects {
  public group: THREE.Group;

  private smokeInst: THREE.InstancedMesh;
  private smokePool: SmokeParticle[] = [];
  private smokeCursor = 0;
  private smokeTimer = 0;

  private skidInst: THREE.InstancedMesh;
  private skidCursor = 0;
  private skidMax = 180;
  private skidTimer = 0;

  constructor(textures: CityTextures, maxSmoke = 64) {
    this.group = new THREE.Group();

    // 1. Pooled Tire Smoke / Dust Particles (1 draw call!)
    const puffGeo = new THREE.IcosahedronGeometry(0.32, 1);
    const puffMat = new THREE.MeshBasicMaterial({
      color: 0xe2e8f0,
      transparent: true,
      opacity: 0.36,
      depthWrite: false,
    });
    this.smokeInst = new THREE.InstancedMesh(puffGeo, puffMat, maxSmoke);
    this.smokeInst.frustumCulled = false;

    for (let i = 0; i < maxSmoke; i++) {
      this.smokePool.push({
        active: false,
        x: 0,
        y: -50,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        age: 0,
        life: 0.8,
        scale: 0.01,
      });
      _dummy.position.set(0, -50, 0);
      _dummy.scale.setScalar(0.001);
      _dummy.updateMatrix();
      this.smokeInst.setMatrixAt(i, _dummy.matrix);
    }
    this.smokeInst.instanceMatrix.needsUpdate = true;
    this.group.add(this.smokeInst);

    // 2. Pooled Tire Skid Marks (1 draw call!)
    const skidGeo = new THREE.PlaneGeometry(0.28, 0.95).rotateX(-Math.PI / 2);
    const skidMat = new THREE.MeshBasicMaterial({
      color: 0x0b0d12,
      transparent: true,
      opacity: 0.52,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -3,
      polygonOffsetUnits: -3,
    });
    this.skidInst = new THREE.InstancedMesh(skidGeo, skidMat, this.skidMax);
    this.skidInst.frustumCulled = false;

    for (let i = 0; i < this.skidMax; i++) {
      _dummy.position.set(0, -50, 0);
      _dummy.scale.setScalar(0.001);
      _dummy.updateMatrix();
      this.skidInst.setMatrixAt(i, _dummy.matrix);
    }
    this.skidInst.instanceMatrix.needsUpdate = true;
    this.group.add(this.skidInst);
    void textures;
  }

  public clear(): void {
    for (let i = 0; i < this.smokePool.length; i++) {
      this.smokePool[i].active = false;
      _dummy.position.set(0, -50, 0);
      _dummy.scale.setScalar(0.001);
      _dummy.updateMatrix();
      this.smokeInst.setMatrixAt(i, _dummy.matrix);
    }
    this.smokeInst.instanceMatrix.needsUpdate = true;

    for (let i = 0; i < this.skidMax; i++) {
      _dummy.position.set(0, -50, 0);
      _dummy.scale.setScalar(0.001);
      _dummy.updateMatrix();
      this.skidInst.setMatrixAt(i, _dummy.matrix);
    }
    this.skidInst.instanceMatrix.needsUpdate = true;
    this.skidCursor = 0;
  }

  private spawnSmoke(x: number, y: number, z: number, vx: number, vz: number, scale: number): void {
    const p = this.smokePool[this.smokeCursor];
    this.smokeCursor = (this.smokeCursor + 1) % this.smokePool.length;
    p.active = true;
    p.x = x + (Math.random() - 0.5) * 0.25;
    p.y = y;
    p.z = z + (Math.random() - 0.5) * 0.25;
    p.vx = vx * 0.2 + (Math.random() - 0.5) * 0.8;
    p.vy = 0.7 + Math.random() * 0.6;
    p.vz = vz * 0.2 + (Math.random() - 0.5) * 0.8;
    p.age = 0;
    p.life = 0.55 + Math.random() * 0.35;
    p.scale = scale;
  }

  private spawnSkid(x: number, z: number, yaw: number): void {
    _dummy.position.set(x, 0.033, z);
    _dummy.rotation.set(0, yaw, 0);
    _dummy.scale.set(1, 1, 1);
    _dummy.updateMatrix();
    this.skidInst.setMatrixAt(this.skidCursor, _dummy.matrix);
    this.skidCursor = (this.skidCursor + 1) % this.skidMax;
    this.skidInst.instanceMatrix.needsUpdate = true;
  }

  public update(
    dt: number,
    carX: number,
    carZ: number,
    carYaw: number,
    carVx: number,
    carVz: number,
    rearAxleOffset: number,
    halfTrack: number,
    driftIntensity: number
  ): void {
    // Emit smoke & skid marks from rear tires when drifting/hard-braking
    if (driftIntensity > 0.18) {
      const fwdX = Math.sin(carYaw);
      const fwdZ = Math.cos(carYaw);
      const rightX = Math.cos(carYaw);
      const rightZ = -Math.sin(carYaw);

      const rx = carX + fwdX * rearAxleOffset;
      const rz = carZ + fwdZ * rearAxleOffset;

      const lx = rx + rightX * halfTrack;
      const lz = rz + rightZ * halfTrack;
      const rrx = rx - rightX * halfTrack;
      const rrz = rz - rightZ * halfTrack;

      this.smokeTimer += dt;
      if (this.smokeTimer >= 0.045) {
        this.smokeTimer = 0;
        const s = 0.55 + driftIntensity * 0.65;
        this.spawnSmoke(lx, 0.22, lz, carVx, carVz, s);
        this.spawnSmoke(rrx, 0.22, rrz, carVx, carVz, s);
      }

      this.skidTimer += dt;
      if (this.skidTimer >= 0.03) {
        this.skidTimer = 0;
        this.spawnSkid(lx, lz, carYaw);
        this.spawnSkid(rrx, rrz, carYaw);
      }
    }

    // Advance active smoke puffs
    let anySmokeChanged = false;
    for (let i = 0; i < this.smokePool.length; i++) {
      const p = this.smokePool[i];
      if (!p.active) continue;
      anySmokeChanged = true;
      p.age += dt;
      if (p.age >= p.life) {
        p.active = false;
        _dummy.position.set(0, -50, 0);
        _dummy.scale.setScalar(0.001);
        _dummy.updateMatrix();
        this.smokeInst.setMatrixAt(i, _dummy.matrix);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      const t = p.age / p.life;
      const sc = p.scale * (0.8 + t * 2.2) * (1 - t * 0.35);
      _dummy.position.set(p.x, p.y, p.z);
      _dummy.rotation.set(0, 0, 0);
      _dummy.scale.setScalar(Math.max(0.01, sc));
      _dummy.updateMatrix();
      this.smokeInst.setMatrixAt(i, _dummy.matrix);
    }
    if (anySmokeChanged) {
      this.smokeInst.instanceMatrix.needsUpdate = true;
    }
  }

  public dispose(): void {
    this.smokeInst.geometry.dispose();
    (this.smokeInst.material as THREE.Material).dispose();
    this.skidInst.geometry.dispose();
    (this.skidInst.material as THREE.Material).dispose();
  }
}
