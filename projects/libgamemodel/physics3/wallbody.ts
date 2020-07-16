import { OwnedResource } from "@libutil/allocator";
import { vec2 } from "gl-matrix";
import { AABB } from "./aabb";

export class WallBody {
  private constructor(
    public readonly Point1: OwnedResource<vec2>,
    public readonly Point2: OwnedResource<vec2>,
    public readonly aabb: AABB) {}

  static create(point1: OwnedResource<vec2>, point2: OwnedResource<vec2>) {
    return new WallBody(point1, point2, AABB.from([point1.Value, point2.Value]));
  }

  destroy() {
    this.Point1.ReleaseFn();
    this.Point2.ReleaseFn();
  }
}
