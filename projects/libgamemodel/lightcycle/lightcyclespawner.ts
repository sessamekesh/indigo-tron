import { ECSManager } from "@libecs/ecsmanager";
import { vec3 } from "gl-matrix";
import { SceneNodeFactoryComponent } from "@libgamemodel/components/commoncomponents";
import { BACK_WHEEL_OFFSET } from "./lightcyclespawner.system";
import { LightcycleComponent2 } from "./lightcycle.component";
import { VelocityComponent } from "@libgamemodel/components/velocitycomponent";

type LightcycleInitialSpawnConfig = {
  Position: vec3,
  Orientation: number,
}

export class LightcycleSpawner {
  static spawnLightcycle(ecs: ECSManager, config: LightcycleInitialSpawnConfig) {
    const entity = ecs.createEntity();
    const {SceneNodeFactory} = ecs.getSingletonComponentOrThrow(SceneNodeFactoryComponent);

    const pos = vec3.create();
    vec3.copy(pos, config.Position);

    const bodySceneNode = SceneNodeFactory.createSceneNode({
      rot: {
        axis: vec3.fromValues(0, 1, 0),
        angle: config.Orientation,
      },
      pos,
    });

    const frontWheelSceneNode = SceneNodeFactory.createSceneNode({
      rot: {
        axis: vec3.fromValues(0, 1, 0),
        angle: config.Orientation,
      },
      pos,
    });

    const backWheelSceneNode = SceneNodeFactory.createSceneNode({
      pos: vec3.fromValues(0, 0, -BACK_WHEEL_OFFSET),
    });
    backWheelSceneNode.attachToParent(bodySceneNode);

    entity.addComponent(
      LightcycleComponent2, frontWheelSceneNode, backWheelSceneNode, bodySceneNode, 100);
    entity.addComponent(VelocityComponent, 38.5);

    return entity;
  }
}
