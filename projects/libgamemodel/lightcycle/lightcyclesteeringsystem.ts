import { ECSSystem } from "@libecs/ecssystem";
import { Entity } from "@libecs/entity";
import { ECSManager } from "@libecs/ecsmanager";
import { LightcycleComponent2 } from "./lightcycle.component";
import { BikeInputManagerComponent } from "@libgamemodel/components/gameappuicomponents";
import { SceneModeUtil } from "@libgamemodel/scenemode/scenemodeutil";
import { MainPlayerComponent } from "@libgamemodel/components/commoncomponents";
import { LightcycleSteeringStateComponent } from "./lightcyclesteeringstate.component";

export class LightcycleSteeringSystem extends ECSSystem {
  static setMainPlayer(ecs: ECSManager, newMainPlayer: Entity) {
    ecs.iterateComponents([MainPlayerComponent], (entity) => {
      entity.removeComponent(MainPlayerComponent);
    });
    newMainPlayer.addComponent(MainPlayerComponent);
  }

  start() { return true; }

  update(ecs: ECSManager, msDt: number) {
    if (SceneModeUtil.isPaused(ecs)) {
      return;
    }

    const dt = msDt / 1000;
    const {
      BikeInputManager: bikeInputManager
    } = ecs.getSingletonComponentOrThrow(BikeInputManagerComponent);

    if (!SceneModeUtil.isPlaying(ecs)) return;

    // Update main player based on game input
    ecs.iterateComponents(
        [MainPlayerComponent, LightcycleComponent2, LightcycleSteeringStateComponent],
        (entity, _, __, steeringState) => {
      steeringState.SteeringStrength = -bikeInputManager.turnDirection();
    });
  }
}
