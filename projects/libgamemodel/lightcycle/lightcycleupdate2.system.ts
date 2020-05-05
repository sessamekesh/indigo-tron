import { ECSSystem } from "@libecs/ecssystem";
import { ECSManager } from "@libecs/ecsmanager";
import { LightcycleComponent2 } from "./lightcycle.component";
import { MathUtils } from "@libutil/mathutils";
import { MovementUtils } from "@libgamemodel/utilities/movementutils";
import { MathAllocatorsComponent, PauseStateComponent } from "@libgamemodel/components/commoncomponents";
import { LightcycleSteeringStateComponent } from "./lightcyclesteeringstate.component";

export class LightcycleUpdateRandomFnComponent {
  constructor(public Fn: ()=>number) {}
}

export class LightcycleUpdateSystem2 extends ECSSystem {
  start(ecs: ECSManager) {
    return true;
  }

  // TODO (sessamekesh): Move this to using the regular physics. Slow frames are really screwing with
  //  the ability of the update system to keep up!
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
        [LightcycleComponent2, LightcycleSteeringStateComponent],
        (entity, lightcycle, steeringState) => {
      // Steering state
      const turnAmount = steeringState.SteeringStrength * lightcycle.AngularVelocity * dt;
      const newOrientation =
        MathUtils.clampAngle(lightcycle.FrontWheelSceneNode.getRotAngle() + turnAmount);
      lightcycle.FrontWheelSceneNode.update({ rot: { angle: newOrientation }});

      // Actual position
      const movementAmt = lightcycle.Velocity * dt;
      MovementUtils.moveForwardBasedOnOrientation(
        lightcycle.FrontWheelSceneNode, movementAmt, vec3Allocator);
      MovementUtils.moveForwardBasedOnOrientation(
        lightcycle.BodySceneNode, movementAmt, vec3Allocator);

      vec3Allocator.get(3, (frontWheelPos, rearWheelPos, newRearPos) => {
        lightcycle.FrontWheelSceneNode.getPos(frontWheelPos);
        lightcycle.RearWheelSceneNode.getPos(rearWheelPos);
        const BACK_WHEEL_OFFSET = 3.385;
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
