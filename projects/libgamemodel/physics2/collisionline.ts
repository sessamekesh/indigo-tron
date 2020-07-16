import { OwnedResource } from "@libutil/allocator";
import { vec2 } from "gl-matrix";

export class CollisionLine {
  constructor(
    public readonly Point1: OwnedResource<vec2>,
    public readonly Point2: OwnedResource<vec2>) {}

  destroy() {
    this.Point1.ReleaseFn();
    this.Point2.ReleaseFn();
  }
}
