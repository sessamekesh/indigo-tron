import { ECSSystem } from "@libecs/ecssystem";
import { ECSManager } from "@libecs/ecsmanager";
import { CameraRigComponent } from "./camerarig.component";
import { MathAllocatorsComponent } from "@libgamemodel/components/commoncomponents";
import { vec3 } from "gl-matrix";
import { MathUtils } from "@libutil/mathutils";
import { SceneModeUtil } from "@libgamemodel/scenemode/scenemodeutil";

export class CameraRigSystemConfigurationComponent {
  constructor(
    public CloseRatio: number,
    public MinSpeed: number,
    public MaxSpeed: number) {}
}

/**
 * TODO (sessamekesh): Adjust the camera rig system to follow this logic:
 *
 * - Camera goal focal point: In front of the targeted bike by some distance
 * - Camera goal position: Behind and above the focal point by some distance
 * - Camera actual focal point and positions: May be same as goal
 * - Focal point / position spring force: Force, scaled to distance, that draws camera
 *   focal point and position (actual) values towards the goal locations.
 * - Wall avoidance radius: Focal point / position _cannot_ be within distance of arena edge
 * - Wall resistance radius: Spring force that repels the focal point / position from wall. Hard
 *   constraint at the avoidance radius, no impact further than the resistance radius.
 * - Each frame:
 *   (1) Calculate the updated goal position of the focal point and camera position based on bike.
 *       This can be done just by attaching the focal point / position as child scene nodes to bike.
 *   (2) Calculate the force from all sources on the actual camera locations.
 *   (3) Apply the force to update the velocity.
 *   (4) Find any constraints and update the velocity and position accordingly (i.e., avoid walls)
 *   (5) Apply the velocity to update the position
 */

export class CameraRigSystem2 extends ECSSystem {
  start(ecs: ECSManager): boolean {
    return true;
  }

  update(ecs: ECSManager, msDt: number) {
    if (SceneModeUtil.isPaused(ecs)) return;

    const {
      Vec3: vec3Allocator,
    } = ecs.getSingletonComponentOrThrow(MathAllocatorsComponent);
    const {
      CloseRatio: closeRatio,
      MaxSpeed: maxSpeed,
      MinSpeed: minSpeed,
    } = ecs.getSingletonComponentOrThrow(CameraRigSystemConfigurationComponent);
    ecs.iterateComponents([CameraRigComponent], (entity, rigComponent) => {
      vec3Allocator.get(5, (cameraPos, targetPos, targetLookAt, dPos, newPos) => {
        rigComponent.Camera.pos(cameraPos);
        rigComponent.PositionSceneNode.getPos(targetPos);
        rigComponent.LookAtSceneNode.getPos(targetLookAt);
        vec3.sub(dPos, targetPos, cameraPos);
        const posDistance = vec3.len(dPos);
        const targetPosAdjust = posDistance * closeRatio;
        const posAdjust = MathUtils.clamp(targetPosAdjust, minSpeed, maxSpeed) * (msDt / 1000);
        vec3.scaleAndAdd(newPos, cameraPos, dPos, MathUtils.clamp(posAdjust / posDistance, -1, 1));

        rigComponent.Camera.setPos(newPos);
        rigComponent.Camera.setLookAt(targetLookAt);
      });
    });
  }
}
