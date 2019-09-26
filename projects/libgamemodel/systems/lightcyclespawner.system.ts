import { ECSSystem } from '@libecs/ecssystem';
import { vec3 } from 'gl-matrix';
import { ECSManager } from '@libecs/ecsmanager';
import { LightcycleComponent } from '@libgamemodel/components/lightcycle.component';
import { PositionComponent } from '@libgamemodel/components/position.component';
import { SceneNodeFactory } from '@libutil/scene/scenenodefactory';

type LightcycleInitialSpawnConfig = {
  Position: vec3,
  Orientation: number,
};

export type LightcycleSpawnerInitialState = {
  Lightcycles: LightcycleInitialSpawnConfig[],
};

export class LightcycleSpawnerSystem extends ECSSystem {
  constructor(
      private readonly initialState: LightcycleSpawnerInitialState,
      private readonly sceneNodeFactory: SceneNodeFactory) {
    super();
  }

  start(ecs: ECSManager): boolean {
    for (let i = 0; i < this.initialState.Lightcycles.length; i++) {
      const config = this.initialState.Lightcycles[i];
      const entity = ecs.createEntity();

      const pos = vec3.create();
      vec3.copy(pos, config.Position);
      entity.addComponent(PositionComponent, pos);

      entity.addComponent(LightcycleComponent, config.Orientation, this.sceneNodeFactory.createSceneNode({
        rot: {
          axis: vec3.fromValues(0, 1, 0),
          angle: config.Orientation,
        },
        pos,
      }));
    }
    return true;
  }

  update(ecs: ECSManager, msDt: number) {}
}
