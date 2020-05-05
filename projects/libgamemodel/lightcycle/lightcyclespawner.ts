import { ECSManager } from "@libecs/ecsmanager";
import { vec3, vec2 } from "gl-matrix";
import { SceneNodeFactoryComponent } from "@libgamemodel/components/commoncomponents";
import { LightcycleComponent2 } from "./lightcycle.component";
import { WallGeneratorComponent } from "@libgamemodel/wall/wallgenerator.component";
import { Entity } from "@libecs/entity";
import { LightcycleSteeringStateComponent } from "./lightcyclesteeringstate.component";

type LightcycleInitialSpawnConfig = {
  Position: vec3,
  Orientation: number,
  AngularVelocity: number,
  Velocity: number,
}

export class LightcycleSpawner {
  static attachLightcycle(ecs: ECSManager, entity: Entity, config: LightcycleInitialSpawnConfig) {
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

    const BACK_WHEEL_OFFSET = 3.385;
    const backWheelSceneNode = SceneNodeFactory.createSceneNode({
      pos: vec3.fromValues(0, 0, -BACK_WHEEL_OFFSET),
    });
    backWheelSceneNode.attachToParent(bodySceneNode);

    entity.addComponent(
      LightcycleComponent2,
      frontWheelSceneNode,
      backWheelSceneNode,
      bodySceneNode,
      /* vitality */ 100,
      /* velocity */ config.Velocity,
      /* angular velocity */ config.AngularVelocity);
    entity.addComponent(LightcycleSteeringStateComponent, 0);

    // TODO (sessamekesh): Use temp allocator instead (not urgent, this is infrequently used)
    const backWheelPos = vec3.create();
    backWheelSceneNode.getPos(backWheelPos);
    entity.addComponent(
      WallGeneratorComponent, backWheelSceneNode, 10, 1,
      vec2.fromValues(backWheelPos[0], backWheelPos[2]));

    return entity;
  }

  static spawnLightcycle(ecs: ECSManager, config: LightcycleInitialSpawnConfig) {
    const entity = ecs.createEntity();
    LightcycleSpawner.attachLightcycle(ecs, entity, config);
    return entity;
  }
}
