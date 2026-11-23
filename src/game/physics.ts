import * as THREE from 'three';
import { GearMode, VehicleSpec } from '../types/game';
import { ColliderBox } from './city';
import { VehicleRig } from './vehicles';

export interface VehicleInput {
  throttle: number; // 0..1
  brake: number; // 0..1
  steer: number; // -1..1 (positive = steer left)
  handbrake: boolean;
  gear: GearMode;
}

export interface PhysicsState {
  x: number;
  z: number;
  yaw: number;
  vx: number;
  vz: number;
  forwardSpeed: number; // m/s signed along car heading
  lateralSpeed: number; // m/s
  steerAngle: number; // radians
  wheelSpin: number; // radians
  pitch: number;
  pitchVel: number;
  roll: number;
  rollVel: number;
  rpmRatio: number;
  skidAmount: number;
}

export class VehiclePhysics {
  public state: PhysicsState;
  private spec: VehicleSpec;

  constructor(spec: VehicleSpec, spawnX = 0, spawnZ = 24, spawnYaw = Math.PI) {
    this.spec = spec;
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
      rpmRatio: 0.12,
      skidAmount: 0,
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
    this.state.rpmRatio = 0.12;
    this.state.skidAmount = 0;
  }

  public setSpec(spec: VehicleSpec): void {
    this.spec = spec;
  }

  public step(
    dt: number,
    input: VehicleInput,
    colliders: ColliderBox[],
    rig: VehicleRig
  ): { collisionIntensity: number } {
    const s = this.state;
    const spec = this.spec;

    const fwdX = Math.sin(s.yaw);
    const fwdZ = Math.cos(s.yaw);
    const rightX = Math.cos(s.yaw);
    const rightZ = -Math.sin(s.yaw);

    // Decompose current velocity into local forward & lateral
    let vForward = s.vx * fwdX + s.vz * fwdZ;
    let vLateral = s.vx * rightX + s.vz * rightZ;
    const absSpeed = Math.abs(vForward);

    // 1. Speed-dependent steering target
    const speedFactor = 1 / (1 + absSpeed * 0.055);
    const targetSteer = input.steer * spec.maxSteerAngle * (0.28 + 0.72 * speedFactor);
    const steerLerp = 1 - Math.exp(-spec.steerSpeed * 3.0 * dt);
    s.steerAngle += (targetSteer - s.steerAngle) * steerLerp;

    // 2. Longitudinal Forces (Engine, Braking, Rolling Resistance, Drag)
    let driveForce = 0;
    const maxForwardMs = spec.maxSpeedKmh / 3.6;
    const maxReverseMs = spec.maxReverseKmh / 3.6;

    if (input.gear === 'D' && input.throttle > 0) {
      if (vForward < maxForwardMs) {
        const torqueCurve = 1 - 0.35 * Math.min(1, Math.max(0, vForward / maxForwardMs));
        driveForce = input.throttle * spec.engineForce * torqueCurve;
      }
    } else if (input.gear === 'R' && input.throttle > 0) {
      if (vForward > -maxReverseMs) {
        driveForce = -input.throttle * spec.reverseForce;
      }
    }

    // Braking & Handbrake
    let brakeDecel = 0;
    if (input.brake > 0) {
      brakeDecel += input.brake * spec.brakeForce;
    }
    if (input.handbrake) {
      brakeDecel += spec.brakeForce * 1.15;
    }

    // Rolling resistance + aerodynamic drag
    const rollingDrag = vForward * 240 + vForward * absSpeed * 8.5;
    let netForwardForce = driveForce - rollingDrag;

    if (brakeDecel > 0) {
      if (absSpeed > 0.12) {
        netForwardForce -= Math.sign(vForward) * brakeDecel;
      } else {
        vForward = 0;
        netForwardForce = 0;
      }
    }

    const accelForward = netForwardForce / spec.mass;
    const prevForward = vForward;
    vForward += accelForward * dt;

    // Prevent brake from reversing car direction when coming to a stop
    if (brakeDecel > 0 && Math.sign(prevForward) !== 0 && Math.sign(vForward) !== Math.sign(prevForward)) {
      vForward = 0;
    }
    if (Math.abs(vForward) < 0.02 && input.throttle === 0) {
      vForward = 0;
    }

    // 3. Bicycle / Ackermann Steering Yaw Rate + Realistic Grip
    if (Math.abs(vForward) > 0.04) {
      const turnRadiusFactor = Math.tan(s.steerAngle) / spec.wheelBase;
      const handbrakeTurnBoost = input.handbrake ? 1.32 : 1.0;
      const yawRate = vForward * turnRadiusFactor * handbrakeTurnBoost;
      s.yaw += yawRate * dt;
    }

    // Lateral tire grip (high grip normally, reduced slightly during handbrake)
    const lateralGrip = input.handbrake ? 3.2 : 9.5;
    vLateral *= Math.exp(-lateralGrip * dt);

    // Reconstruct world velocity using updated yaw
    const nFwdX = Math.sin(s.yaw);
    const nFwdZ = Math.cos(s.yaw);
    const nRightX = Math.cos(s.yaw);
    const nRightZ = -Math.sin(s.yaw);

    s.vx = nFwdX * vForward + nRightX * vLateral;
    s.vz = nFwdZ * vForward + nRightZ * vLateral;

    // Integrate position
    const nextX = s.x + s.vx * dt;
    const nextZ = s.z + s.vz * dt;

    // 4. Multi-Circle Car Footprint vs ColliderBox Collision Detection & Smooth Sliding
    let collisionIntensity = 0;
    const halfW = spec.width * 0.45;
    const frontOffset = spec.length * 0.30;
    const rearOffset = -spec.length * 0.30;
    const circleRadius = halfW;

    let resolvedX = nextX;
    let resolvedZ = nextZ;

    const testOffsets = [frontOffset, 0, rearOffset];
    for (let pass = 0; pass < 2; pass++) {
      for (const offset of testOffsets) {
        const cx = resolvedX + nFwdX * offset;
        const cz = resolvedZ + nFwdZ * offset;

        for (let i = 0; i < colliders.length; i++) {
          const box = colliders[i];
          // Quick broadphase
          if (
            cx + circleRadius < box.minX ||
            cx - circleRadius > box.maxX ||
            cz + circleRadius < box.minZ ||
            cz - circleRadius > box.maxZ
          ) {
            continue;
          }

          const closestX = Math.max(box.minX, Math.min(cx, box.maxX));
          const closestZ = Math.max(box.minZ, Math.min(cz, box.maxZ));
          const dx = cx - closestX;
          const dz = cz - closestZ;
          const distSq = dx * dx + dz * dz;

          if (distSq < circleRadius * circleRadius) {
            const dist = Math.sqrt(distSq);
            let nx = 0;
            let nz = 0;
            let pen = 0;

            if (dist > 0.0001) {
              nx = dx / dist;
              nz = dz / dist;
              pen = circleRadius - dist;
            } else {
              // Center is inside AABB — push out along shallowest axis
              const penLeft = Math.abs(cx - box.minX);
              const penRight = Math.abs(box.maxX - cx);
              const penTop = Math.abs(cz - box.minZ);
              const penBot = Math.abs(box.maxZ - cz);
              const minPen = Math.min(penLeft, penRight, penTop, penBot);
              if (minPen === penLeft) { nx = -1; pen = penLeft + circleRadius; }
              else if (minPen === penRight) { nx = 1; pen = penRight + circleRadius; }
              else if (minPen === penTop) { nz = -1; pen = penTop + circleRadius; }
              else { nz = 1; pen = penBot + circleRadius; }
            }

            resolvedX += nx * pen;
            resolvedZ += nz * pen;

            // Cancel velocity into wall & compute impact intensity
            const vn = s.vx * nx + s.vz * nz;
            if (vn < 0) {
              const impact = Math.abs(vn);
              if (impact > 1.2) {
                collisionIntensity = Math.max(collisionIntensity, Math.min(1, impact / 12));
              }
              s.vx -= 1.18 * vn * nx;
              s.vz -= 1.18 * vn * nz;
              s.vx *= 0.85;
              s.vz *= 0.85;
            }
          }
        }
      }
    }

    s.x = resolvedX;
    s.z = resolvedZ;
    s.forwardSpeed = s.vx * nFwdX + s.vz * nFwdZ;
    s.lateralSpeed = s.vx * nRightX + s.vz * nRightZ;

    // 5. Suspension Pitch & Roll Spring-Damper Simulation
    const targetPitch = THREE.MathUtils.clamp(-accelForward * 0.0042 / spec.suspensionStiffness, -0.055, 0.055);
    const centripetal = Math.abs(s.forwardSpeed) > 0.5 ? (s.forwardSpeed * s.forwardSpeed * Math.tan(s.steerAngle)) / spec.wheelBase : 0;
    const targetRoll = THREE.MathUtils.clamp(centripetal * 0.0055 / spec.suspensionStiffness, -0.065, 0.065);

    const springK = 48 * spec.suspensionStiffness;
    const dampC = 9.5;
    s.pitchVel += ((targetPitch - s.pitch) * springK - s.pitchVel * dampC) * dt;
    s.pitch += s.pitchVel * dt;
    s.rollVel += ((targetRoll - s.roll) * springK - s.rollVel * dampC) * dt;
    s.roll += s.rollVel * dt;

    // 6. Wheel Spin, RPM & Skid Amount
    s.wheelSpin += (s.forwardSpeed / spec.wheelRadius) * dt;
    const speedRatio = Math.min(1, Math.abs(s.forwardSpeed) / maxForwardMs);
    const targetRpm = Math.min(
      1,
      0.12 + ((speedRatio * 3.2) % 0.72) * 0.85 + input.throttle * 0.25
    );
    s.rpmRatio += (targetRpm - s.rpmRatio) * Math.min(1, dt * 8);

    const isHardBraking = (input.brake > 0.5 || input.handbrake) && Math.abs(s.forwardSpeed) > 4.5;
    s.skidAmount = isHardBraking ? Math.min(1, Math.abs(s.forwardSpeed) / 14) : 0;

    // 7. Apply Transforms to 3D Vehicle Rig
    rig.root.position.set(s.x, 0, s.z);
    rig.root.rotation.y = s.yaw;

    rig.chassisGroup.rotation.x = s.pitch;
    rig.chassisGroup.rotation.z = s.roll;

    rig.frontLeftPivot.rotation.y = s.steerAngle;
    rig.frontRightPivot.rotation.y = s.steerAngle;
    rig.steeringWheel.rotation.z = -s.steerAngle * 2.6;

    for (let i = 0; i < rig.wheelMeshes.length; i++) {
      rig.wheelMeshes[i].rotation.x = s.wheelSpin;
    }

    const isBrakingVisual = input.brake > 0.05 || input.handbrake;
    const isReversingVisual = input.gear === 'R';
    rig.setBrakeAndReverse(isBrakingVisual, isReversingVisual);

    return { collisionIntensity };
  }
}
