import { Renderable2 } from '@librender/renderable/renderable2';
import { GeoBase } from '@librender/geo/geobase';
import { vec3, vec2, vec4 } from 'gl-matrix';
import { OwnedResource } from '@libutil/allocator';
import { Texture } from '@librender/texture/texture';
import { ArenaWall2AttribType } from '@librender/shader/arenawallshader2';

type PerObjectData = {
  geo: GeoBase<ArenaWall2AttribType>,

  baseColor: OwnedResource<vec4>,
  wispMaxIntensity: number,
  wispColor: OwnedResource<vec3>,

  wispMovement1: OwnedResource<vec2>,
  wispMovement2: OwnedResource<vec2>,
  wispTexture1Scale: OwnedResource<vec2>,
  wispTexture2Scale: OwnedResource<vec2>
  cloudWispTexture1: Texture,
  cloudWispTexture2: Texture,
};

export class ArenaWallShader2Renderable2 extends Renderable2<PerObjectData> {}
