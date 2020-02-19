import { ECSSystem } from "@libecs/ecssystem";
import { Entity } from "@libecs/entity";
import { ECSManager } from "@libecs/ecsmanager";
import { LightcycleComponent2 } from "./lightcycle.component";
import { BikeInputManagerComponent } from "@libgamemodel/components/gameappuicomponents";
import { MathUtils } from "@libutil/mathutils";

const LIGHTCYCLE_ANGULAR_VELOCITY = -1.85;

export class MainPlayerComponent {}

export class LightcycleSteeringSystem extends ECSSystem {
  static setMainPlayer(ecs: ECSManager, newMainPlayer: Entity) {
    ecs.iterateComponents([MainPlayerComponent], (entity) => {
      entity.removeComponent(MainPlayerComponent);
    });
    newMainPlayer.addComponent(MainPlayerComponent);
  }

  start() { return true; }

  update(ecs: ECSManager, msDt: number) {
    const dt = msDt / 1000;
    const {
      BikeInputManager: bikeInputManager
    } = ecs.getSingletonComponentOrThrow(BikeInputManagerComponent);
    // Update main player based on game input
    ecs.iterateComponents([MainPlayerComponent, LightcycleComponent2], (entity, _, lightcycle) => {
      const turnAmount = bikeInputManager.turnDirection() * LIGHTCYCLE_ANGULAR_VELOCITY * dt;
      const newOrientation =
        MathUtils.clampAngle(lightcycle.FrontWheelSceneNode.getRotAngle() + turnAmount);
      lightcycle.FrontWheelSceneNode.update({ rot: { angle: newOrientation }});
    });
  }
}
