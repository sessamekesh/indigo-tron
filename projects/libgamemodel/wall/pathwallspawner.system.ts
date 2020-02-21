import { ECSSystem } from "@libecs/ecssystem";
import { ECSManager } from "@libecs/ecsmanager";
import { WallSpawningPathComponent } from "./pathwallgenerator.component";
import { WallGeneratorComponent } from "./wallgenerator.component";
import { MathAllocatorsComponent } from "@libgamemodel/components/commoncomponents";
import { vec3, vec2 } from "gl-matrix";
import { SceneNodeFactory } from "@libutil/scene/scenenodefactory";
import { Path2D } from "@libutil/math/path";
import { TempGroupAllocator } from "@libutil/allocator";

export class PathWallSpawnerSystem extends ECSSystem {
  static createPathSpawner(
      ecs: ECSManager,
      sceneNodeFactory: SceneNodeFactory,
      vec3Allocator: TempGroupAllocator<vec3>,
      path: Path2D,
      vitalityAtSpawn: number) {
    const entity = ecs.createEntity();
    entity.addComponent(WallSpawningPathComponent, path, vitalityAtSpawn, 0);
    const pos = vec2.create();
    vec3Allocator.get(1, pos3 => {
      path.posAt(0, pos);
      vec3.set(pos3, pos[0], 0, pos[1]);
      const sceneNode = sceneNodeFactory.createSceneNode({
        pos: pos3,
      });
      entity.addComponent(WallGeneratorComponent, sceneNode, vitalityAtSpawn, 1, pos);
      entity.addListener('destroy', () => sceneNode.detach());
    });
    return entity;
  }

  start() { return true; }
  update(ecs: ECSManager, msDt: number) {
    const {
      Vec2: vec2Allocator,
      Vec3: vec3Allocator,
    } = ecs.getSingletonComponentOrThrow(MathAllocatorsComponent);

    ecs.iterateComponents(
      [WallSpawningPathComponent, WallGeneratorComponent],
      (entity, pathSpawner, wallGenerator) => {
        pathSpawner.t += msDt / 1000;
        if (pathSpawner.t >= pathSpawner.Path.maxTime()) {
          // Restart
          pathSpawner.Path.posAt(0, wallGenerator.LastSpawnPoint);
          pathSpawner.t = 0;
        }
        vec2Allocator.get(1, pos2d => {
          pathSpawner.Path.posAt(pathSpawner.t, pos2d);
          vec3Allocator.get(1, pos3d => {
            vec3.set(pos3d, pos2d[0], 0, pos2d[1]);
            wallGenerator.PositionSceneNode.update({
              pos: pos3d,
            });
          });
        });
      });
  }
}
