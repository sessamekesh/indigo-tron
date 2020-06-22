import { ArenaFloor3RenderableGroup, ArenaFloor3RenderableUtil } from '@librender/renderable/arenafloor3renderableutil';
import { ECSManager } from '@libecs/ecsmanager';
import { LifecycleOwnedAllocator } from '@libutil/allocator';
import { mat4, vec3 } from 'gl-matrix';

export class ArenaFloor3RenderableGroupSingleton {
  constructor(public RenderableGroup: ArenaFloor3RenderableGroup) {}

  static generate(
      ecs: ECSManager,
      mat4Allocator: LifecycleOwnedAllocator<mat4>,
      vec3Allocator: LifecycleOwnedAllocator<vec3>) {
    ecs.iterateComponents2({}, {ArenaFloor3RenderableGroupSingleton}, e => e.destroy());
    const e = ecs.createEntity();
    e.addComponent(
      ArenaFloor3RenderableGroupSingleton,
      ArenaFloor3RenderableUtil.createRenderGroup(mat4Allocator, vec3Allocator));
  }
}
