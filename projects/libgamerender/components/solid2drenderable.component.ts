import { OwnedResource } from '@libutil/allocator';
import { vec2, vec4 } from 'gl-matrix';
import { GeoBase } from '@librender/geo/geobase';
import { Entity } from '@libecs/entity';
import { Solid2DShaderAttribNames } from '@librender/shader/solid2dshader';

export class Solid2DRenderableComponent {
  constructor(
    public Geo: GeoBase<Solid2DShaderAttribNames>,
    public Rotation: number,
    public Scale: OwnedResource<vec2>,
    public Offset: OwnedResource<vec2>,
    public Color: OwnedResource<vec4>) {}

  static setupDestructor(entity: Entity) {
    entity.addListener('destroy', (e) => {
      const c = e.getComponent(Solid2DRenderableComponent);
      c?.Scale.ReleaseFn();
      c?.Offset.ReleaseFn();
      c?.Color.ReleaseFn();
    });
  }
}
