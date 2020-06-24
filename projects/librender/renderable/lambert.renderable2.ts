import { LambertGeo } from "@librender/geo/lambertgeo";
import { Texture } from '@librender/texture/texture';
import { Renderable2 } from './renderable2';

type PerObjectData = {
  ambientOverride?: number,
  geo: LambertGeo,
  diffuseTexture: Texture,
};

export class LambertRenderable2 extends Renderable2<PerObjectData> {}
