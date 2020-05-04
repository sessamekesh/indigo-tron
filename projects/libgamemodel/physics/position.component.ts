import { OwnedResource } from "@libutil/allocator";
import { vec3 } from "gl-matrix";
import { Entity } from "@libecs/entity";

export class PositionComponent {
  constructor(public Position: OwnedResource<vec3>) {}

  static attachLifecycle(entity: Entity) {
    entity.addListener('destroy', e => {
      const component = e.getComponent(PositionComponent);
      if (!component) return;

      component.Position.ReleaseFn();
    });
  }
}
