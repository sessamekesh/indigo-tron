import { FlatColorLambertGeo } from '@librender/geo/flatcolorlambertgeo';
import { mat4 } from 'gl-matrix';

export class FlatColorLambertRenderableComponent {
  constructor(
    public Geo: FlatColorLambertGeo,
    public MatWorld: mat4) {}
}
