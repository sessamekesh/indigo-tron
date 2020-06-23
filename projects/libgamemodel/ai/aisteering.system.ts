  import { ECSSystem } from "@libecs/ecssystem";
import { ECSManager } from "@libecs/ecsmanager";
import { LightcycleComponent2 } from "@libgamemodel/lightcycle/lightcycle.component";
import { AiControlComponent } from "./aicontrol.component";
import { MathUtils } from "@libutil/mathutils";
import { SceneModeUtil } from "@libgamemodel/scenemode/scenemodeutil";
import { Mat4TransformAddon } from "@libgamemodel/../libscenegraph/scenenodeaddons/mat4transformaddon";

export class AiSteeringSystem extends ECSSystem {
  start() { return true; }

  update(ecs: ECSManager, msDt: number) {
    if (SceneModeUtil.isPaused(ecs)) {
      return;
    }

    const dt = msDt / 1000;

    ecs.iterateComponents(
      [LightcycleComponent2, AiControlComponent],
      (entity, lightcycle, control) => {
        const currentAngle =
          lightcycle.FrontWheelSceneNode.getAddon(Mat4TransformAddon).getSelfRotAngle();
        const newAngle = MathUtils.getAngleTowardsGoal(
          currentAngle,
          control.GoalOrientation,
          dt * control.AngularVelocity);
        if (currentAngle !== newAngle) {
          lightcycle.FrontWheelSceneNode.getAddon(Mat4TransformAddon).update({
            rot: {angle: newAngle}
          });
        }
      });
  }
}
