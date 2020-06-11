import { OwnedResource } from '@libutil/allocator';
import { vec2, vec4 } from 'gl-matrix';
import { GeoBase } from '@librender/geo/geobase';
import { Entity } from '@libecs/entity';

export class Solid2DRenderableComponent {
  constructor(
    public Geo: GeoBase,
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
