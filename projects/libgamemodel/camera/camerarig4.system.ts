import { ECSSystem } from "@libecs/ecssystem";
import { ECSManager } from "@libecs/ecsmanager";
import { LightcycleUtils } from "@libgamemodel/lightcycle/lightcycleutils";
import { MathAllocatorsComponent } from "@libgamemodel/components/commoncomponents";
import { SceneModeUtil } from "@libgamemodel/scenemode/scenemodeutil";
import { CameraRig4Component } from "./camerarig4.component";
import { LightcycleComponent2 } from "@libgamemodel/lightcycle/lightcycle.component";
import { LightcycleSteeringStateComponent } from "@libgamemodel/lightcycle/lightcyclesteeringstate.component";
import { PositionComponent } from "@libgamemodel/physics/position.component";
import { vec3 } from "gl-matrix";
import { Y_UNIT_DIR } from "@libutil/helpfulconstants";
import { CameraRig4Util } from "./camerarig4.util";

export class CameraRig4System extends ECSSystem {
  start() { return true; }

  update(ecs: ECSManager, msDt: number) {
    if (SceneModeUtil.isPaused(ecs)) return;

    const { Vec3, Circle3 } = ecs.getSingletonComponentOrThrow(MathAllocatorsComponent);

    ecs.iterateComponents([CameraRig4Component], (entity, cameraRig) => {
      // Step one: Update the camera based on what the physics system has returned
      const pos = cameraRig.PositionEntity.getComponent(PositionComponent);
      const lookAt = cameraRig.LookAtEntity.getComponent(PositionComponent);
      const lightcycle = cameraRig.FollowedEntity.getComponent(LightcycleComponent2);
      const steering = cameraRig.FollowedEntity.getComponent(LightcycleSteeringStateComponent);

      if (!pos || !lookAt || !lightcycle || !steering) {
        // TODO (sessamekesh): Track unexpected state
        return;
      }

      cameraRig.Camera.setPos(pos.Position.Value);
      cameraRig.Camera.setLookAt(lookAt.Position.Value);

      // Step two: Update the physics scene nodes based on the attached thing
      Vec3.get(2, (pos, la) => {
        CameraRig4Util.findPosLookAtForLightcycle(
          pos, la,
          lightcycle, steering,
          cameraRig.LookAtLightcycleDistance,
          cameraRig.CameraPositionFollowDistance,
          cameraRig.LookAtScale,
          cameraRig.FollowScale,
          cameraRig.CameraHeight,
          Vec3, Circle3);
        cameraRig.GoalPosition.update({ pos: pos });
        cameraRig.GoalLookAt.update({ pos: la });
      });
    });
  }
}
