import { SceneNode } from "@libutil/scene/scenenode";
import { TempGroupAllocator } from "@libutil/allocator";
import { vec3 } from "gl-matrix";

export class MovementUtils {
  static moveForwardBasedOnOrientation(
      sceneNode: SceneNode, distanceTravelled: number, vec3Allocator: TempGroupAllocator<vec3>) {
    const orientation = sceneNode.getRotAngle();
    vec3Allocator.get(3, (pos, dir, newPos) => {
      sceneNode.getPos(pos);
      vec3.set(
        dir,
        Math.sin(orientation),
        0,
        Math.cos(orientation));
      vec3.scaleAndAdd(newPos, pos, dir, distanceTravelled);
      sceneNode.update({pos: newPos, rot: {angle: orientation}});
    });
  }

  static findOrientationBetweenPoints(a: vec3, b: vec3) {
    const x = b[0] - a[0];
    const z = b[2] - a[2];
    return Math.atan2(x, z);
  }
}
