import { vec3 } from "gl-matrix";
import { TempGroupAllocator } from "./allocator";

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
}
