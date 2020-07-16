import { ECSSystem } from "@libecs/ecssystem";
import { ECSManager } from "@libecs/ecsmanager";
import { LightcycleComponent3 } from "./lightcycle3.component";
import { LightcycleSteeringStateComponent } from "./lightcyclesteeringstate.component";
import { LightcycleDrivingStatsComponent } from "./lightcycledrivingstats.component";
import { MathUtils } from "@libutil/mathutils";
import { MovementUtils } from "@libgamemodel/utilities/movementutils";
import { BACK_WHEEL_OFFSET } from "./lightcycle3spawner.util";
import { MathAllocatorsComponent } from "@libgamemodel/components/commoncomponents";
import { SceneModeUtil } from "@libgamemodel/scenemode/scenemodeutil";

const SINGLETON_QUERY = {
  tempAllocators: MathAllocatorsComponent,
};
const COMPONENT_QUERY = {
  lightcycle: LightcycleComponent3,
  steering: LightcycleSteeringStateComponent,
  drivingStats: LightcycleDrivingStatsComponent,
};

export class LightcycleDrivingSystem3 extends ECSSystem {
  start(ecs: ECSManager) {
    return this.expectSingletons(ecs, SINGLETON_QUERY, 'LightcycleDrivingSystem3');
  }

  update(ecs: ECSManager, msDt: number) {
    if (SceneModeUtil.isPaused(ecs)) return;

    const dt = msDt / 1000;
    ecs.iterateComponents2(SINGLETON_QUERY, COMPONENT_QUERY, (e, s, c) => {
      // Steering state
      const turnAmount =
        c.steering.SteeringStrength * c.drivingStats.MaxSteeringAngularVelocity * dt;
      const frontWheelOrientation = c.lightcycle.FrontWheelRotation;

      c.lightcycle.FrontWheelRotation = MathUtils.clampAngle(frontWheelOrientation + turnAmount);

      // Update front wheel position
      MovementUtils.moveVec2Forward(
        c.lightcycle.FrontWheelPosition.Value,
        c.drivingStats.Velocity * dt,
        c.lightcycle.FrontWheelRotation);

      // Pull rear wheel towards front wheel to be correct distance away
      MathUtils.nudgeToDistance2(
        c.lightcycle.RearWheelPosition.Value,
        c.lightcycle.FrontWheelPosition.Value,
        c.lightcycle.RearWheelPosition.Value,
        BACK_WHEEL_OFFSET,
        s.tempAllocators.Vec2);
    });
  }
}
