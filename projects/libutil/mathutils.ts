import { vec3, quat } from "gl-matrix";
import { TempGroupAllocator } from "./allocator";

export type RandomNumberFn = ()=>number;

export class MathUtils {
  static clamp(input: number, min: number, max: number) {
    return Math.min(max, Math.max(min, input));
  }

  static clampAngle(input: number) {
    while (input >= Math.PI * 2) {
      input -= Math.PI * 2;
    }
    while (input < 0) {
      input += Math.PI * 2;
    }
    return input;
  }

  /**
   * Nudge an input vector to be a specific distance away from an origin vector without
   *  adjusting the offset vector between them.
   * If the input and origin positions are the same, just return that same vector.
   * @param o Output vector - position to adjust the object in question to be at
   * @param originPos Immutable origin point in the world
   * @param inputPos Position of an object in question that needs nudging
   * @param distance The desired distance between the origin and output vectors
   */
  static nudgeToDistance(
      o: vec3, originPos: vec3, inputPos: vec3, distance: number,
      vec3Allocator: TempGroupAllocator<vec3>) {
    vec3Allocator.get(2, (offset, newOffset) => {
      vec3.sub(offset, originPos, inputPos);
      const len = vec3.length(offset);
      if (len === 0) {
        vec3.copy(o, originPos);
        return;
      }

      vec3.scale(newOffset, offset, distance / len);
      vec3.add(o, originPos, newOffset);
    });
  }

  static getSphericalCoordinate(
      o: vec3, upVector: vec3, forwardVector: vec3, spin: number, tilt: number,
      vec3Allocator: TempGroupAllocator<vec3>, quatAllocator: TempGroupAllocator<quat>) {
    vec3Allocator.get(2, (yRot, rightRot) => {
      quatAllocator.get(2, (yQuat, xzQuat) => {
        quat.setAxisAngle(yQuat, upVector, spin);
        vec3.transformQuat(yRot, forwardVector, yQuat);
        vec3.cross(rightRot, yRot, upVector);
        quat.setAxisAngle(xzQuat, rightRot, tilt);
        vec3.transformQuat(o, yRot, xzQuat);
        vec3.normalize(o, o);
      });
    });
  }
}
