import { ECSSystem } from '@libecs/ecssystem';
import { vec3 } from 'gl-matrix';
import { ECSManager } from '@libecs/ecsmanager';
import { LightcycleComponent2 } from '@libgamemodel/components/lightcycle.component';
import { SceneNodeFactory } from '@libutil/scene/scenenodefactory';

type LightcycleInitialSpawnConfig = {
  Position: vec3,
  Orientation: number,
};

export const BACK_WHEEL_OFFSET = 3.385;

export class LightcycleSpawnerSystem extends ECSSystem {
  constructor(private readonly sceneNodeFactory: SceneNodeFactory) {
    super();
  }

  start(ecs: ECSManager): boolean { return true; }

  spawnLightcycle(ecs: ECSManager, config: LightcycleInitialSpawnConfig) {
    const entity = ecs.createEntity();

    const pos = vec3.create();
    vec3.copy(pos, config.Position);

    const bodySceneNode = this.sceneNodeFactory.createSceneNode({
      rot: {
        axis: vec3.fromValues(0, 1, 0),
        angle: config.Orientation,
      },
      pos,
    });

    const frontWheelSceneNode = this.sceneNodeFactory.createSceneNode({
      rot: {
        axis: vec3.fromValues(0, 1, 0),
        angle: config.Orientation,
      },
      pos,
    });

    const backWheelSceneNode = this.sceneNodeFactory.createSceneNode({
      pos: vec3.fromValues(0, 0, -BACK_WHEEL_OFFSET),
    });
    backWheelSceneNode.attachToParent(bodySceneNode);

    entity.addComponent(
      LightcycleComponent2, frontWheelSceneNode, backWheelSceneNode, bodySceneNode);

    return entity;
  }

  update(ecs: ECSManager, msDt: number) {}
}
