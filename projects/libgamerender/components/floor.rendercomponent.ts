import { mat4 } from 'gl-matrix';
import { LambertGeo } from '@librender/geo/lambertgeo';
import { Texture } from '@librender/texture/texture';

export class FloorRenderComponent {
  constructor(
    public MatWorld: mat4,
    public Geo: LambertGeo,
    public Texture: Texture) {}
}
