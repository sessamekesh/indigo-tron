import { OwnedResource } from "@libutil/allocator";
import { vec2 } from "gl-matrix";
import { AABB2 } from "./aabb";

export class CollisionLine {
  public aabb: AABB2;

  constructor(
      public Point1: OwnedResource<vec2>,
      public Point2: OwnedResource<vec2>) {
    this.aabb = AABB2.from([Point1.Value, Point2.Value]);
  }
}
