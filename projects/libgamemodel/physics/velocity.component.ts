import { OwnedResource } from "@libutil/allocator";
import { vec3 } from "gl-matrix";
import { Entity } from "@libecs/entity";

export class VelocityComponent {
  constructor(public Velocity: OwnedResource<vec3>) {}

  static attachLifecycle(entity: Entity) {
    entity.addListener('destroy', (e) => {
      const component = e.getComponent(VelocityComponent);
      if (!component) return;
      component.Velocity.ReleaseFn();
    });
  }
}
