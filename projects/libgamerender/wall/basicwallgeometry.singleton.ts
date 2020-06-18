import { LambertGeo } from '@librender/geo/lambertgeo';
import { Texture } from '@librender/texture/texture';

export class BasicWallGeometrySingleton {
  constructor(
    public LambertGeo: LambertGeo,
    public BlueTexture: Texture,
    public GreenTexture: Texture,
    public RedTexture: Texture) {}
}
