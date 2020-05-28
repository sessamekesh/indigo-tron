import { AIState, AIStateKlass } from "./aistate";
import { ECSManager } from "@libecs/ecsmanager";
import { Entity } from "@libecs/entity";

const MAX_ITERATIONS = 100;

export type AIStateManagerMap = Map<AIStateKlass, AIState>;

export class AIStateManager {
  private state: AIState;

  constructor(private installedStates: Map<AIStateKlass, AIState>, initialState: AIState) {
    this.state = initialState;
  }

  tick(ecs: ECSManager, entity: Entity, dt: number) {
    let iterations = 0;
    let nextStateKey = this.state.transition(ecs, entity, dt);
    let nextState = nextStateKey && this.installedStates.get(nextStateKey);
    while (nextState && nextState !== this.state) {
      this.state.onExitState(ecs, entity);
      nextState.onBeginState(ecs, entity);
      this.state = nextState;
      nextStateKey = this.state.transition(ecs, entity, dt);
      if (!nextStateKey) break;
      nextState = this.installedStates.get(nextStateKey);
      iterations++;

      if (iterations >= MAX_ITERATIONS) {
        throw new Error('Infinite loop detected in AIStateManager');
      }
    }

    this.state.execute(ecs, entity, dt);
  }
}
