import { OwnedResource, LifecycleOwnedAllocator } from '@libutil/allocator';
import { mat4, vec3 } from 'gl-matrix';
import { GeoBase } from '@librender/geo/geobase';
import { Texture } from '@librender/texture/texture';
import { Renderable } from './renderable';
import { RenderGroup } from './rendergroup';

type PerObject = {
  matWorld: OwnedResource<mat4>,
  floorColor: OwnedResource<vec3>,
  reflectionFactor: number,
};
export type ArenaFloor3PerObjectData = PerObject;

type GLResources = {
  geo: GeoBase,
  reflectionTexture: Texture,
};
export type ArenaFloor3GLResources = GLResources;

function cleanup(objData: PerObject) {
  objData.floorColor.ReleaseFn();
  objData.matWorld.ReleaseFn();
}

function createRenderable(objData: PerObject, glResources: GLResources) {
  return new Renderable(objData, glResources);
}

export type ArenaFloor3Renderable = Renderable<PerObject, GLResources>;
export type ArenaFloor3RenderableGroup = RenderGroup<GLResources, PerObject, ArenaFloor3Renderable>;

export class ArenaFloor3RenderableUtil {
  private static genOrCreateDefault(
      mat4Allocator: LifecycleOwnedAllocator<mat4>,
      vec3Allocator: LifecycleOwnedAllocator<vec3>): () => PerObject {
    return () => {
      return {
        matWorld: mat4Allocator.get(),
        floorColor: vec3Allocator.get(),
        reflectionFactor: 0.0,
      };
    };
  }

  static createRenderGroup(
      mat4Allocator: LifecycleOwnedAllocator<mat4>, vec3Allocator: LifecycleOwnedAllocator<vec3>) {
    return new RenderGroup(
      ArenaFloor3RenderableUtil.genOrCreateDefault(mat4Allocator, vec3Allocator),
      cleanup,
      createRenderable);
  }
}
