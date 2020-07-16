import { CollisionBox, Sign } from "./collisionbox";
import { CollisionLine } from "./collisionline";
import { CollisionData } from './collisiondata';
import { TempGroupAllocator, LifecycleOwnedAllocator } from "@libutil/allocator";
import { vec2 } from "gl-matrix";
import { MathUtils } from "@libutil/mathutils";
import { CollisionPlane } from "./collisionplane";

export function getBoxLineCollision(
    box: CollisionBox,
    line: CollisionLine,
    tempVec2: TempGroupAllocator<vec2>,
    vec2Allocator: LifecycleOwnedAllocator<vec2>): CollisionData[]|null {
  // Broadphase collision check: a nice early out for most collisions
  if (!box.broadCollisionCheck(line.aabb)) {
    return null;
  }

  return tempVec2.get(6, (lineDirection, lineNormal, toLineBegin, corner, boxOrigin, boxHalfSize) => {
    vec2.sub(lineDirection, line.Point2.Value, line.Point1.Value);
    MathUtils.findPerpendicularVec2(lineNormal, lineDirection);
    vec2.normalize(lineNormal, lineNormal);

    box.origin(boxOrigin);
    box.halfSize(boxHalfSize);
    vec2.sub(toLineBegin, line.Point1.Value, boxOrigin);
    if (vec2.dot(toLineBegin, lineNormal) > 0) {
      vec2.scale(lineNormal, lineNormal, -1);
    }

    // Test each corner point for collision
    const collisions: CollisionData[] = [];
    CollisionBox.getPointPosition(
      corner, boxOrigin, boxHalfSize, box.rotation(), tempVec2, Sign.POSITIVE, Sign.POSITIVE);
    const lineProjection1 = MathUtils.getProjectionOnLine(
      corner, line.Point1.Value, line.Point2.Value, tempVec2);
    if (lineProjection1 < 1 && lineProjection1 > 0) {
      const corner1Collision =
        lineCollisionForPoint(vec2Allocator, tempVec2, corner, lineNormal, line.Point1.Value);
      if (corner1Collision) collisions.push(corner1Collision);
    }

    CollisionBox.getPointPosition(
      corner, boxOrigin, boxHalfSize, box.rotation(), tempVec2, Sign.POSITIVE, Sign.NEGATIVE);
    const lineProjection2 = MathUtils.getProjectionOnLine(
      corner, line.Point1.Value, line.Point2.Value, tempVec2);
    if (lineProjection2 < 1 && lineProjection2 > 0) {
      const corner2Collision =
        lineCollisionForPoint(vec2Allocator, tempVec2, corner, lineNormal, line.Point1.Value);
      if (corner2Collision) collisions.push(corner2Collision);
    }

    CollisionBox.getPointPosition(
      corner, boxOrigin, boxHalfSize, box.rotation(), tempVec2, Sign.NEGATIVE, Sign.POSITIVE);
    const lineProjection3 = MathUtils.getProjectionOnLine(
      corner, line.Point1.Value, line.Point2.Value, tempVec2);
    if (lineProjection3 > 0 && lineProjection3 < 1) {
      const corner3Collision =
        lineCollisionForPoint(vec2Allocator, tempVec2, corner, lineNormal, line.Point1.Value);
      if (corner3Collision) collisions.push(corner3Collision);
    }

    CollisionBox.getPointPosition(
      corner, boxOrigin, boxHalfSize, box.rotation(), tempVec2, Sign.NEGATIVE, Sign.NEGATIVE);
    const lineProjection4 = MathUtils.getProjectionOnLine(
      corner, line.Point1.Value, line.Point2.Value, tempVec2);
    if (lineProjection4 > 0 && lineProjection4 < 1) {
      const corner4Collision =
        lineCollisionForPoint(vec2Allocator, tempVec2, corner, lineNormal, line.Point1.Value);
      if (corner4Collision) collisions.push(corner4Collision);
    }

    return (collisions.length > 0) ? collisions : null;
  });
}

export function getBoxPlaneCollision(
    box: CollisionBox,
    plane: CollisionPlane,
    tempVec2: TempGroupAllocator<vec2>,
    vec2Allocator: LifecycleOwnedAllocator<vec2>): CollisionData[]|null {
  return tempVec2.get(4, (boxOrigin, boxHalfSize, planeOrigin, corner) => {
    box.origin(boxOrigin);
    box.halfSize(boxHalfSize);
    vec2.scale(planeOrigin, plane.normal.Value, plane.offset);

    const collisions: CollisionData[] = [];
    CollisionBox.getPointPosition(
      corner, boxOrigin, boxHalfSize, box.rotation(), tempVec2, Sign.POSITIVE, Sign.POSITIVE);
    const corner1Collision = lineCollisionForPoint(
      vec2Allocator, tempVec2, corner, plane.normal.Value, planeOrigin);
    if (corner1Collision) collisions.push(corner1Collision);

    CollisionBox.getPointPosition(
      corner, boxOrigin, boxHalfSize, box.rotation(), tempVec2, Sign.POSITIVE, Sign.NEGATIVE);
    const corner2Collision = lineCollisionForPoint(
      vec2Allocator, tempVec2, corner, plane.normal.Value, planeOrigin);
    if (corner2Collision) collisions.push(corner2Collision);

    CollisionBox.getPointPosition(
      corner, boxOrigin, boxHalfSize, box.rotation(), tempVec2, Sign.NEGATIVE, Sign.POSITIVE);
    const corner3Collision = lineCollisionForPoint(
      vec2Allocator, tempVec2, corner, plane.normal.Value, planeOrigin);
    if (corner3Collision) collisions.push(corner3Collision);

    CollisionBox.getPointPosition(
      corner, boxOrigin, boxHalfSize, box.rotation(), tempVec2, Sign.NEGATIVE, Sign.NEGATIVE);
    const corner4Collision = lineCollisionForPoint(
      vec2Allocator, tempVec2, corner, plane.normal.Value, planeOrigin);
    if (corner4Collision) collisions.push(corner4Collision);

    return (collisions.length > 0) ? collisions : null;
  });
}

export function getBoxBoxCollision(
    box1: CollisionBox,
    box2: CollisionBox,
    tempVec2: TempGroupAllocator<vec2>,
    vec2Allocator: LifecycleOwnedAllocator<vec2>): CollisionData[]|null {
  if (box1.broadCollisionCheck(box2)) {
    return null;
  }

  return tempVec2.get(
      12,
      (
        box1Origin, box1HalfSize, box2Origin, box2HalfSize,
        corner1, corner2, corner3, corner4,
        bsCorner1, bsCorner2, bsCorner3, bsCorner4
      ) => {
    box1.origin(box1Origin);
    box1.halfSize(box1HalfSize);
    box2.origin(box2Origin);
    box2.halfSize(box2HalfSize);

    // Get corner points of box2
    CollisionBox.getPointPosition(
      corner1, box2Origin, box2HalfSize, box2.rotation(), tempVec2, Sign.POSITIVE, Sign.POSITIVE);
    CollisionBox.getPointPosition(
      corner2, box2Origin, box2HalfSize, box2.rotation(), tempVec2, Sign.POSITIVE, Sign.NEGATIVE);
    CollisionBox.getPointPosition(
      corner3, box2Origin, box2HalfSize, box2.rotation(), tempVec2, Sign.NEGATIVE, Sign.POSITIVE);
    CollisionBox.getPointPosition(
      corner4, box2Origin, box2HalfSize, box2.rotation(), tempVec2, Sign.NEGATIVE, Sign.NEGATIVE);

    // Convert them into box1 space
    MathUtils.invTransformVec2(bsCorner1, corner1, box1Origin, box1.rotation(), tempVec2);
    MathUtils.invTransformVec2(bsCorner2, corner2, box1Origin, box1.rotation(), tempVec2);
    MathUtils.invTransformVec2(bsCorner3, corner3, box1Origin, box1.rotation(), tempVec2);
    MathUtils.invTransformVec2(bsCorner4, corner4, box1Origin, box1.rotation(), tempVec2);

    // Find points that are within halfsize of box1
    const collision1 = aabbCollisionForPoint(
      box1HalfSize, bsCorner1, box1Origin, box1.rotation(), tempVec2, vec2Allocator);
    const collision2 = aabbCollisionForPoint(
      box1HalfSize, bsCorner2, box1Origin, box1.rotation(), tempVec2, vec2Allocator);
    const collision3 = aabbCollisionForPoint(
      box1HalfSize, bsCorner3, box1Origin, box1.rotation(), tempVec2, vec2Allocator);
    const collision4 = aabbCollisionForPoint(
      box1HalfSize, bsCorner4, box1Origin, box1.rotation(), tempVec2, vec2Allocator);

    const collisions: CollisionData[] = [];
    if (collision1) collisions.push(collision1);
    if (collision2) collisions.push(collision2);
    if (collision3) collisions.push(collision3);
    if (collision4) collisions.push(collision4);

    return (collisions.length > 0) ? collisions : null;
  });
}

function lineCollisionForPoint(
    vec2Allocator: LifecycleOwnedAllocator<vec2>,
    tempVec2: TempGroupAllocator<vec2>,
    point: vec2,
    lineNormal: vec2,
    linePoint: vec2): CollisionData|null {
  return tempVec2.get(1, (toLineBegin) => {
    vec2.sub(toLineBegin, linePoint, point);
    const dot = vec2.dot(toLineBegin, lineNormal);
    if (dot > 0) {
      const collisionPoint = vec2Allocator.get();
      vec2.copy(collisionPoint.Value, point);
      const collisionNormal = vec2Allocator.get();
      vec2.copy(collisionNormal.Value, lineNormal);

      return {
        CollisionPoint: collisionPoint,
        CollisionNormal: collisionNormal,
        CollisionDepth: dot,
      };
    }

    return null;
  });
}

function aabbCollisionForPoint(
    aabbHalfSize: vec2,
    point: vec2,
    offset: vec2,
    rotation: number,
    tempVec2: TempGroupAllocator<vec2>,
    vec2Allocator: LifecycleOwnedAllocator<vec2>): CollisionData|null {
  let xPen: number|null = null;
  let xSign: Sign = Sign.POSITIVE;
  let yPen: number|null = null;
  let ySign: Sign = Sign.POSITIVE;
  if (point[0] < aabbHalfSize[0] && point[0] > -aabbHalfSize[0]) {
    xSign = (point[0] < 0) ? Sign.NEGATIVE : Sign.POSITIVE;
    xPen = aabbHalfSize[0] = Math.abs(point[0]);
  }
  if (point[1] < aabbHalfSize[1] && point[1] > -aabbHalfSize[1]) {
    ySign = (point[1] < 0) ? Sign.NEGATIVE : Sign.POSITIVE;
    yPen = aabbHalfSize[1] = Math.abs(point[1]);
  }

  if (xPen == null && yPen == null) {
    return null;
  } else if (xPen != null && (yPen == null || yPen < xPen)) {
    return tempVec2.get(2, (normal, zero) => {
      vec2.set(zero, 0, 0);
      const collisionPoint = vec2Allocator.get();
      const collisionNormal = vec2Allocator.get();
      MathUtils.transformVec2(collisionPoint.Value, point, offset, rotation, tempVec2);
      vec2.set(normal, (xSign == Sign.POSITIVE) ? 1 : -1, 0);
      vec2.rotate(collisionNormal.Value, normal, zero, rotation);

      return{
        CollisionPoint: collisionPoint,
        CollisionNormal: collisionNormal,
        CollisionDepth: xPen!,
      };
    });
  } else {
    return tempVec2.get(2, (normal, zero) => {
      vec2.set(zero, 0, 0);
      const collisionPoint = vec2Allocator.get();
      const collisionNormal = vec2Allocator.get();
      MathUtils.transformVec2(collisionPoint.Value, point, offset, rotation, tempVec2);
      vec2.set(normal, 0, (ySign == Sign.POSITIVE) ? 1 : -1);
      vec2.rotate(collisionNormal.Value, normal, zero, rotation);

      return{
        CollisionPoint: collisionPoint,
        CollisionNormal: collisionNormal,
        CollisionDepth: yPen!,
      };
    });
  }
}
