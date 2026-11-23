import * as THREE from 'three';
import { CarCustomization, GearMode, VehicleSpec } from '../types/game';
import { ColliderBox } from './city';
import { VehicleRig } from './vehicles';

export interface VehicleInput {
  throttle: number; // 0..1
  brake: number; // 0..1
  steer: number; // -1..1 (positive = steer left)
  handbrake: boolean;
  gear: GearMode;
  autoTransmission: boolean;
}

export interface PhysicsState {
  x: number;
  z: number;
  yaw: number;
  vx: number;
  vz: number;
  forwardSpeed: number; // m/s signed
  lateralSpeed: number; // m/s
  steerAngle: number; // radians
  wheelSpin: number; // radians
  pitch: number;
  pitchVel: number;
  roll: number;
  rollVel: number;
  rpmRatio: number;
  skidAmount: number;
  driftIntensity: number; // 0..1
  exhaustFlameTimer: number;
  activeGear: GearMode;
}

const FORWARD_GEARS: GearMode[] = ['1', '2', '3', '4', '5', '6'];
// Speed ratio ceilings for each gear [0..1 of maxSpeed]
const GEAR_MAX_FRAC = [0.22, 0.38, 0.54, 0.72, 0.88, 1.04];
const GEAR_TORQUE_MULT = [1.52, 1.28, 1.12, 0.96, 0.84, 0.74];

export class VehiclePhysics {
  public state: PhysicsState;
  private spec: VehicleSpec;
  private custom: CarCustomization;

  constructor(
    spec: VehicleSpec,
    custom: CarCustomization,
    spawnX = 0,
    spawnZ = 24,
    spawnYaw = Math.PI
  ) {
    this.spec = spec;
    this.custom = custom;
    this.state = {
      x: spawnX,
      z: spawnZ,
      yaw: spawnYaw,
      vx: 0,
      vz: 0,
      forwardSpeed: 0,
      lateralSpeed: 0,
      steerAngle: 0,
      wheelSpin: 0,
      pitch: 0,
      pitchVel: 0,
      roll: 0,
      rollVel: 0,
      rpmRatio: 0.14,
      skidAmount: 0,
      driftIntensity: 0,
      exhaustFlameTimer: 0,
      activeGear: '1',
    };
  }

  public reset(x: number, z: number, yaw: number): void {
    this.state.x = x;
    this.state.z = z;
    this.state.yaw = yaw;
    this.state.vx = 0;
    this.state.vz = 0;
    this.state.forwardSpeed = 0;
    this.state.lateralSpeed = 0;
    this.state.steerAngle = 0;
    this.state.pitch = 0;
    this.state.pitchVel = 0;
    this.state.roll = 0;
    this.state.rollVel = 0;
    this.state.rpmRatio = 0.14;
    this.state.skidAmount = 0;
    this.state.driftIntensity = 0;
    this.state.exhaustFlameTimer = 0;
    this.state.activeGear = '1';
  }

  public setSpecAndCustom(spec: VehicleSpec, custom: CarCustomization): void {
    this.spec = spec;
    this.custom = custom;
  }

  public step(
    dt: number,
    input: VehicleInput,
    colliders: ColliderBox[],
    rig: VehicleRig,
    trackConstrainFn?: (
      x: number,
      z: number,
      vx: number,
      vz: number,
      radius: number
    ) => { x: number; z: number; vx: number; vz: number; impact: number }
  ): { collisionIntensity: number; gearChangedTo: GearMode | null } {
    const s = this.state;
    const spec = this.spec;
    const upg = this.custom.upgrades;

    // Performance upgrade multipliers
    const engineMult = 1 + upg.engine * 0.085;
    const maxSpeedMult = 1 + upg.engine * 0.05 + upg.transmission * 0.03;
    const transMult = 1 + upg.transmission * 0.09;
    const brakeMult = 1 + upg.brakes * 0.10;
    const gripMult = 1 + upg.tires * 0.10;
    const suspMult = 1 + upg.suspension * 0.12;

    const fwdX = Math.sin(s.yaw);
    const fwdZ = Math.cos(s.yaw);
    const rightX = Math.cos(s.yaw);
    const rightZ = -Math.sin(s.yaw);

    let vForward = s.vx * fwdX + s.vz * fwdZ;
    let vLateral = s.vx * rightX + s.vz * rightZ;
    const absSpeed = Math.abs(vForward);

    const maxForwardMs = (spec.maxSpeedKmh * maxSpeedMult) / 3.6;
    const maxReverseMs = spec.maxReverseKmh / 3.6;

    // 1. Transmission (Auto assist in forward gears or manual)
    let activeGear = input.gear;
    let gearChangedTo: GearMode | null = null;
    if (input.gear !== 'R' && input.gear !== 'N') {
      if (input.autoTransmission) {
        const speedFrac = Math.max(0, vForward) / maxForwardMs;
        let desiredIdx = 0;
        for (let g = 0; g < FORWARD_GEARS.length; g++) {
          if (speedFrac > GEAR_MAX_FRAC[g] * 0.88 && g < FORWARD_GEARS.length - 1) {
            desiredIdx = g + 1;
          }
        }
        const nextG = FORWARD_GEARS[desiredIdx];
        if (nextG !== s.activeGear) {
          if (desiredIdx > FORWARD_GEARS.indexOf(s.activeGear) && input.throttle > 0.4) {
            s.exhaustFlameTimer = 0.16;
          }
          gearChangedTo = nextG;
        }
        activeGear = nextG;
      } else {
        activeGear = input.gear;
      }
    }
    s.activeGear = activeGear;

    // 2. Speed-Dependent Steering + Counter-Steer Stability
    const speedFactor = 1 / (1 + absSpeed * 0.042);
    const targetSteer = input.steer * spec.maxSteerAngle * (0.30 + 0.70 * speedFactor);
    const steerLerp = 1 - Math.exp(-spec.steerSpeed * 3.1 * dt);
    s.steerAngle += (targetSteer - s.steerAngle) * steerLerp;

    // 3. Engine Drive Force & Braking
    let driveForce = 0;
    const gIdx = FORWARD_GEARS.indexOf(activeGear);

    if (activeGear === 'R') {
      if (input.throttle > 0 && vForward > -maxReverseMs) {
        driveForce = -input.throttle * spec.reverseForce;
      }
    } else if (gIdx >= 0 && input.throttle > 0) {
      const gearCeilingMs = maxForwardMs * GEAR_MAX_FRAC[gIdx];
      if (vForward < gearCeilingMs) {
        const torqueMult = GEAR_TORQUE_MULT[gIdx] * engineMult * transMult;
        const revLim = 1 - 0.25 * Math.min(1, Math.max(0, vForward / gearCeilingMs));
        driveForce = input.throttle * spec.engineForce * torqueMult * revLim;
      }
    }

    let brakeDecel = 0;
    if (input.brake > 0) brakeDecel += input.brake * spec.brakeForce * brakeMult;
    if (input.handbrake) brakeDecel += spec.brakeForce * 0.95 * brakeMult;

    const rollingDrag = vForward * 190 + vForward * absSpeed * 5.6;
    let netForwardForce = driveForce - rollingDrag;

    if (brakeDecel > 0) {
      if (absSpeed > 0.15) {
        netForwardForce -= Math.sign(vForward) * brakeDecel;
      } else {
        vForward = 0;
        netForwardForce = 0;
      }
    }

    const accelForward = netForwardForce / spec.mass;
    const prevForward = vForward;
    vForward += accelForward * dt;

    if (brakeDecel > 0 && Math.sign(prevForward) !== 0 && Math.sign(vForward) !== Math.sign(prevForward)) {
      vForward = 0;
    }
    if (Math.abs(vForward) < 0.02 && input.throttle === 0) {
      vForward = 0;
    }

    // 4. Yaw & Controlled Drifting Dynamics
    const isHandbrakeDrift = input.handbrake && absSpeed > 6.5 && Math.abs(input.steer) > 0.15;
    const highSpeedSharpTurn = absSpeed > 16 && Math.abs(input.steer) > 0.72 && input.throttle > 0.5;
    const driftSlip = isHandbrakeDrift
      ? 1.0
      : highSpeedSharpTurn
      ? 0.45 * spec.driftFactor
      : 0.0;

    if (Math.abs(vForward) > 0.04) {
      const turnRadiusFactor = Math.tan(s.steerAngle) / spec.wheelBase;
      const yawBoost = 1 + driftSlip * 0.38;
      s.yaw += vForward * turnRadiusFactor * yawBoost * dt;
    }

    // Lateral tire grip (lower grip during handbrake/drift allows smooth controlled slide!)
    const effectiveGrip =
      spec.lateralGrip * gripMult * (isHandbrakeDrift ? 0.24 : highSpeedSharpTurn ? 0.52 : 1.0);
    vLateral *= Math.exp(-effectiveGrip * dt);

    const nFwdX = Math.sin(s.yaw);
    const nFwdZ = Math.cos(s.yaw);
    const nRightX = Math.cos(s.yaw);
    const nRightZ = -Math.sin(s.yaw);

    s.vx = nFwdX * vForward + nRightX * vLateral;
    s.vz = nFwdZ * vForward + nRightZ * vLateral;

    let nextX = s.x + s.vx * dt;
    let nextZ = s.z + s.vz * dt;
    let collisionIntensity = 0;

    // 5. Optional Curved Circuit Barrier Constraint
    if (trackConstrainFn) {
      const res = trackConstrainFn(nextX, nextZ, s.vx, s.vz, spec.width * 0.52);
      nextX = res.x;
      nextZ = res.z;
      s.vx = res.vx;
      s.vz = res.vz;
      if (res.impact > 0.04) collisionIntensity = Math.max(collisionIntensity, res.impact);
    }

    // 6. Multi-Circle Car Footprint vs ColliderBox Collision Resolution
    const halfW = spec.width * 0.45;
    const testOffsets = [spec.length * 0.30, 0, -spec.length * 0.30];

    for (let pass = 0; pass < 2; pass++) {
      for (const offset of testOffsets) {
        const cx = nextX + nFwdX * offset;
        const cz = nextZ + nFwdZ * offset;

        for (let i = 0; i < colliders.length; i++) {
          const box = colliders[i];
          if (
            cx + halfW < box.minX ||
            cx - halfW > box.maxX ||
            cz + halfW < box.minZ ||
            cz - halfW > box.maxZ
          ) {
            continue;
          }

          const closestX = Math.max(box.minX, Math.min(cx, box.maxX));
          const closestZ = Math.max(box.minZ, Math.min(cz, box.maxZ));
          const dx = cx - closestX;
          const dz = cz - closestZ;
          const distSq = dx * dx + dz * dz;

          if (distSq < halfW * halfW) {
            const dist = Math.sqrt(distSq);
            let nx = 0;
            let nz = 0;
            let pen = 0;
            if (dist > 0.0001) {
              nx = dx / dist;
              nz = dz / dist;
              pen = halfW - dist;
            } else {
              const pL = Math.abs(cx - box.minX);
              const pR = Math.abs(box.maxX - cx);
              const pT = Math.abs(cz - box.minZ);
              const pB = Math.abs(box.maxZ - cz);
              const m = Math.min(pL, pR, pT, pB);
              if (m === pL) { nx = -1; pen = pL + halfW; }
              else if (m === pR) { nx = 1; pen = pR + halfW; }
              else if (m === pT) { nz = -1; pen = pT + halfW; }
              else { nz = 1; pen = pB + halfW; }
            }

            nextX += nx * pen;
            nextZ += nz * pen;

            const vn = s.vx * nx + s.vz * nz;
            if (vn < 0) {
              const impact = Math.abs(vn);
              if (impact > 1.2) {
                collisionIntensity = Math.max(collisionIntensity, Math.min(1, impact / 13));
              }
              s.vx -= 1.15 * vn * nx;
              s.vz -= 1.15 * vn * nz;
              s.vx *= 0.86;
              s.vz *= 0.86;
            }
          }
        }
      }
    }

    s.x = nextX;
    s.z = nextZ;
    s.forwardSpeed = s.vx * nFwdX + s.vz * nFwdZ;
    s.lateralSpeed = s.vx * nRightX + s.vz * nRightZ;

    // 7. Suspension Pitch & Roll Weight Transfer
    const effStiff = spec.suspensionStiffness * suspMult;
    const targetPitch = THREE.MathUtils.clamp(-accelForward * 0.004 / effStiff, -0.055, 0.055);
    const centripetal =
      Math.abs(s.forwardSpeed) > 0.5
        ? (s.forwardSpeed * s.forwardSpeed * Math.tan(s.steerAngle)) / spec.wheelBase
        : 0;
    const targetRoll = THREE.MathUtils.clamp(centripetal * 0.0052 / effStiff, -0.068, 0.068);

    const springK = 52 * effStiff;
    const dampC = 9.8;
    s.pitchVel += ((targetPitch - s.pitch) * springK - s.pitchVel * dampC) * dt;
    s.pitch += s.pitchVel * dt;
    s.rollVel += ((targetRoll - s.roll) * springK - s.rollVel * dampC) * dt;
    s.roll += s.rollVel * dt;

    // 8. Wheel Spin, RPM, Drift Intensity & Exhaust Flames
    s.wheelSpin += (s.forwardSpeed / spec.wheelRadius) * dt;

    let gearRpm = 0.14;
    if (gIdx >= 0) {
      const prevMax = gIdx === 0 ? 0 : maxForwardMs * GEAR_MAX_FRAC[gIdx - 1] * 0.72;
      const curMax = maxForwardMs * GEAR_MAX_FRAC[gIdx];
      gearRpm = THREE.MathUtils.clamp(
        0.18 + ((Math.max(0, s.forwardSpeed) - prevMax) / Math.max(2, curMax - prevMax)) * 0.78,
        0.14,
        0.98
      );
    } else if (activeGear === 'R') {
      gearRpm = Math.min(0.85, 0.18 + (absSpeed / maxReverseMs) * 0.65);
    }
    s.rpmRatio += (gearRpm + input.throttle * 0.06 - s.rpmRatio) * Math.min(1, dt * 10);

    const latSlipRatio = Math.min(1, Math.abs(s.lateralSpeed) / 6.5);
    const isHardBraking = (input.brake > 0.5 || input.handbrake) && absSpeed > 5.0;
    s.driftIntensity = Math.max(latSlipRatio, isHandbrakeDrift ? 0.85 : 0);
    s.skidAmount = isHardBraking ? Math.min(1, absSpeed / 15) : s.driftIntensity * 0.8;

    if (s.exhaustFlameTimer > 0) {
      s.exhaustFlameTimer = Math.max(0, s.exhaustFlameTimer - dt);
    }

    // 9. Apply Transforms to 3D Rig
    rig.root.position.set(s.x, 0, s.z);
    rig.root.rotation.y = s.yaw;
    rig.chassisGroup.rotation.x = s.pitch;
    rig.chassisGroup.rotation.z = s.roll;

    rig.frontLeftPivot.rotation.y = s.steerAngle;
    rig.frontRightPivot.rotation.y = s.steerAngle;
    rig.steeringWheel.rotation.z = -s.steerAngle * 2.6;

    for (let i = 0; i < rig.wheelSpinGroups.length; i++) {
      rig.wheelSpinGroups[i].rotation.x = s.wheelSpin;
    }

    rig.setBrakeAndReverse(input.brake > 0.05 || input.handbrake, activeGear === 'R');
    rig.setExhaustFlame(s.exhaustFlameTimer > 0 ? 1 : 0);

    return { collisionIntensity, gearChangedTo };
  }
}
