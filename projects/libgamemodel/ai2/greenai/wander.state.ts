import { AIState } from "../aistate";
import { ECSManager } from "@libecs/ecsmanager";
import { Entity } from "@libecs/entity";
import { GreenAiBlackboardComponent, GreenAiBlackboard } from "./greenai.blackboard.component";
import { OwnedResource } from "@libutil/allocator";
import { vec2 } from "gl-matrix";
import { OwnedMathAllocatorsComponent, MathAllocatorsComponent } from "@libgamemodel/components/commoncomponents";
import { GreenAiComponent2 } from "./greenai2.component";
import { AiControlComponent } from "@libgamemodel/ai/aicontrol.component";
import { MathUtils } from "@libutil/mathutils";
import { LightcycleComponent3 } from "@libgamemodel/lightcycle3/lightcycle3.component";

export class WanderState extends AIState {
  transition(ecs: ECSManager, entity: Entity, dt: number) {
    return null;
  }

  execute(ecs: ECSManager, entity: Entity, dt: number) {
    const Vec2 = ecs.getSingletonComponentOrThrow(MathAllocatorsComponent).Vec2;
    const location = this.getWanderLocation(ecs, entity);
    const ai = entity.getComponent(GreenAiComponent2);
    const control = entity.getComponent(AiControlComponent);
    const lightcycleComponent = entity.getComponent(LightcycleComponent3);
    if (!ai || !control || !lightcycleComponent)
      throw new Error('Failed to execute action, AI not defined');
    const blackboard = GreenAiBlackboardComponent.get(entity).Blackboard;

    // If we are currently close to the goal location, find a new one, but don't use another
    // close by point.
    let isNearGoal = false;
    do {
      isNearGoal =
        vec2.sqrDist(
          location.Value,
          lightcycleComponent.FrontWheelPosition.Value) <= (ai.WanderGoalTolerance ** 2);

      if (isNearGoal) {
        this.generateNewWanderLocation(location, blackboard, ai.WallGenRandFn);
      }
    } while (isNearGoal);

    // Once goal location has been decided, find the angle required to get from self to there, and
    // steer towards that goal.
    Vec2.get(1, (currentPos) => {
      vec2.copy(currentPos, lightcycleComponent.FrontWheelPosition.Value);

      const toGoalX = location.Value[0] - currentPos[0];
      const toGoalZ = location.Value[1] - currentPos[1];
      control.GoalOrientation = MathUtils.clampAngle(Math.atan2(toGoalX, toGoalZ));
    });
  }

  private getWanderLocation(ecs: ECSManager, entity: Entity): OwnedResource<vec2> {
    const blackboard = GreenAiBlackboardComponent.get(entity).Blackboard;

    const ai = entity.getComponent(GreenAiComponent2);
    if (!ai) throw new Error('Failed to get location, AI not defined');

    let location = blackboard.get('WanderGoal');
    if (!location) {
      const { Vec2 } = ecs.getSingletonComponentOrThrow(OwnedMathAllocatorsComponent);
      location = Vec2.get();
      this.generateNewWanderLocation(location, blackboard, ai?.WallGenRandFn);
      blackboard.set('WanderGoal', location);
      entity.addListener('destroy', () => location?.ReleaseFn());
    }

    return location;
  }

  private generateNewWanderLocation(
      location: OwnedResource<vec2>, blackboard: GreenAiBlackboard, randFn: ()=>number) {
    const x = randFn();
    const z = randFn();

    const bounds = blackboard.forceGet('WanderBounds');
    const w = bounds.maxX - bounds.minX;
    const d = bounds.maxZ - bounds.minZ;

    vec2.set(location.Value, x * w + bounds.minX, z * d + bounds.minZ);
  }
}
