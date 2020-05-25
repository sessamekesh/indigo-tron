import { ECSManager } from "@libecs/ecsmanager";
import { Entity } from "@libecs/entity";

export type AIStateKlass = new () => AIState;

export abstract class AIState {
  // Decide if a transition from the given state is required - returns the state that should execute
  // in the next frame. This may be a reference to the state object itself.
  abstract transition(ecs: ECSManager, entity: Entity, dt: number): AIStateKlass;
  // Execute the strategy for this state over this frame
  abstract execute(ecs: ECSManager, entity: Entity, dt: number): void;

  // Optional handlers for transitioning into and out of a state
  onBeginState(ecs: ECSManager, entity: Entity) {}
  onExitState(ecs: ECSManager, entity: Entity) {}
}
