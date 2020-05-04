import { vec3 } from "gl-matrix";

export class Plane {
  static fromNormalAndDistance(normal: vec3, distance: number): Plane|null {
    const plane = Plane.defaultPlane();
    if (plane.setNormalAndDistance(normal, distance)) {
      return plane;
    }
    return null;
  }

  static fromPositionAndNormal(normal: vec3, position: vec3): Plane|null {
    if (vec3.len(normal) < 0.0001) {
      console.error('Plane created with normal of length 0 - divide by zero error');
      return null;
    }
    const normalizedNormal = vec3.create();
    vec3.normalize(normalizedNormal, normal);
    const distance = vec3.dot(position, normalizedNormal);
    return new Plane(normalizedNormal, distance);
  }

  static defaultPlane(): Plane {
    return new Plane(vec3.fromValues(0, 1, 0), 0);
  }

  private constructor(
      private normal: vec3,
      private distance: number) {}

  setNormalAndDistance(normal: vec3, distance: number): boolean {
    if (vec3.len(normal) < 0.0001) {
      console.error('Plane created with normal of length 0 - divide by zero error');
      return false;
    }
    const normalizedNormal = vec3.create();
    vec3.normalize(normalizedNormal, normal);

    vec3.copy(this.normal, normalizedNormal);
    this.distance = distance;
    return true;
  }

  getNormal(o: vec3) {
    vec3.copy(o, this.normal);
  }

  getDistance() {
    return this.distance;
  }

  getClosestPointOnPlane(o: vec3, point: vec3) {
    const distanceFromPlane = vec3.dot(point, this.normal) - this.distance;
    vec3.scaleAndAdd(o, point, this.normal, -distanceFromPlane);
  }
}
