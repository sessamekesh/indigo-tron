import { ECSSystem } from '@libecs/ecssystem';
import { vec3 } from 'gl-matrix';
import { ECSManager } from '@libecs/ecsmanager';
import { LightcycleComponent } from '@libgamemodel/components/lightcycle.component';
import { PositionComponent } from '@libgamemodel/components/position.component';

type LightcycleInitialSpawnConfig = {
  Position: vec3,
  Orientation: number,
};

export type LightcycleSpawnerInitialState = {
  Lightcycles: LightcycleInitialSpawnConfig[],
};

export class LightcycleSpawnerSystem extends ECSSystem {
  constructor(private readonly initialState: LightcycleSpawnerInitialState) {
    super();
  }

  start(ecs: ECSManager): boolean {
    for (let i = 0; i < this.initialState.Lightcycles.length; i++) {
      const config = this.initialState.Lightcycles[i];
      const entity = ecs.createEntity();
      entity.addComponent(LightcycleComponent, config.Orientation);
      const pos = vec3.create();
      vec3.copy(pos, config.Position);
      entity.addComponent(PositionComponent, pos);
    }
    return true;
  }

  update(ecs: ECSManager, msDt: number) {}
}
