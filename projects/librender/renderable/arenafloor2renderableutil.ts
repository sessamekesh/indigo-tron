import { OwnedResource, LifecycleOwnedAllocator } from '@libutil/allocator';
import { mat4 } from 'gl-matrix';
import { GeoBase } from '@librender/geo/geobase';
import { Texture } from '@librender/texture/texture';
import { Renderable } from './renderable';
import { RenderGroup } from './rendergroup';

export type ArenaFloor2RenderablePerObjectData = {
  matWorld: OwnedResource<mat4>,
};

export type ArenaFloor2RenderableGLResources = {
  geo: GeoBase,
  normalTexture: Texture,
  albedoTexture: Texture,
  roughnessTexture: Texture,
  reflectionTexture: Texture,
};

export type ArenaFloor2Renderable =
  Renderable<ArenaFloor2RenderablePerObjectData, ArenaFloor2RenderableGLResources>;

export type ArenaFloor2RenderableGroup =
  RenderGroup<
    ArenaFloor2RenderableGLResources, ArenaFloor2RenderablePerObjectData, ArenaFloor2Renderable>;

function cleanup(objData: ArenaFloor2RenderablePerObjectData) {
  objData.matWorld.ReleaseFn();
}

function createRenderable(
    objData: ArenaFloor2RenderablePerObjectData, geo: ArenaFloor2RenderableGLResources) {
  return new Renderable(objData, geo);
}

export class ArenaFloor2RenderableUtil2 {
  private static genOrCreateDefault(
      mat4Allocator: LifecycleOwnedAllocator<mat4>): () => ArenaFloor2RenderablePerObjectData {
    return () => {
      return {
        matWorld: mat4Allocator.get(),
      };
    };
  }

  static createRenderGroup(mat4Allocator: LifecycleOwnedAllocator<mat4>) {
    return new RenderGroup(
      ArenaFloor2RenderableUtil2.genOrCreateDefault(mat4Allocator), cleanup, createRenderable);
  }
}
