import { TempGroupAllocator } from "@libutil/allocator";
import { vec3 } from "gl-matrix";
import { SceneNode2 } from '@libscenegraph/scenenode2';
import { Mat4TransformAddon } from '@libscenegraph/scenenodeaddons/mat4transformaddon';

export class MovementUtils {
  static moveForwardBasedOnOrientation(
      sceneNode: SceneNode2, distanceTravelled: number, vec3Allocator: TempGroupAllocator<vec3>) {
    const mat4Addon = sceneNode.getAddon(Mat4TransformAddon);
    const orientation = mat4Addon.getSelfRotAngle();
    vec3Allocator.get(3, (pos, dir, newPos) => {
      mat4Addon.getPos(pos);
      vec3.set(
        dir,
        Math.sin(orientation),
        0,
        Math.cos(orientation));
      vec3.scaleAndAdd(newPos, pos, dir, distanceTravelled);
      mat4Addon.update({pos: newPos, rot: {angle: orientation}});
    });
  }

  static findOrientationBetweenPoints(a: vec3, b: vec3) {
    const x = b[0] - a[0];
    const z = b[2] - a[2];
    return Math.atan2(x, z);
  }
}
