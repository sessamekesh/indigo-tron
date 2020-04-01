import { Camera } from "./camera";
import { vec3, mat4, quat } from "gl-matrix";
import { MathUtils } from "@libutil/mathutils";
import { TempGroupAllocator } from "@libutil/allocator";

/**
 * Camera that exposes convenience controlling methods - intended to be controlled by user input
 */
export class FreeMovementCamera implements Camera {
  private pos_ = vec3.create();
  private worldUpAxis_ = vec3.create();
  private worldForwardAxis_ = vec3.create();
  private spin_: number;
  private tilt_: number;

  constructor(
      pos: vec3,
      worldUpAxis: vec3,
      worldForwardAxis: vec3,
      spin: number,
      tilt: number,
      private vec3Allocator: TempGroupAllocator<vec3>,
      private quatAllocator: TempGroupAllocator<quat>) {
    vec3.copy(this.pos_, pos);
    vec3.copy(this.worldUpAxis_, worldUpAxis);
    vec3.copy(this.worldForwardAxis_, worldForwardAxis);
    this.spin_ = spin;
    this.tilt_ = tilt;
  }

  pos(o: vec3) {
    vec3.copy(o, this.pos_);
  }

  up(o: vec3) {
    vec3.copy(o, this.worldUpAxis_);
  }

  private isLookAtDirty_ = true;
  private lookAt_ = vec3.create();
  private tempForward_ = vec3.create();
  lookAt(o: vec3) {
    if (this.isLookAtDirty_) {
      this.forward(this.tempForward_);
      vec3.add(this.lookAt_, this.tempForward_, this.pos_);
      this.isLookAtDirty_ = false;
    }
    vec3.copy(o, this.lookAt_);
  }

  private tempLookAt_ = vec3.create();
  private matView_ = mat4.create();
  private isMatViewDirty_ = true;
  matView(o: mat4) {
    if (this.isMatViewDirty_) {
      this.lookAt(this.tempLookAt_);
      mat4.lookAt(this.matView_, this.pos_, this.tempLookAt_, this.worldUpAxis_);
      this.isMatViewDirty_ = false;
    }
    mat4.copy(o, this.matView_);
  }

  private isForwardDirty_ = true;
  private fwd_ = vec3.create();
  private forward(o: vec3) {
    if (this.isForwardDirty_) {
      MathUtils.getSphericalCoordinate(
        this.fwd_, this.worldUpAxis_, this.worldForwardAxis_, this.spin_, this.tilt_,
        this.vec3Allocator, this.quatAllocator);
      this.isForwardDirty_ = false;
    }
    vec3.copy(o, this.fwd_);
  }

  moveForward(distance: number) {
    this.forward(this.tempForward_);
    vec3.scaleAndAdd(this.pos_, this.pos_, this.tempForward_, distance);
    this.isLookAtDirty_ = true;
    this.isMatViewDirty_ = true;
  }

  private tempRight_ = vec3.create();
  moveRight(distance: number) {
    this.forward(this.tempForward_);
    vec3.cross(this.tempRight_, this.tempForward_, this.worldUpAxis_);
    vec3.scaleAndAdd(this.pos_, this.pos_, this.tempRight_, distance);
    this.isLookAtDirty_ = true;
    this.isMatViewDirty_ = true;
  }

  tiltUp(angle: number) {
    this.tilt_ = MathUtils.clamp(this.tilt_ + angle, -Math.PI * 0.4995, Math.PI * 0.4995);
    this.isLookAtDirty_ = true;
    this.isMatViewDirty_ = true;
    this.isForwardDirty_ = true;
  }

  spinRight(angle: number) {
    this.spin_ = MathUtils.clampAngle(this.spin_ - angle);
    this.isLookAtDirty_ = true;
    this.isMatViewDirty_ = true;
    this.isForwardDirty_ = true;
  }
}
