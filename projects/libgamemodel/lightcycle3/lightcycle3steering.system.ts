import { ECSSystem } from "@libecs/ecssystem";
import { BikeInputManagerComponent } from "@libgamemodel/components/gameappuicomponents";
import { LightcycleSteeringStateComponent } from "./lightcyclesteeringstate.component";
import { ECSManager } from "@libecs/ecsmanager";
import { SceneModeUtil } from "@libgamemodel/scenemode/scenemodeutil";
import { MainPlayerComponent } from "@libgamemodel/components/commoncomponents";

const SINGLETON_QUERY = {inputManager: BikeInputManagerComponent};
const COMPONENT_QUERY = {
  mainPlayer: MainPlayerComponent,
  steering: LightcycleSteeringStateComponent,
};

export class Lightcycle3SteeringSystem extends ECSSystem {
  start(ecs: ECSManager) {
    return this.expectSingletons(ecs, SINGLETON_QUERY, 'Lightcycle3SteeringSystem');
  }

  update(ecs: ECSManager) {
    if (SceneModeUtil.isPaused(ecs)) return;

    ecs.iterateComponents2(SINGLETON_QUERY, COMPONENT_QUERY, (e, s, c) => {
      c.steering.SteeringStrength = -s.inputManager.BikeInputManager.turnDirection();
    });
  }
}
