import { ECSManager } from '@libecs/ecsmanager';
import { ECSSystem } from '@libecs/ecssystem';
import { Entity } from '@libecs/entity';
import { FloorComponent } from '@libgamemodel/components/floor.component';

export class EnvironmentSystem extends ECSSystem {
  start(ecs: ECSManager) {
    return true;
  }

  update(ecs: ECSManager, msDt: number) {}

  spawnFloor(ecs: ECSManager, width: number, height: number): Entity {
    const e = ecs.createEntity();

    e.addComponent(FloorComponent, width, height);

    return e;
  }
}
