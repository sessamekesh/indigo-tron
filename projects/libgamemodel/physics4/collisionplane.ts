import { OwnedResource } from "@libutil/allocator";
import { vec2 } from "gl-matrix";

/**
 * A collision "plane" in 2D space - more accurately, a line that represents the bounds of an
 *  inequality. The line goes through 2D space, and has an "inside" and an "outside". For example,
 *  a ground plane might be defined by the normal [0, 1] (up) and offset [0, -5] (5 meters below
 *  scene origin). Any object above the point [0, -5] on the Y axis is considered "outside" the
 *  collision area, and any object below that point is considered "inside" and colliding.
 * Representation is a point and offset to make the math simpler: for a given point P, you can
 *  check the collision by checking the constraint (P - offset) * normal < 0
 */
export class CollisionPlane {
  constructor(public normal: OwnedResource<vec2>, public offset: number) {}
}
