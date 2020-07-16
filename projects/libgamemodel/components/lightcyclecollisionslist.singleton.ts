import { ECSManager } from "@libecs/ecsmanager";
import { Entity } from "@libecs/entity";
import { OwnedResource } from "@libutil/allocator";
import { vec2 } from "gl-matrix";

type LightcycleCollisionRecordBase = {
  LightcycleEntity: Entity,
  CollisionPoint: OwnedResource<vec2>,
  CollisionNormal: OwnedResource<vec2>,
  CollisionDepth: number,
};

type ArenaWallCollision = {
  ArenaWallEntity: Entity,
};

type CycleWallCollision = {
  CycleWallEntity: Entity,
};

type EnemyLightcycleCollision = {
  EnemyLightcycleEntity: Entity,
};

export type LightcycleCollisionRecord =
  (ArenaWallCollision | CycleWallCollision | EnemyLightcycleCollision)
  & LightcycleCollisionRecordBase;

/**
 * List of lightcycle collision events that happened in a frame
 */
export class LightcycleCollisionsListSingleton {
  constructor(public Collisions: LightcycleCollisionRecord[]) {}

  static upsert(ecs: ECSManager) {
    const existing = ecs.getSingletonComponent(LightcycleCollisionsListSingleton);
    if (existing) return existing;

    const e = ecs.createEntity();
    const component = e.addComponent(LightcycleCollisionsListSingleton, []);

    const cb = ecs.addListener('afterUpdate', () => {
      component.Collisions.forEach((collision) => {
        collision.CollisionPoint.ReleaseFn();
        collision.CollisionNormal.ReleaseFn();
      });
      component.Collisions = [];
    });
    e.addListener('destroy', () => {
      component.Collisions.forEach((collision) => {
        collision.CollisionPoint.ReleaseFn();
        collision.CollisionNormal.ReleaseFn();
      });
      component.Collisions = [];
      ecs.removeListener('afterUpdate', cb);
    });

    return component;
  }
}
