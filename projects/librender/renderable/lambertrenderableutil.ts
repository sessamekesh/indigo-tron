import { mat4 } from 'gl-matrix';
import { Texture } from '@librender/texture/texture';
import { Renderable } from './renderable';
import { LambertGeo } from '@librender/geo/lambertgeo';
import { RenderGroup } from './rendergroup';
import { LifecycleOwnedAllocator, OwnedResource } from '@libutil/allocator';

export type LambertRenderablePerObjectData = {
  matWorld: OwnedResource<mat4>,
  ambientOverride?: number,
}

export type LambertGLResources = {
  geo: LambertGeo,
  diffuseTexture: Texture,
};

export type LambertRenderable = Renderable<LambertRenderablePerObjectData, LambertGLResources>;

export type LambertRenderableGroup = RenderGroup<LambertGLResources, LambertRenderablePerObjectData, LambertRenderable>;

function cleanup(objData: LambertRenderablePerObjectData) {
  objData.matWorld.ReleaseFn();
}

function createRenderable(objData: LambertRenderablePerObjectData, geo: LambertGLResources) {
  return new Renderable(objData, geo);
}

export class LambertRenderableUtil2 {
  private static genCreateDefault(
      mat4Allocator: LifecycleOwnedAllocator<mat4>): () => LambertRenderablePerObjectData {
    return () => {
      return {
        matWorld: mat4Allocator.get(),
        ambientOverride: undefined,
      };
    };
  }

  static createRenderGroup(mat4Allocator: LifecycleOwnedAllocator<mat4>) {
    return new RenderGroup(
      LambertRenderableUtil2.genCreateDefault(mat4Allocator), cleanup, createRenderable);
  }
}
