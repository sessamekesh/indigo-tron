import { Camera } from "./camera";
import { vec3, quat, mat4 } from "gl-matrix";
import { MathUtils } from "@libutil/mathutils";
import { TempGroupAllocator } from "@libutil/allocator";

/**
 * Camera that focuses on a center point, while rotating around at some adjustable radius
 */
export class RadialCamera implements Camera {
  private center_ = vec3.create();
  private worldUp_ = vec3.create();
  private worldForward_ = vec3.create();

  constructor(
      center: vec3,
      private radius: number,
      private minRadius: number,
      private maxRadius: number,
      worldUpAxis: vec3,
      worldForwardAxis: vec3,
      private spin: number,
      private tilt: number,
      private vec3Allocator: TempGroupAllocator<vec3>,
      private quatAllocator: TempGroupAllocator<quat>) {
    if (minRadius > maxRadius) {
      this.minRadius = maxRadius;
      this.maxRadius = minRadius;
    }
    this.radius = MathUtils.clamp(radius, this.minRadius, this.maxRadius);

    vec3.copy(this.center_, center);
    vec3.copy(this.worldUp_, worldUpAxis);
    vec3.copy(this.worldForward_, worldForwardAxis);
  }

  lookAt(o: vec3) {
    vec3.copy(o, this.center_);
  }

  private pos_ = vec3.create();
  private isPosDirty_ = true;
  pos(o: vec3) {
    if (this.isPosDirty_) {
      this.vec3Allocator.get(1, fwd => {
        this.fwd(fwd);
        vec3.scaleAndAdd(this.pos_, this.center_, this.fwd_, this.radius);
      });
      this.isPosDirty_ = false;
    }

    vec3.copy(o, this.pos_);
  }

  up(o: vec3) {
    vec3.copy(o, this.worldUp_);
  }

  private fwd_ = vec3.create();
  private isFwdDirty_ = true;
  private fwd(o: vec3) {
    if (this.isFwdDirty_) {
      MathUtils.getSphericalCoordinate(
        this.fwd_, this.worldUp_, this.worldForward_, this.spin, this.tilt,
        this.vec3Allocator, this.quatAllocator);
      this.isFwdDirty_ = false;
    }
    vec3.copy(o, this.fwd_);
  }

  private matView_ = mat4.create();
  private isMatViewDirty_ = true;
  matView(o: mat4) {
    if (this.isMatViewDirty_) {
      this.vec3Allocator.get(3, (pos, la, up) => {
        this.pos(pos);
        this.lookAt(la);
        this.up(up);
        mat4.lookAt(this.matView_, pos, la, up);
      });
      this.isMatViewDirty_ = false;
    }
    mat4.copy(o, this.matView_);
  }

  adjustRadius(distance: number) {
    this.radius = MathUtils.clamp(this.radius + distance, this.minRadius, this.maxRadius);
    this.isPosDirty_ = true;
    this.isMatViewDirty_ = true;
  }

  spinRight(angle: number) {
    this.spin = MathUtils.clampAngle(this.spin + angle);
    this.isFwdDirty_ = true;
    this.isPosDirty_ = true;
    this.isMatViewDirty_ = true;
  }

  tiltUp(angle: number) {
    this.tilt = MathUtils.clamp(this.tilt + angle, -Math.PI * 0.4995, Math.PI * 0.4995);
    this.isFwdDirty_ = true;
    this.isPosDirty_ = true;
    this.isMatViewDirty_ = true;
  }

  moveCenterForwardOnHorizontalPlane(distance: number) {
    this.vec3Allocator.get(3, (fwd, upComponent, planeFwd) => {
      this.fwd(fwd);
      const upAmt = vec3.dot(fwd, this.worldUp_);
      vec3.scale(upComponent, this.worldUp_, upAmt);
      vec3.sub(planeFwd, fwd, upComponent);
      vec3.normalize(planeFwd, planeFwd);

      vec3.scaleAndAdd(this.center_, this.center_, planeFwd, distance);
      this.isMatViewDirty_ = true;
      this.isPosDirty_ = true;
      this.isFwdDirty_ = true; // Maybe not?
    });
  }

  moveCenterRightOnHorizontalPlane(distance: number) {
    this.vec3Allocator.get(4, (fwd, upComponent, planeFwd, planeRight) => {
      this.fwd(fwd);
      const upAmt = vec3.dot(fwd, this.worldUp_);
      vec3.scale(upComponent, this.worldUp_, upAmt);
      vec3.sub(planeFwd, fwd, upComponent);
      vec3.cross(planeRight, planeFwd, this.worldUp_);
      vec3.normalize(planeRight, planeRight);

      vec3.scaleAndAdd(this.center_, this.center_, planeRight, distance);
      this.isMatViewDirty_ = true;
      this.isPosDirty_ = true;
      this.isFwdDirty_ = true; // Maybe not?
    });
  }

  moveCenterUp(distance: number) {
    vec3.scaleAndAdd(this.center_, this.center_, this.worldUp_, distance);
    this.isMatViewDirty_ = true;
    this.isPosDirty_ = true;
    this.isFwdDirty_ = true; // Maybe not?
  }
}
