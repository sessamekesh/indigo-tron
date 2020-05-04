import { OwnedResource } from "@libutil/allocator";
import { vec3 } from "gl-matrix";
import { Entity } from "@libecs/entity";

/** Accumulator for forces over the duration of a physics integration loop iteration */
export class ForceAccumulatorComponent {
  constructor(public Force: OwnedResource<vec3>) {}

  static attachLifecycle(entity: Entity) {
    entity.addListener('destroy', (e) => {
      const component = e.getComponent(ForceAccumulatorComponent);
      if (!component) return;
      component.Force.ReleaseFn();
    });
  }
}
