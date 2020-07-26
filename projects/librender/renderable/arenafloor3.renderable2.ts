import { OwnedResource } from "@libutil/allocator";
import { vec3 } from 'gl-matrix';
import { Renderable2 } from './renderable2';
import { GeoBase } from '@librender/geo/geobase';
import { Texture } from '@librender/texture/texture';
import { ArenaFloorShader3AttribType } from '@librender/shader/arenafloorshader3';

type PerObject = {
  floorColor: OwnedResource<vec3>,
  reflectionFactor: number,

  geo: GeoBase<ArenaFloorShader3AttribType>,
  reflectionTexture: Texture,
};

export class ArenaFloor3Renderable2 extends Renderable2<PerObject> {}
