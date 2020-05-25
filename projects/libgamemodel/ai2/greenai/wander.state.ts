import { AIState } from "../aistate";
import { ECSManager } from "@libecs/ecsmanager";
import { Entity } from "@libecs/entity";
import { GreenAiBlackboardComponent, GreenAiBlackboard } from "./greenai.blackboard.component";
import { OwnedResource } from "@libutil/allocator";
import { vec2 } from "gl-matrix";
import { OwnedMathAllocatorsComponent } from "@libgamemodel/components/commoncomponents";

export class WanderState extends AIState {
  transition(ecs: ECSManager, entity: Entity, dt: number) {
    return WanderState;
  }

  execute(ecs: ECSManager, entity: Entity, dt: number) {

  }

  private getWanderLocation(ecs: ECSManager, entity: Entity): OwnedResource<vec2> {
    const blackboard = GreenAiBlackboardComponent.get(entity).Blackboard;

    let location = blackboard.get('WanderGoal');
    if (!location) {
      let bounds = blackboard.forceGet('WanderBounds');
      const { Vec2 } = ecs.getSingletonComponentOrThrow(OwnedMathAllocatorsComponent);
      location = Vec2.get();
      entity.addListener('destroy', () => location?.ReleaseFn());
    }

    return location;
  }

  private generateNewWanderLocation(blackboard: GreenAiBlackboard) {

  }
}
