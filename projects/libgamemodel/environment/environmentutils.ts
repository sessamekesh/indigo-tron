import { ECSManager } from "@libecs/ecsmanager";
import { Entity } from "@libecs/entity";
import { FloorComponent } from "@libgamemodel/components/floor.component";

export class EnvironmentUtils {
  static spawnFloor(ecs: ECSManager, width: number, height: number): Entity {
    const e = ecs.createEntity();
    e.addComponent(FloorComponent, width, height);
    return e;
  }
}
