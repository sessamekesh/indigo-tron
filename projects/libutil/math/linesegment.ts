import {vec2} from 'gl-matrix';

/**
 * Line segment interfaces and utility class for dealing with them.
 *
 * There's a ton of pretty math-y comments here, so a couple of notes on the notation I use:
 * : Equations or steps in solving a problem are noted by a number in parenthesis and referenced
 *   later. For example: (1) 1+1=2
 * : The word "iff" means "if and only if" - either both conditions are true, or both are false
 * : When simplifying an equation in form A=B, I use "=>" to separate steps in-line.
 * : The dot product of two vectors is expressed by the multiplication symbol (*)
 */

/**
 * Represents a line segment between two points in 2D space.
 * If direction is relevant contextually, then [x0, y0] is the origin of the line, and [x1, x2] is
 *  in the "forward" direction for that line segment.
 */
export interface LineSegment2D {
  x0: number,
  y0: number,
  x1: number,
  y1: number,
}

/**
 * For a collision from line A into line B:
 * - "angle" is the angle between the two line segments between 0 and PI/2
 * - "depth" is the distance 'behind' B (along the line orthogonal to B) of the penetrating endpoint
 *  of A. At a right angle, this will be the distance along A that A is penetrating, otherwise less.
 * There is also the possibility of a colinear collision, which involves different data.
 */
export type LineSegment2DCollision = {
  isColinear: false,
  angle: number,
  depth: number,
}|{
  isColinear: true,
  collisionStartAlongA: number, // How far into A does the collision start?
  collisionLength: number, // How far into A does the collision end?
}

export class LineSegmentUtils {
  static isPoint(A: LineSegment2D) {
    return A.x0 === A.x1 && A.y0 === A.y1;
  }

  // vec2 allocations - avoid memory allocations over high-performance code
  private static Da = vec2.create();
  private static Db = vec2.create();
  private static aToB = vec2.create();
  private static aToB1 = vec2.create();
  private static A0 = vec2.create();
  private static B0 = vec2.create();
  private static B1 = vec2.create();
  private static CtoA1 = vec2.create();
  private static CollisionPoint = vec2.create();
  static getCollision(A: LineSegment2D, B: LineSegment2D): LineSegment2DCollision|null {
    // Special case: A or B are points. This is not allowed by this method.
    if (LineSegmentUtils.isPoint(A) || LineSegmentUtils.isPoint(B)) {
      throw new Error('Invalid line segment - must not be a point');
    }

    // See https://stackoverflow.com/questions/563198/how-do-you-detect-where-two-line-segments-intersect

    // Consider the following equation, which asserts that there is one point along both A and B at
    //  some distances t and u along them (respectively). The values may be outside of the line
    //  segment, though we will address that later:

    // (1) A0+t(A1-A0)=B0+u(B1-B0)

    // This equation has three possible states:
    // - There are zero valid solutions (A and B are parallel and non-colinear)
    // - There is exactly one valid solution (A and B collide, though perhaps not within the defined
    //   segments; i.e., they either collide or _would_ collide if they were longer)
    // - There are infinite solutions (A and B are colinear)

    // Take the following definitions of the directions of the vectors (for simplicity):
    // (2) Da=A1-A0
    // (3) Db=A1-A0

    // Define the 2D "cross product" of vectors V and W: (the determinant of a matrix formed by
    //  placing the vectors as rows).
    // (4) V x W = VxWy-VyWx
    // A couple fun properties of this definition that I'd like to point out here:
    // (5) V x V = VxVy-VyVx = 0 (also important: aVxV=0 as well for some constant a)
    // (6) (A+B)xC = (Ax+Bx)Cy-(Ay+By)Cx = AxCy+BxCy-AyCx-ByCx = AxCy-AyCx+BxCy-ByCx = AxC+BxC
    // (7) V x W = VxWy-VyWx = -(WxVy-WyVx) = -(V x W)
    // (8) aV x W = aVxWy-aVyWx = a(V x W)

    // Equation (1) can be rewritten as:
    // (9) A0+tDa=B0+uDb

    // Cross both sides with Db, giving:
    // (10) (A0+tDa)xDb=(B0+uDb)xDb
    // This simplifies down to
    // (11) A0xDb+tDaxDb=B0xDb
    // which can be solved for t
    // (12) t=(B0xDb-A0xDb)/(DaxDb)
    // This can similarly be done to find u:
    // (13) (A0+tDa)xDa=(B0+uDb)xDa => A0xDa=B0xDa+uDbxDa => u=(A0xDa-B0xDa)/(DbxDa)

    // As mentioned above, there are three possible states for this solution, all of which
    //  will have interesting characteristics in the solutions given in (12) and (13):
    // (14) Iff DbxDa = 0, then A and B are parallel and possibly colinear by (5)
    // This case has three cases itself: if A and B are parallel and not colinear, there is no
    //  collision. If A and B are parallel and colinear, there will be a collision iff A and B
    //  are not also disjoint.
    // (15) Iff (B0-A0)xDa = 0 as well as (14) being true, then the lines are colinear.
    // If both (14) and (15) are true, the endpoints B0 and B1 can be expressed in terms of
    //  A at two points defined in (1) as t, which I will denote t0 and t1, using a bit of dot
    //  product magic (intuitively speaking: how long along A0 to B0 in the direction of A is B0?)
    // (16) t0 = ((B0-A0)*Da)/(Da*Da)
    // (17) t1 = ((B1-A0)*Da)/(Da*Da)
    // There are three states of both t0 and t1 that are important - if they lie _before_ A, _on_ A,
    //  or _after_ A. I will denote these states with the symbols (-, 0, +) respectively.
    // First, since the direction of B does not matter for this method, make sure that t0<t1 by
    //  swapping the values if necessary.
    // After that is done, there will be 6 possible states for (t0, t1):
    // (-, -), (-, 0), (-, +), (0, 0), (0, +), (+, +)
    // Two of them represent no-collision cases (colinear but disjoint): (-,-) and (+, +)
    // All other cases represent a collision, and the collision values c0 and c1 (start, end) are:
    // (18) c0 = max(0, t0), c1 = min(1, t1)

    // The above logic solves two of the possible collision states of the two lines (zero solutions,
    //  infinite solutions). The final collision state is that there is exactly one solution for
    //  equation (1).
    // If (14) is false, then DaxDb does not equal zero (nor does DbxDa), which means there will
    //  be a solution for equations (12) and (13), which can be found trivially.

    // At this point, we only need to determine if the solution occurs on the line segments A and B,
    //  or if it is outside the bounds of those segments. This is easy - if t and u are both between
    //  0 and 1 (inclusive), there is a collision.

    // In this case, one final piece of information is useful to this method which has not been
    //  determined at this stage: how far is the far endpoint of A "into" B? To do that, define
    //  the vector from the collision point to the end of A as C:
    // (19) C=A1-(A0+tDa)
    // We can then find the distance C travels along B (denoted bdist)
    // (20) bdist=dot(C,Db)/length(Db)
    // The distance of penetration into B is then the length of C less how far it travels along B.
    // (21) penetration_distance = bdist - length(C)
    // Another nice property of the dot product is that:
    // (22) dot(A, B) = len(A) * len(B) * cos(angle between A and B)
    // so we can find the angle easily enough if we get to this point by
    // (23) angle between A and B = acos(dot(A, B) / (len(A) * len(B)))

    /////
    // Implementation
    /////

    // Find DbxDa, used in (12), (13), and (14)
    const Da = vec2.set(LineSegmentUtils.Da, A.x1 - A.x0, A.y1 - A.y0);
    const Db = vec2.set(LineSegmentUtils.Db, B.x1 - B.x0, B.y1 - B.y0);
    const DbxDa = LineSegmentUtils.cross(Da, Db);
    const A0 = vec2.set(LineSegmentUtils.A0, A.x0, A.y0);
    const B0 = vec2.set(LineSegmentUtils.B0, B.x0, B.y0);
    if (Math.abs(DbxDa) < 1e-8) {
      // The lines are parallel per (14). Check (15) as well
      const aToB = vec2.sub(LineSegmentUtils.aToB, B0, A0);
      if (Math.abs(LineSegmentUtils.cross(aToB, Da)) > 1e-8) {
        // A and B are not colinear, and there is no collision
        return null;
      }

      // A and B are colinear, find t0 and t1 per (16) and (17)
      const B1 = vec2.set(LineSegmentUtils.B1, B.x1, B.y1);
      const aToB1 = vec2.sub(LineSegmentUtils.aToB1, B1, A0);
      const DaDotDa = vec2.dot(Da, Da);
      let t0 = vec2.dot(aToB, Da) / DaDotDa;
      let t1 = vec2.dot(aToB1, Da) / DaDotDa;
      [t0, t1] = (t0 < t1) ? [t0, t1] : [t1, t0];

      // No collision cases: (-, -) and (+, +)
      if ((t0 < 0 && t1 < 0) || (t0 > 1 && t1 > 1)) {
        return null;
      }

      // All other cases repesent a collision per (18) (scale up to length of A)
      const alen = vec2.len(Da);
      const collisionStart = Math.max(0, t0 * alen);
      const collisionEnd = Math.min(alen, t1 * alen);
      return {
        isColinear: true,
        collisionStartAlongA: collisionStart,
        collisionLength: collisionEnd - collisionStart,
      };
    }

    // Find (t, u) per (12) and (13) since DaxDb is known to be non-zero
    const t = (LineSegmentUtils.cross(B0, Db) - LineSegmentUtils.cross(A0, Db)) / DbxDa;
    const u = (LineSegmentUtils.cross(A0, Da) - LineSegmentUtils.cross(B0, Da)) / -DbxDa;

    // No collision if t or u are out of bounds (0, 1)
    if (t < 0 || t > 1 || u < 0 || u > 1) {
      return null;
    }

    // Find collision point:
    const A1 = [A.x1, A.y1];
    const CollisionPoint = vec2.scaleAndAdd(LineSegmentUtils.CollisionPoint, A0, Da, t);
    const CtoA1 = vec2.sub(LineSegmentUtils.CtoA1, A1, CollisionPoint);

    const clen = vec2.len(CtoA1);
    const blen = vec2.len(Db);
    const alen = vec2.len(Da);
    const cDotDb = vec2.dot(CtoA1, Db);
    const dAdotdB = vec2.dot(Da, Db);
    const angle = Math.acos(Math.abs(dAdotdB / (alen * blen))); // per (23)

    if (clen < 1e-8) {
      return { isColinear: false, angle, depth: 0 };
    }
    const penetrationCoefficient = Math.sqrt(1 - Math.abs(cDotDb / (blen * clen)) ** 2);
    const depth = clen * penetrationCoefficient; // per (20) and (21)
    return { isColinear: false, angle, depth };
  }

  private static cross(v: vec2, w: vec2): number {
    return v[0]*w[1]-v[1]*w[0]; // per (4)
  }
}
