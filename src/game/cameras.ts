import * as THREE from 'three';
import { CameraMode } from '../types/game';
import { VehicleRig } from './vehicles';

const _desiredPos = new THREE.Vector3();
const _desiredLook = new THREE.Vector3();
const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _shakeVec = new THREE.Vector3();

export class CameraController {
  private currentPos = new THREE.Vector3();
  private currentLook = new THREE.Vector3();
  private shakeIntensity = 0;
  private currentFov = 62;
  private initialized = false;

  public reset(rig: VehicleRig, mode: CameraMode, camera: THREE.PerspectiveCamera): void {
    rig.root.updateMatrixWorld(true);
    this.computeTargets(rig, mode, 0, 0);
    this.currentPos.copy(_desiredPos);
    this.currentLook.copy(_desiredLook);
    this.currentFov = mode === 2 ? 66 : 62;
    camera.fov = this.currentFov;
    camera.updateProjectionMatrix();
    camera.position.copy(this.currentPos);
    camera.lookAt(this.currentLook);
    this.shakeIntensity = 0;
    this.initialized = true;
  }

  public addShake(amount: number): void {
    this.shakeIntensity = Math.min(0.32, this.shakeIntensity + amount);
  }

  private computeTargets(
    rig: VehicleRig,
    mode: CameraMode,
    speedNorm: number,
    lateralNorm: number
  ): void {
    rig.root.getWorldDirection(_forward); // local +Z
    _right.set(_forward.z, 0, -_forward.x).normalize();

    if (mode === 0) {
      // Dynamic Racing Chase Camera (pulls slightly back at high speed + subtle drift swing)
      rig.chaseAnchor.getWorldPosition(_desiredPos);
      _desiredPos.addScaledVector(_forward, -speedNorm * 0.75);
      _desiredPos.addScaledVector(_right, lateralNorm * 0.55);

      rig.root.getWorldPosition(_desiredLook);
      _desiredLook.y += 1.05;
      _desiredLook.addScaledVector(_forward, 4.8);
    } else if (mode === 1) {
      // Close Rear Camera
      rig.closeAnchor.getWorldPosition(_desiredPos);
      _desiredPos.addScaledVector(_forward, -speedNorm * 0.45);
      rig.root.getWorldPosition(_desiredLook);
      _desiredLook.y += 0.92;
      _desiredLook.addScaledVector(_forward, 2.8);
    } else if (mode === 2) {
      // First-person Cockpit Camera
      rig.cockpitAnchor.getWorldPosition(_desiredPos);
      _desiredLook.copy(_desiredPos).addScaledVector(_forward, 14.0);
      _desiredLook.y -= 0.40;
    } else {
      // Front Bumper Camera
      rig.frontAnchor.getWorldPosition(_desiredPos);
      _desiredLook.copy(_desiredPos).addScaledVector(_forward, 16.0);
      _desiredLook.y -= 0.30;
    }
  }

  public update(
    camera: THREE.PerspectiveCamera,
    rig: VehicleRig,
    mode: CameraMode,
    dt: number,
    speedMs = 0,
    lateralMs = 0
  ): void {
    rig.root.updateMatrixWorld(true);
    const speedNorm = THREE.MathUtils.clamp(Math.abs(speedMs) / 68, 0, 1);
    const lateralNorm = THREE.MathUtils.clamp(lateralMs / 16, -1, 1);

    this.computeTargets(rig, mode, speedNorm, lateralNorm);

    if (!this.initialized) {
      this.currentPos.copy(_desiredPos);
      this.currentLook.copy(_desiredLook);
      this.initialized = true;
    }

    // Speed-reactive FOV (subtle Forza-style sense of speed without motion sickness)
    const targetFov = mode === 2 ? 66 + speedNorm * 6 : 62 + speedNorm * 16;
    this.currentFov = THREE.MathUtils.damp(this.currentFov, targetFov, 5.5, dt);
    if (Math.abs(camera.fov - this.currentFov) > 0.05) {
      camera.fov = this.currentFov;
      camera.updateProjectionMatrix();
    }

    if (mode === 2 || mode === 3) {
      const posLambda = 32;
      this.currentPos.x = THREE.MathUtils.damp(this.currentPos.x, _desiredPos.x, posLambda, dt);
      this.currentPos.y = THREE.MathUtils.damp(this.currentPos.y, _desiredPos.y, posLambda, dt);
      this.currentPos.z = THREE.MathUtils.damp(this.currentPos.z, _desiredPos.z, posLambda, dt);
      this.currentLook.x = THREE.MathUtils.damp(this.currentLook.x, _desiredLook.x, posLambda, dt);
      this.currentLook.y = THREE.MathUtils.damp(this.currentLook.y, _desiredLook.y, posLambda, dt);
      this.currentLook.z = THREE.MathUtils.damp(this.currentLook.z, _desiredLook.z, posLambda, dt);
    } else {
      const posLambda = mode === 0 ? 8.5 : 11.5;
      const lookLambda = mode === 0 ? 12.0 : 15.0;
      this.currentPos.x = THREE.MathUtils.damp(this.currentPos.x, _desiredPos.x, posLambda, dt);
      this.currentPos.y = THREE.MathUtils.damp(this.currentPos.y, _desiredPos.y, posLambda, dt);
      this.currentPos.z = THREE.MathUtils.damp(this.currentPos.z, _desiredPos.z, posLambda, dt);
      this.currentLook.x = THREE.MathUtils.damp(this.currentLook.x, _desiredLook.x, lookLambda, dt);
      this.currentLook.y = THREE.MathUtils.damp(this.currentLook.y, _desiredLook.y, lookLambda, dt);
      this.currentLook.z = THREE.MathUtils.damp(this.currentLook.z, _desiredLook.z, lookLambda, dt);
    }

    if (this.shakeIntensity > 0.002) {
      _shakeVec.set(
        (Math.random() - 0.5) * this.shakeIntensity,
        (Math.random() - 0.5) * this.shakeIntensity * 0.6,
        (Math.random() - 0.5) * this.shakeIntensity
      );
      camera.position.copy(this.currentPos).add(_shakeVec);
      this.shakeIntensity *= Math.exp(-10.5 * dt);
    } else {
      this.shakeIntensity = 0;
      camera.position.copy(this.currentPos);
    }

    camera.lookAt(this.currentLook);
  }
}
