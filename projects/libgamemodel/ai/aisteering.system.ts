import { ECSSystem } from "@libecs/ecssystem";
import { ECSManager } from "@libecs/ecsmanager";
import { LightcycleComponent2 } from "@libgamemodel/lightcycle/lightcycle.component";
import { AiControlComponent } from "./aicontrol.component";
import { MathUtils } from "@libutil/mathutils";
import { SceneModeUtil } from "@libgamemodel/scenemode/scenemodeutil";

export class AiSteeringSystem extends ECSSystem {
  start() { return true; }

  update(ecs: ECSManager, msDt: number) {
    const dt = msDt / 1000;

    if (!SceneModeUtil.isPlaying(ecs)) return;

    ecs.iterateComponents(
      [LightcycleComponent2, AiControlComponent],
      (entity, lightcycle, control) => {
        const currentAngle = lightcycle.FrontWheelSceneNode.getRotAngle();
        const newAngle = MathUtils.getAngleTowardsGoal(
          currentAngle,
          control.GoalOrientation,
          dt * control.AngularVelocity);
        if (currentAngle !== newAngle) {
          lightcycle.FrontWheelSceneNode.update({rot: {angle: newAngle}});
        }
      });
  }
}
