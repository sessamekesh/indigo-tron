import { CollisionBox, Sign } from "./collisionbox";
import { CollisionLine } from "./collisionline";
import { OwnedResource, TempGroupAllocator, LifecycleOwnedAllocator } from "@libutil/allocator";
import { vec2 } from "gl-matrix";
import { MathUtils } from "@libutil/mathutils";
import { PhysicsBody } from "./physicsbody";

export type CollisionData = {
  CollisionPoint: OwnedResource<vec2>,
  CollisionNormal: OwnedResource<vec2>,
  CollisionMagnitude: number,

  SourceObject: PhysicsBody,
  DestinationObject: PhysicsBody,
};

export function collideBoxLine(
    tempVec2: TempGroupAllocator<vec2>,
    vec2Allocator: LifecycleOwnedAllocator<vec2>,
    box: CollisionBox,
    line: CollisionLine,
    source: PhysicsBody,
    dest: PhysicsBody): CollisionData[] {
  return tempVec2.get(4, (lineDirection, lineNormal, toLineBegin, corner) => {
    const collisions: CollisionData[] = [];

    vec2.sub(lineDirection, line.Point2.Value, line.Point1.Value);
    MathUtils.findPerpendicularVec2(lineNormal, lineDirection);
    vec2.normalize(lineNormal, lineNormal);

    vec2.sub(toLineBegin, line.Point1.Value, box.origin.Value);
    if (vec2.dot(toLineBegin, lineNormal) > 0) {
      vec2.scale(lineNormal, lineNormal, -1);
    }

    // Test each corner point for collision
    box.getPointPosition(corner, tempVec2, Sign.POSITIVE, Sign.POSITIVE);
    const corner1Collision =
      collisionForPoint(
        vec2Allocator, tempVec2, corner, lineNormal, line.Point1.Value, source, dest);
    if (corner1Collision) collisions.push(corner1Collision);

    box.getPointPosition(corner, tempVec2, Sign.POSITIVE, Sign.NEGATIVE);
    const corner2Collision =
      collisionForPoint(
        vec2Allocator, tempVec2, corner, lineNormal, line.Point1.Value, source, dest);
    if (corner2Collision) collisions.push(corner2Collision);

    box.getPointPosition(corner, tempVec2, Sign.NEGATIVE, Sign.POSITIVE);
    const corner3Collision =
      collisionForPoint(
        vec2Allocator, tempVec2, corner, lineNormal, line.Point1.Value, source, dest);
    if (corner3Collision) collisions.push(corner3Collision);

    box.getPointPosition(corner, tempVec2, Sign.NEGATIVE, Sign.NEGATIVE);
    const corner4Collision =
      collisionForPoint(
        vec2Allocator, tempVec2, corner, lineNormal, line.Point1.Value, source, dest);
    if (corner4Collision) collisions.push(corner4Collision);

    return collisions;
  });
}

function collisionForPoint(
    vec2Allocator: LifecycleOwnedAllocator<vec2>,
    tempVec2: TempGroupAllocator<vec2>,
    point: vec2,
    lineNormal: vec2,
    linePoint: vec2,
    source: PhysicsBody,
    dest: PhysicsBody): CollisionData|null {
  return tempVec2.get(1, toLineBegin => {
    vec2.sub(toLineBegin, linePoint, point);
    const dot = vec2.dot(toLineBegin, lineNormal);
    if (dot > 0) {
      // TODO (sessamekesh): Add collision here
      const collisionPoint = vec2Allocator.get();
      vec2.copy(collisionPoint.Value, point);
      const collisionNormal = vec2Allocator.get();
      vec2.copy(collisionNormal.Value, lineNormal);

      return {
        CollisionPoint: collisionPoint,
        CollisionNormal: collisionNormal,
        CollisionMagnitude: dot,

        SourceObject: source,
        DestinationObject: dest,
      };
    }

    return null;
  });
}
