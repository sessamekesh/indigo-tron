import { mat4 } from 'gl-matrix';
import { Texture } from '@librender/texture/texture';
import { LambertGeo } from '@librender/geo/lambertgeo';

export class LambertRenderableComponent {
  constructor(
    public MatWorld: mat4,
    public Geometry: LambertGeo,
    public DiffuseTexture: Texture) {}
}
