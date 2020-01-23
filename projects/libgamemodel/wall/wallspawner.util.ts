import { ECSManager } from "@libecs/ecsmanager";
import { Entity } from "@libecs/entity";
import { vec2 } from "gl-matrix";
import { WallComponent2 } from "./wallcomponent";
import { LifecycleOwnedAllocator } from "@libutil/allocator";

export class WallSpawnerUtil {
  static spawnWall(
      ecs: ECSManager,
      start: vec2,
      end: vec2,
      vitality: number,
      vec2Allocator: LifecycleOwnedAllocator<vec2>): Entity {
    const entity = ecs.createEntity();
    const startResource = vec2Allocator.get();
    vec2.copy(startResource.Value, start);
    const endResource = vec2Allocator.get();
    vec2.copy(endResource.Value, end);
    entity.addComponent(WallComponent2, startResource, endResource, vitality);
    entity.addListener('destroy', () => {
      startResource.ReleaseFn();
      endResource.ReleaseFn();
    });
    return entity;
  }
}
