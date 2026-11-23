import * as THREE from 'three';
import { CameraMode } from '../types/game';
import { VehicleRig } from './vehicles';

// Module-scope reusable math helpers (zero per-frame GC)
const _desiredPos = new THREE.Vector3();
const _desiredLook = new THREE.Vector3();
const _forward = new THREE.Vector3();
const _shakeVec = new THREE.Vector3();

export class CameraController {
  private currentPos = new THREE.Vector3();
  private currentLook = new THREE.Vector3();
  private shakeIntensity = 0;
  private initialized = false;

  public reset(rig: VehicleRig, mode: CameraMode, camera: THREE.PerspectiveCamera): void {
    rig.root.updateMatrixWorld(true);
    this.computeTargets(rig, mode);
    this.currentPos.copy(_desiredPos);
    this.currentLook.copy(_desiredLook);
    camera.position.copy(this.currentPos);
    camera.lookAt(this.currentLook);
    this.shakeIntensity = 0;
    this.initialized = true;
  }

  public addShake(amount: number): void {
    this.shakeIntensity = Math.min(0.45, this.shakeIntensity + amount);
  }

  private computeTargets(rig: VehicleRig, mode: CameraMode): void {
    rig.root.getWorldDirection(_forward); // local +Z in world space

    if (mode === 0) {
      // Third-person Chase Camera
      rig.chaseAnchor.getWorldPosition(_desiredPos);
      rig.root.getWorldPosition(_desiredLook);
      _desiredLook.y += 1.15;
      _desiredLook.addScaledVector(_forward, 4.0);
    } else if (mode === 1) {
      // Close Rear Parking Camera
      rig.closeAnchor.getWorldPosition(_desiredPos);
      rig.root.getWorldPosition(_desiredLook);
      _desiredLook.y += 0.95;
      _desiredLook.addScaledVector(_forward, 2.2);
    } else if (mode === 2) {
      // First-person Cockpit Camera
      rig.cockpitAnchor.getWorldPosition(_desiredPos);
      _desiredLook.copy(_desiredPos).addScaledVector(_forward, 12.0);
      _desiredLook.y -= 0.45;
    } else {
      // Front Bumper / Hood Camera
      rig.frontAnchor.getWorldPosition(_desiredPos);
      _desiredLook.copy(_desiredPos).addScaledVector(_forward, 14.0);
      _desiredLook.y -= 0.35;
    }
  }

  public update(
    camera: THREE.PerspectiveCamera,
    rig: VehicleRig,
    mode: CameraMode,
    dt: number
  ): void {
    rig.root.updateMatrixWorld(true);
    this.computeTargets(rig, mode);

    if (!this.initialized) {
      this.currentPos.copy(_desiredPos);
      this.currentLook.copy(_desiredLook);
      this.initialized = true;
    }

    if (mode === 2 || mode === 3) {
      // Rigidly smooth cockpit & bumper cameras so interior/hood never clips
      const posLambda = 28;
      this.currentPos.x = THREE.MathUtils.damp(this.currentPos.x, _desiredPos.x, posLambda, dt);
      this.currentPos.y = THREE.MathUtils.damp(this.currentPos.y, _desiredPos.y, posLambda, dt);
      this.currentPos.z = THREE.MathUtils.damp(this.currentPos.z, _desiredPos.z, posLambda, dt);
      this.currentLook.x = THREE.MathUtils.damp(this.currentLook.x, _desiredLook.x, posLambda, dt);
      this.currentLook.y = THREE.MathUtils.damp(this.currentLook.y, _desiredLook.y, posLambda, dt);
      this.currentLook.z = THREE.MathUtils.damp(this.currentLook.z, _desiredLook.z, posLambda, dt);
    } else {
      const posLambda = mode === 0 ? 7.5 : 10.5;
      const lookLambda = mode === 0 ? 11.0 : 14.0;
      this.currentPos.x = THREE.MathUtils.damp(this.currentPos.x, _desiredPos.x, posLambda, dt);
      this.currentPos.y = THREE.MathUtils.damp(this.currentPos.y, _desiredPos.y, posLambda, dt);
      this.currentPos.z = THREE.MathUtils.damp(this.currentPos.z, _desiredPos.z, posLambda, dt);
      this.currentLook.x = THREE.MathUtils.damp(this.currentLook.x, _desiredLook.x, lookLambda, dt);
      this.currentLook.y = THREE.MathUtils.damp(this.currentLook.y, _desiredLook.y, lookLambda, dt);
      this.currentLook.z = THREE.MathUtils.damp(this.currentLook.z, _desiredLook.z, lookLambda, dt);
    }

    // Apply decaying collision camera shake
    if (this.shakeIntensity > 0.002) {
      _shakeVec.set(
        (Math.random() - 0.5) * this.shakeIntensity,
        (Math.random() - 0.5) * this.shakeIntensity * 0.7,
        (Math.random() - 0.5) * this.shakeIntensity
      );
      camera.position.copy(this.currentPos).add(_shakeVec);
      this.shakeIntensity *= Math.exp(-9.5 * dt);
    } else {
      this.shakeIntensity = 0;
      camera.position.copy(this.currentPos);
    }

    camera.lookAt(this.currentLook);
  }
}
