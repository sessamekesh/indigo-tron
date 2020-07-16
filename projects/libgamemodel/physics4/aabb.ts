import { vec2 } from "gl-matrix";

export class AABB2 {
  constructor(
    public MinX: number,
    public MaxX: number,
    public MinY: number,
    public MaxY: number) {}

  static aabbColliding(a: AABB2, b: AABB2) {
    // Eliminate non-collisions with separating axis theorem
    if (a.MinX > b.MaxX) return false;
    if (a.MaxX < b.MinX) return false;
    if (a.MinY > b.MaxY) return false;
    if (a.MaxY < b.MinY) return false;

    // No separating axis exists - the two AABBs must be colliding
    return true;
  }

  static from(points: vec2[]): AABB2 {
    return new AABB2(0, 0, 0, 0).update(points);
  }

  update(points: vec2[]) {
    if (points.length === 0) throw new Error('Must have at least one point');

    let minX = points[0][0];
    let maxX = minX;
    let minY = points[0][1];
    let maxY = minY;

    for (let i = 1; i < points.length; i++) {
      const point = points[i];
      minX = Math.min(minX, point[0]);
      minY = Math.min(minY, point[1]);
      maxX = Math.max(maxX, point[0]);
      maxY = Math.max(maxY, point[1]);
    }

    return this;
  }
}
