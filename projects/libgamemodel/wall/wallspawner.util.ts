import { ECSManager } from "@libecs/ecsmanager";
import { Entity } from "@libecs/entity";
import { vec2 } from "gl-matrix";
import { WallComponent2 } from "./wallcomponent";
import { LifecycleOwnedAllocator, TempGroupAllocator } from "@libutil/allocator";

export class WallSpawnerUtil {
  static spawnWallsBetween(
      vec2Allocator: TempGroupAllocator<vec2>,
      vec2OwnedAllocator: LifecycleOwnedAllocator<vec2>,
      ecs: ECSManager,
      lastSpawnPoint: vec2,
      wallSegmentLength: number,
      destinationPoint: vec2,
      wallSpawnVitality: number,
      o_lastSpawnPoint: vec2) {
    vec2Allocator.get(4, (destinationFromSource, normal, lastSpawn, nextSpawn) => {
      vec2.copy(lastSpawn, lastSpawnPoint);
      vec2.sub(destinationFromSource, destinationPoint, lastSpawn);

      let remainingLength = vec2.len(destinationFromSource);
      if (remainingLength > wallSegmentLength) {
        vec2.scale(normal, destinationFromSource, 1/remainingLength);
      }

      while (remainingLength > wallSegmentLength) {
        vec2.scaleAndAdd(nextSpawn, lastSpawn, normal, wallSegmentLength);
        WallSpawnerUtil.spawnWall(ecs, lastSpawn, nextSpawn, wallSpawnVitality, vec2OwnedAllocator);
        vec2.copy(lastSpawn, nextSpawn);
        remainingLength -= wallSegmentLength;
      }

      vec2.copy(o_lastSpawnPoint, lastSpawn);
    });
  }

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
