import * as THREE from 'three';
import {
  AI_RACERS,
  createDefaultCustomization,
  STREET_RACE_WAYPOINTS,
  VEHICLE_SPECS,
} from '../data/gameData';
import { SplineSample } from './circuit';
import { CityTextures } from './textures';
import { createVehicleModel, VehicleRig } from './vehicles';

export interface AiRacer {
  id: string;
  name: string;
  vehicleName: string;
  rig: VehicleRig;
  x: number;
  z: number;
  yaw: number;
  speed: number;
  maxSpeed: number;
  paceFactor: number;
  laneOffset: number;
  wheelSpin: number;
  lap: number;
  waypointIdx: number;
  progress: number; // total progress: lap + fraction (0..totalLaps)
  finished: boolean;
  finishTimeSec: number | null;
}

export class AiRacerManager {
  public group = new THREE.Group();
  public racers: AiRacer[] = [];
  private samples: SplineSample[] = [];
  private streetPoints: Array<{ x: number; z: number }> = STREET_RACE_WAYPOINTS;
  private isCircuit = true;

  public spawnRacers(
    isCircuit: boolean,
    samples: SplineSample[],
    textures: CityTextures,
    isSoftwareGl: boolean,
    enableShadows: boolean
  ): void {
    this.dispose();
    this.isCircuit = isCircuit;
    this.samples = samples;

    AI_RACERS.forEach((cfg, idx) => {
      const spec = VEHICLE_SPECS.find((v) => v.id === cfg.vehicleId) ?? VEHICLE_SPECS[0];
      const custom = createDefaultCustomization(spec.id);
      custom.colorId = cfg.colorId;
      const rig = createVehicleModel(spec, custom, textures, isSoftwareGl, enableShadows);

      let sx = 0;
      let sz = 0;
      let syaw = 0;

      if (isCircuit && samples.length > 0) {
        const s = samples[0];
        const lane = idx % 2 === 0 ? -2.8 : 2.8;
        const backDist = 6 + idx * 5.2;
        sx = s.pos.x + s.normal.x * lane - s.tangent.x * backDist;
        sz = s.pos.z + s.normal.z * lane - s.tangent.z * backDist;
        syaw = Math.atan2(s.tangent.x, s.tangent.z);
      } else {
        // Street racing grid along Mustaqillik Boulevard facing north (yaw = PI)
        const lane = idx % 2 === 0 ? -2.6 : 2.6;
        const backDist = 6 + idx * 5.2;
        sx = lane;
        sz = 18 + backDist;
        syaw = Math.PI;
      }

      rig.root.position.set(sx, 0, sz);
      rig.root.rotation.y = syaw;
      this.group.add(rig.root);

      this.racers.push({
        id: cfg.id,
        name: cfg.name,
        vehicleName: spec.name,
        rig,
        x: sx,
        z: sz,
        yaw: syaw,
        speed: 0,
        maxSpeed: (spec.maxSpeedKmh / 3.6) * 0.72 * cfg.paceFactor,
        paceFactor: cfg.paceFactor,
        laneOffset: (idx - 1) * 2.6,
        wheelSpin: 0,
        lap: 1,
        waypointIdx: isCircuit ? 1 : 0,
        progress: -0.02 * (idx + 1),
        finished: false,
        finishTimeSec: null,
      });
    });
  }

  public update(
    dt: number,
    raceActive: boolean,
    totalLaps: number,
    elapsedRaceSec: number,
    playerX: number,
    playerZ: number
  ): void {
    for (let i = 0; i < this.racers.length; i++) {
      const r = this.racers[i];
      if (!raceActive) {
        r.rig.setBrakeAndReverse(true, false);
        continue;
      }

      // 1. Target Point Selection
      let tx = 0;
      let tz = 0;
      let upcomingSharpness = 0;

      if (this.isCircuit && this.samples.length > 0) {
        const len = this.samples.length;
        const curIdx = r.waypointIdx % len;
        const targetSample = this.samples[(curIdx + 6) % len];
        const farSample = this.samples[(curIdx + 16) % len];

        tx = targetSample.pos.x + targetSample.normal.x * r.laneOffset;
        tz = targetSample.pos.z + targetSample.normal.z * r.laneOffset;

        // Curvature look-ahead for braking before hairpins
        const dot =
          targetSample.tangent.x * farSample.tangent.x +
          targetSample.tangent.z * farSample.tangent.z;
        upcomingSharpness = Math.max(0, 1 - dot);

        // Advance spline index when close
        const curPt = this.samples[curIdx].pos;
        const dSq = (r.x - curPt.x) ** 2 + (r.z - curPt.z) ** 2;
        if (dSq < 14 * 14) {
          const prevIdx = r.waypointIdx;
          r.waypointIdx = (r.waypointIdx + 1) % len;
          if (r.waypointIdx < prevIdx) {
            if (r.lap < totalLaps) {
              r.lap += 1;
            } else if (!r.finished) {
              r.finished = true;
              r.finishTimeSec = elapsedRaceSec;
            }
          }
        }
        r.progress = (r.lap - 1) + r.waypointIdx / len;
      } else {
        // Street racing waypoints
        const wp = this.streetPoints[Math.min(r.waypointIdx, this.streetPoints.length - 1)];
        tx = wp.x + r.laneOffset * 0.6;
        tz = wp.z;

        const dSq = (r.x - wp.x) ** 2 + (r.z - wp.z) ** 2;
        if (dSq < 11 * 11) {
          if (r.waypointIdx + 1 < this.streetPoints.length) {
            r.waypointIdx += 1;
          } else if (!r.finished) {
            r.finished = true;
            r.finishTimeSec = elapsedRaceSec;
          }
        }
        r.progress = r.waypointIdx / this.streetPoints.length;
      }

      // 2. Lateral Avoidance from Player & Other AI Cars
      let avoidSteer = 0;
      const checkAvoid = (ox: number, oz: number) => {
        const dx = ox - r.x;
        const dz = oz - r.z;
        const distSq = dx * dx + dz * dz;
        if (distSq < 6.5 * 6.5 && distSq > 0.1) {
          const fwdX = Math.sin(r.yaw);
          const fwdZ = Math.cos(r.yaw);
          const ahead = dx * fwdX + dz * fwdZ;
          if (ahead > 0) {
            const rightX = Math.cos(r.yaw);
            const rightZ = -Math.sin(r.yaw);
            const side = dx * rightX + dz * rightZ;
            avoidSteer += side > 0 ? 0.35 : -0.35;
          }
        }
      };
      checkAvoid(playerX, playerZ);
      for (let j = 0; j < this.racers.length; j++) {
        if (i !== j) checkAvoid(this.racers[j].x, this.racers[j].z);
      }

      // 3. Steering Toward Target
      const desiredYaw = Math.atan2(tx - r.x, tz - r.z);
      let yawDiff = desiredYaw - r.yaw;
      while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
      while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;

      const steerCmd = THREE.MathUtils.clamp(yawDiff * 1.8 + avoidSteer, -0.55, 0.55);

      // 4. Target Speed (slows smoothly for sharp corners or post-finish cruise)
      let targetSpeed = r.finished ? 12 : r.maxSpeed * (1 - Math.min(0.62, upcomingSharpness * 1.35));
      if (Math.abs(yawDiff) > 0.6) targetSpeed *= 0.65;

      const accelRate = r.speed < targetSpeed ? 11.5 : 16.0;
      const prevSpeed = r.speed;
      r.speed += (targetSpeed - r.speed) * Math.min(1, dt * (accelRate * 0.14));
      const isBraking = r.speed < prevSpeed - 0.08;

      // Integrate bicycle motion
      if (r.speed > 0.2) {
        r.yaw += (r.speed * Math.tan(steerCmd)) / 2.75 * dt;
      }
      r.x += Math.sin(r.yaw) * r.speed * dt;
      r.z += Math.cos(r.yaw) * r.speed * dt;
      r.wheelSpin += (r.speed / 0.34) * dt;

      // Apply to 3D rig
      r.rig.root.position.set(r.x, 0, r.z);
      r.rig.root.rotation.y = r.yaw;
      r.rig.frontLeftPivot.rotation.y = steerCmd * 0.7;
      r.rig.frontRightPivot.rotation.y = steerCmd * 0.7;
      for (let w = 0; w < r.rig.wheelSpinGroups.length; w++) {
        r.rig.wheelSpinGroups[w].rotation.x = r.wheelSpin;
      }
      r.rig.setBrakeAndReverse(isBraking, false);
    }
  }

  public resolvePlayerCollisions(
    px: number,
    pz: number,
    pvx: number,
    pvz: number
  ): { x: number; z: number; vx: number; vz: number; impact: number } {
    let x = px;
    let z = pz;
    let vx = pvx;
    let vz = pvz;
    let maxImpact = 0;

    const minDist = 2.35;
    for (const r of this.racers) {
      const dx = x - r.x;
      const dz = z - r.z;
      const dSq = dx * dx + dz * dz;
      if (dSq < minDist * minDist && dSq > 0.0001) {
        const d = Math.sqrt(dSq);
        const nx = dx / d;
        const nz = dz / d;
        const overlap = minDist - d;
        x += nx * overlap * 0.65;
        z += nz * overlap * 0.65;
        r.x -= nx * overlap * 0.35;
        r.z -= nz * overlap * 0.35;

        const rvx = Math.sin(r.yaw) * r.speed;
        const rvz = Math.cos(r.yaw) * r.speed;
        const relVn = (vx - rvx) * nx + (vz - rvz) * nz;
        if (relVn < 0) {
          maxImpact = Math.max(maxImpact, Math.min(1, Math.abs(relVn) / 14));
          vx -= 1.05 * relVn * nx;
          vz -= 1.05 * relVn * nz;
        }
      }
    }
    return { x, z, vx, vz, impact: maxImpact };
  }

  public setHeadlights(on: boolean): void {
    this.racers.forEach((r) => r.rig.setHeadlights(on));
  }

  public dispose(): void {
    this.racers.forEach((r) => {
      this.group.remove(r.rig.root);
      r.rig.dispose();
    });
    this.racers = [];
  }
}
