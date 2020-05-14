import { vec2 } from "gl-matrix";
import { ECSManager } from "@libecs/ecsmanager";
import { LineSegment2D, LineSegmentUtils } from "@libutil/math/linesegment";
import { WallComponent2 } from "@libgamemodel/wall/wallcomponent";
import { MathAllocatorsComponent } from "@libgamemodel/components/commoncomponents";

export class ArenaCollisionUtil {
  static getClosestWallInPath(
      ecs: ECSManager, lightcyclePos2: vec2, lightcycleDir2: vec2, wallScanDistance: number
      ): LineSegment2D|null {
    const {
      Vec2: tempVec2,
    } = ecs.getSingletonComponentOrThrow(MathAllocatorsComponent);
    return tempVec2.get(1, (toWall) => {

      const walls: LineSegment2D[] = [];
      const distSqrd = wallScanDistance * wallScanDistance;
      ecs.iterateComponents([WallComponent2], (e, wall) => {
        // Discard any walls behind us
        vec2.sub(toWall, wall.Corner1.Value, lightcyclePos2);
        if (vec2.dot(toWall, lightcycleDir2) < 0) return;
        vec2.sub(toWall, wall.Corner2.Value, lightcyclePos2);
        if (vec2.dot(toWall, lightcycleDir2) < 0) return;
        // Discard any walls too far away
        if (vec2.squaredDistance(wall.Corner1.Value, lightcyclePos2) > distSqrd) return;

        walls.push(ArenaCollisionUtil.getSegmentFromWall(wall, lightcyclePos2));
      });

      // No collideable walls? No problem!
      if (walls.length === 0) return null;

      return ArenaCollisionUtil.getClosestWallAlongLine(
        lightcyclePos2, lightcycleDir2, wallScanDistance, walls);
    });
  }

  static getClosestWallAlongLine(
      start: vec2, direction: vec2, distance: number, walls: LineSegment2D[]): LineSegment2D|null {
    let lastWall: LineSegment2D|null = null;
    let lastDistance: number = 0;
    const travelSegment: LineSegment2D = {
      x0: start[0],
      y0: start[1],
      x1: start[0] + direction[0] * distance,
      y1: start[1] + direction[1] * distance,
    };
    for (let i = 0; i < walls.length; i++) {
      const wall = walls[i];
      const collision = LineSegmentUtils.getCollision(travelSegment, wall);
      if (collision) {
        const distance = collision.isColinear
          ? collision.collisionStartAlongA
          : vec2.len(collision.depth);
        if (!lastWall) {
          lastWall = wall;
          lastDistance = distance;
        } else if (lastDistance > distance) {
          lastWall = wall;
          lastDistance = distance;
        }
      }
    }
    return lastWall;
  }

  // Point of convention: The point (x0, y0) will be the one closest to the lightcycle.
  static getSegmentFromWall(wall: WallComponent2, pos: vec2): LineSegment2D {
    const d1 = vec2.squaredDistance(wall.Corner1.Value, pos);
    const d2 = vec2.squaredDistance(wall.Corner2.Value, pos);

    return (d1 < d2) ? {
      x0: wall.Corner1.Value[0],
      y0: wall.Corner1.Value[1],
      x1: wall.Corner2.Value[0],
      y1: wall.Corner2.Value[1],
    } : {
      x0: wall.Corner2.Value[0],
      y0: wall.Corner2.Value[1],
      x1: wall.Corner1.Value[0],
      y1: wall.Corner1.Value[1],
    };
  }
}
