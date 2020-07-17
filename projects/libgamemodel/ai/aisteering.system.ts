  import { ECSSystem } from "@libecs/ecssystem";
import { ECSManager } from "@libecs/ecsmanager";
import { LightcycleComponent2 } from "@libgamemodel/lightcycle/lightcycle.component";
import { AiControlComponent } from "./aicontrol.component";
import { MathUtils } from "@libutil/mathutils";
import { SceneModeUtil } from "@libgamemodel/scenemode/scenemodeutil";
import { Mat4TransformAddon } from "@libgamemodel/../libscenegraph/scenenodeaddons/mat4transformaddon";
import { LightcycleSteeringStateComponent } from "@libgamemodel/lightcycle3/lightcyclesteeringstate.component";
import { MovementUtils } from "@libgamemodel/utilities/movementutils";
import { LightcycleComponent3 } from "@libgamemodel/lightcycle3/lightcycle3.component";
import { LightcycleDrivingStatsComponent } from "@libgamemodel/lightcycle3/lightcycledrivingstats.component";

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

    ecs.iterateComponents2(
        {}, {
          steering: LightcycleSteeringStateComponent,
          ai: AiControlComponent,
          lightcycle: LightcycleComponent3,
          driveStats: LightcycleDrivingStatsComponent,
        }, (e, s, c) => {
      const currentAngle = MovementUtils.findOrientationBetweenPoints2(
        c.lightcycle.RearWheelPosition.Value, c.lightcycle.FrontWheelPosition.Value);
      const newAngle = MathUtils.getAngleTowardsGoal(
        currentAngle,
        c.ai.GoalOrientation,
        dt * c.driveStats.MaxSteeringAngularVelocity);
      if (currentAngle !== newAngle) {
        c.lightcycle.FrontWheelRotation = newAngle;
      }
    });
  }
}
