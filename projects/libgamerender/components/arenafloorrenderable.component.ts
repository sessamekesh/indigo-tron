import { Texture } from '@librender/texture/texture';
import { ArenaFloorGeo } from '@librender/geo/arenafloorgeo';
import { mat4 } from 'gl-matrix';

export class ArenaFloorRenderableComponent {
  constructor(
    public ReflectionTexture: Texture,
    public BumpMapTexture: Texture,
    public Geo: ArenaFloorGeo,
    public MatWorld: mat4) {}
}
