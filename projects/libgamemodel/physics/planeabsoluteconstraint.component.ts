import { OwnedResource } from "@libutil/allocator";
import { Plane } from "./plane";
import { Entity } from "@libecs/entity";

/** Constraint that must be satisfied - an object must be on one side of the plane */
export class PlaneAbsoluteConstraintComponent {
  constructor(public Plane: OwnedResource<Plane>) {}

  static setOwnership(entity: Entity) {
    entity.addListener('destroy', (e) => {
      const c = e.getComponent(PlaneAbsoluteConstraintComponent);
      if (!c) return;
      c.Plane.ReleaseFn();
    });
  }
}
