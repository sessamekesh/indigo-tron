import { ECSSystem } from "@libecs/ecssystem";
import { ECSManager } from "@libecs/ecsmanager";
import { LightcycleComponent2 } from "./lightcycle.component";
import { MathUtils } from "@libutil/mathutils";
import { VelocityComponent } from "@libgamemodel/components/velocitycomponent";
import { MovementUtils } from "@libgamemodel/utilities/movementutils";
import { MathAllocatorsComponent, PauseStateComponent } from "@libgamemodel/components/commoncomponents";
import { BACK_WHEEL_OFFSET } from "./lightcyclespawner.system";

export class LightcycleUpdateRandomFnComponent {
  constructor(public Fn: ()=>number) {}
}

export class LightcycleUpdateSystem2 extends ECSSystem {
  start(ecs: ECSManager) {
    return true;
  }

  update(ecs: ECSManager, msDt: number) {
    const dt = msDt / 1000;
    const {
      Vec3: vec3Allocator,
    } = ecs.getSingletonComponentOrThrow(MathAllocatorsComponent);

    // No-op if the game is paused
    const isPaused = ecs.getSingletonComponent(PauseStateComponent);
    if (isPaused && isPaused.IsPaused) return;

    // Update the position of all lightcycles
    ecs.iterateComponents(
        [LightcycleComponent2, VelocityComponent],
        (entity, lightcycle, velocity) => {
      const movementAmt = velocity.Velocity * dt;
      MovementUtils.moveForwardBasedOnOrientation(
        lightcycle.FrontWheelSceneNode, movementAmt, vec3Allocator);
      MovementUtils.moveForwardBasedOnOrientation(
        lightcycle.BodySceneNode, movementAmt, vec3Allocator);

      vec3Allocator.get(3, (frontWheelPos, rearWheelPos, newRearPos) => {
        lightcycle.FrontWheelSceneNode.getPos(frontWheelPos);
        lightcycle.RearWheelSceneNode.getPos(rearWheelPos);
        MathUtils.nudgeToDistance(
          newRearPos, frontWheelPos, rearWheelPos,
          BACK_WHEEL_OFFSET, vec3Allocator);

        const newBodyOrientation = MovementUtils.findOrientationBetweenPoints(
          frontWheelPos, newRearPos);
        lightcycle.BodySceneNode.update({
          pos: frontWheelPos,
          rot: {
            angle: MathUtils.clampAngle(newBodyOrientation),
          },
        });
      });
    });
  }
}
