import { Entity } from "@libecs/entity";
import { LifecycleOwnedAllocator } from "@libutil/allocator";
import { vec3 } from "gl-matrix";
import { PositionComponent } from "./position.component";
import { VelocityComponent } from "./velocity.component";
import { MassComponent } from "./masscomponent";
import { ForceDampingComponent } from "./forcedamping.component";

export class PhysicsUtil {
  static attachBasicPhysicsComponents(
      entity: Entity,
      initialPosition: vec3,
      initialVelocity: vec3,
      invMass: number,
      vec3Allocator: LifecycleOwnedAllocator<vec3>) {
    const position = vec3Allocator.get();
    vec3.copy(position.Value, initialPosition);
    const velocity = vec3Allocator.get();
    vec3.copy(velocity.Value, initialVelocity);

    entity.addComponent(PositionComponent, position);
    entity.addComponent(VelocityComponent, velocity);
    entity.addComponent(MassComponent, invMass);
    entity.addComponent(ForceDampingComponent, 0.125);

    PositionComponent.attachLifecycle(entity);
    VelocityComponent.attachLifecycle(entity);
  }
}
