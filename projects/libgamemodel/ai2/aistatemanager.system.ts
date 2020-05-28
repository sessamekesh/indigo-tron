import { ECSSystem } from "@libecs/ecssystem";
import { ECSManager } from "@libecs/ecsmanager";
import { AIStateManagerComponent } from "./aistatemanager.component";
import { SceneModeUtil } from "@libgamemodel/scenemode/scenemodeutil";

/**
 * Simple class: This is just a thin wrapper around the state machine that does all the actual work.
 * This could probably be refactored such that the ECSSystem was the one pulling the heavy weight,
 * perhaps designing software at 2:00 AM isn't the wisest choice.
 */
export class AIStateManagerSystem extends ECSSystem {
  start() { return true; }

  update(ecs: ECSManager, msDt: number) {
    const dt = msDt / 1000;

    if (SceneModeUtil.isPaused(ecs) || SceneModeUtil.isGameEnd(ecs)) return;

    ecs.iterateComponents([AIStateManagerComponent], (entity, stateManager) => {
      const stateMachine = stateManager.StateMachine;
      stateMachine.tick(ecs, entity, dt);
    });
  }
}
