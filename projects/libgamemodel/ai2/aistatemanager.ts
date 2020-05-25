import { AIState, AIStateKlass } from "./aistate";
import { ECSManager } from "@libecs/ecsmanager";
import { Entity } from "@libecs/entity";

const MAX_ITERATIONS = 100;

export class AIStateManager {
  private state: AIState;

  constructor(private installedStates: Map<AIStateKlass, AIState>, initialState: AIState) {
    this.state = initialState;
  }

  tick(ecs: ECSManager, entity: Entity, dt: number) {
    let iterations = 0;
    let nextState = this.installedStates.get(this.state.transition(ecs, entity, dt));
    while (nextState && nextState !== this.state) {
      this.state.onExitState(ecs, entity);
      nextState.onBeginState(ecs, entity);
      this.state = nextState;
      nextState = this.installedStates.get(this.state.transition(ecs, entity, dt));
      iterations++;

      if (iterations >= MAX_ITERATIONS) {
        throw new Error('Infinite loop detected in AIStateManager');
      }
    }

    this.state.execute(ecs, entity, dt);
  }
}
