import {glMatrix, mat2, vec2} from 'gl-matrix';

/////////////
// WARNING //
/////////////

// There is a bunch of math in this file that I did late one night. All of this can probably
//  be solved way easier, and in fact should probably be done differently.
// I was obsessed with the idea of only using arithmetic for the common cases, having early outs
//  as quickly as possible, and deferring any sqrt/acos operations until as late as possible.
// Everything is very carefully explained in the comments, but is still... very gross.

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

  static getCollision(A: LineSegment2D, B: LineSegment2D): LineSegment2DCollision|null {
    // Special case: A or B are points. This is not allowed by this method.
    if (LineSegmentUtils.isPoint(A) || LineSegmentUtils.isPoint(B)) {
      throw new Error('Invalid line segment - must not be a point');
    }

    // There is a collision point between line segments A and B at C if there is a value pair
    //  (t, u) such that:
    // (1): 0<=t<=1, 0<=u<=1, AND
    // (2): A_0 + t(A_1 - A_0) = B_0 + u(B_1 - B_0)
    // I will use substitution for this case, though there are several ways to solve this problem.
    // Using linear algebra would be a good solution as well, but would require taking the
    //  magnitude of these lines at some point, which is an expensive operation. Plus, this solution
    //  has a greater chance of being understood by a wider audience, which is nice.
    // This can be rewritten component-wise for 2D as:
    // (3): A_0x+t(A_1x-A_0x)-B_0x-u(B_1x-B_0x) = 0 AND
    // (4): A_0y+t(A_1y-A_0y)-B_0y-u(B_1y-B_0y) = 0
    // Isolating u in (3), we get:
    // (5): u=(A_0x+t(A_1x-A_0x)-B_0x)/(B_1x-B_0x)
    // Substituting this in for the value of u in (4), we get an equation with one unknown:
    // (6): A_0y+t(A_1y-A_0y)-B_0y-((A_0x+t(A_1x-A_0x)-B_0x)/(B_1x-B_0x))(B_1y-B_0y) = 0
    // Multiplying the fourth term out into its individual components, we get
    // (7): A_0y+t(A_1y-A_0y)-B_0y
    //      -(A_0x/(B_1x-B_0x)+t(A_1x-A_0x)/(B_1x-B_0x)-B_0x/(B_1x-B_0x))(B_1y-B_0y) = 0
    // Separating the term with the t in it further:
    // (8): A_0y-B_0y
    //      +t(A_1y-A_0y)
    //      +t(A_1x-A_0x)(B_1y-B_0y)/(B_1x-B_0x)
    //      -A_0x(B_1y-B_0y)/(B_1x-B_0x)
    //      -B_0x(B_1y-B_0y)/(B_1x-B_0x) = 0
    // Isolating t completely, we get:
    // (9): t=-A_0y+B_0y+(A_0x(B_1y-B_0y)/(B_1x-B_0x)+B_0x(B_1y-B_0y)/(B_1x-B_0x)-A_0y)
    //        /((A_1y-A_0y)+(A_1x-A_0x)(B_1y-B_0y)/(B_1x-B_0x))
    // Using the value of t found in (9) in equation (5) gives the value of u as well.
    // Unfortunately, there's a problem here - there are two cases where a division is happening
    //  for a case that we know to be valid: (B_1x-B_0x), and (A_1y-A_0y). By the equations above
    //  in their current form, we would not be able to solve if B was completely horizontal, or A
    //  completely vertical - both of which are totally valid cases.
    // Weird as it sounds, in either of those cases, we can rotate the entire system by 10 degrees
    //  and compute with those values instead (rotations are cheap). That may not work in some
    //  cases, in which case we can rotate by 20 degrees instead.
    const {A: A_, B: B_} = LineSegmentUtils.findSolvableLines(A, B);
    const {
      A_: {x0: A_0x, y0: A_0y, x1: A_1x, y1: A_1y},
      B_: {x0: B_0x, y0: B_0y, x1: B_1x, y1: B_1y},
    } = {A_, B_};

    // There is one more division by zero that actually does matter: the case where the divisor
    //  of (9) is zero. This is an actual problem, when A and B are parallel.
    // A colinear check is easy enough: is A0 somewhere along the line B?
    // (10): B0=A0+s(A1-A0) for a value of 0<=s<=1, AND
    // (11): B1=A0+v(A1-A0) for a value of 0<=v<=1
    // This can also be split out component-wise to give us assistance:
    // (12): B_0x=A_0x+sx(A_1x-A_0x)
    // (13): B_0y=A_0y+sy(A_1y-A_0y)
    // (14): B_1x=A_0x+vx(A_1x-A_0x)
    // (15): B_1y=A_0y+vy(A_1y-A_0y)
    // If s=sx iff sx===sy, likewise v=vy iff vx===vy
    // Those equations can be solved to give us useful ones:
    // (16): sx=(B_0x-A_0x)/(A_1x-A_0x)
    // (17): sy=(B_0y-A_0y)/(A_1y-A_0y)
    // (18): vx=(B_1x-A_0x)/(A_1x-A_0x)
    // (19): vy=(B_1y-A_0y)/(A_1y-A_0y)
    // You'll notice this adds another condition to check in our solveable lines check: (A_1x-A_0x)
    if (LineSegmentUtils.isParallel(A_, B_)) {
      const sx = (B_0x-A_0x)/(A_1x-A_0x);
      const sy = (B_0y-A_0y)/(A_1y-A_0y);
      const vx = (B_1x-A_0x)/(A_1x-A_0x);
      const vy = (B_1y-A_0y)/(A_1y-A_0y);
      // Not colinear
      if (Math.abs(sx-sy)>1e-8 || Math.abs(vx-vy)>1e-8) {
        return null;
      }

      // The direction of B relative to A is irrelevant for the following, so flip B around such
      //  that B0 comes first along A.
      const [s, v] = (sx < vx) ? [sx, vx] : [vx, sx];

      // B0 can be before, inside, or after A (3 states) (s is negative, between 0 and 1, or >1)
      // B1 can be before, inside, or after A (3 states) (v is negative, between 0 and 1, or >1)
      // That gives a total of 9 states for each possible combination of those two conditions.
      // Two of those states can be removed completely: [-, -] and [+, +] as having no collision
      if ((s < 0 && v < 0) || (s > 1 && v > 1)) {
        return null;
      }

      // Of the seven remaining states, three are invalid since they break the ordering we gave
      //  before (where B1 must come after B0): [0, -], [+, -], and [+, 0].
      // That leaves four remaining states, each to be considered:

      // For the remaining entries, we have a collision and need the length.
      const len = Math.sqrt((B_1x-B_0x)**2+(B_1y-B_0y)**2);

      // [-, 0]
      if (s < 0 && v > 0 && v < 1) {
        return { isColinear: true, collisionStartAlongA: 0, collisionLength: v * len };
      }

      // [-, +]
      if (s < 0 && v > 1) {
        return { isColinear: true, collisionStartAlongA: 0, collisionLength: len };
      }

      // [0, 0]
      if (s > 0 && s < 1 && v > 0 && v < 1) {
        return { isColinear: true, collisionStartAlongA: s * len, collisionLength: (v - s) * len };
      }

      // [0, +]
      if (s > 0 && s < 1 && v > 1) {
        return { isColinear: true, collisionStartAlongA: s * len, collisionLength: (1 - s) * len };
      }

      // Code should not reach this point - all cases should have been considered.
      throw new Error('Unanticipated condition in colinear collision check');
    }

    // As a reminder:
    // (1): 0<=t<=1, 0<=u<=1, AND
    // (2): A_0 + t(A_1 - A_0) = B_0 + u(B_1 - B_0)
    // (9): t=-A_0y+B_0y+(A_0x(B_1y-B_0y)/(B_1x-B_0x)+B_0x(B_1y-B_0y)/(B_1x-B_0x)-A_0y)
    //        /((A_1y-A_0y)+(A_1x-A_0x)(B_1y-B_0y)/(B_1x-B_0x))
    // (5): u=(A_0x+t(A_1x-A_0x)-B_0x)/(B_1x-B_0x)
    const t = -A_0y+B_0y
        +(A_0x*(B_1y-B_0y)/(B_1x-B_0x)+B_0x*(B_1y-B_0y)/(B_1x-B_0x)-A_0y) /
         ((A_1y-A_0y)+(A_1x-A_0x)*(B_1y-B_0y)/(B_1x-B_0x));

    // Case 1: Line A may hit line B, but is travelling in the wrong direction
    if (t < 0) {
      return null;
    }

    // Case 2: Line A may hit line B, but is too short
    if (t > 1) {
      return null;
    }

    const u = (A_0x+t*(A_1x-A_0x)-B_0x)/(B_1x-B_0x);
    // Case 3: Line A misses line B completely, because line B does not cover where line A hits
    if (u < 0 || u > 1) {
      return null;
    }

    // Case 4: collision happens! Do the more expensive work here...
    // Get length of A, B
    const alen = Math.sqrt((A_1x-A_0x)**2+(A_1y-A_0y)**2);
    const blen = Math.sqrt((B_1x-B_0x)**2+(B_1y-B_0y)**2);

    // Get normalized delta vectors for A and B
    const udax = (A_1x-A_0x)/alen;
    const uday = (A_1y-A_0y)/alen;
    const udbx = (B_1x-B_0x)/blen;
    const udby = (B_1y-B_0y)/blen;

    // Get dot product between them. Make it positive, because we don't care which direction B
    //  is going relative to A (they should be considered to be in the same direction)
    const udot = Math.abs(udax * udbx + uday * udby);
    const angle = Math.acos(udot);

    // The dot product, 0-1, is the percentage of a unit travelled along A that will also be
    //  travelled along B, roughly speaking. If you take 1-dot, you get the opposite - the amount
    //  perpendicular to B that travelling along A gets you. Fun, no?
    // So! The length travelled along A beyond the collision is (1-t)*len(A), which can in turn
    //  be multiplied by (1-dot) to give how far the collision is perpendicular to B.
    const dist = (1-t)*alen*(1-udot);

    // With that, we have everything we need!
    return { isColinear: false, angle, depth: dist };
  }

  private static RAD_10 = glMatrix.toRadian(10);
  private static MATROT10 = mat2.fromRotation(mat2.create(), LineSegmentUtils.RAD_10);

  private static tmp = vec2.create();
  private static tmp2 = vec2.create();
  /** Possibly rotate and find points used for collision solution (documented above) */
  private static findSolvableLines(A: LineSegment2D, B: LineSegment2D)
      : {A: LineSegment2D, B: LineSegment2D} {
    let A0X = A.x0; let A1X = A.x1; let A0Y = A.y0; let A1Y = A.y1;
    let B0X = B.x0; let B1X = B.x1; let B0Y = B.y0; let B1Y = B.y1;
    for (let i = 0; i < 3; i++) {
      if ((((B1X-B0X)!==0)&&((A1Y-A0Y)!==0)&&((A1X-A0X)!==0))) {
        return {
          A: { x0: A0X, x1: A1X, y0: A0Y, y1: A1Y },
          B: { x0: B0X, x1: B1X, y0: B0Y, y1: B1Y },
        };
      }
      [A0X, A0Y] = LineSegmentUtils.rotatePoints(A0X, A0Y);
      [A1X, A1Y] = LineSegmentUtils.rotatePoints(A1X, A1Y);
      [B0X, B0Y] = LineSegmentUtils.rotatePoints(B0X, B0Y);
      [B1X, B1Y] = LineSegmentUtils.rotatePoints(B1X, B1Y);
    }
    throw new Error('Unexpected case hit - no solvable points could be found');
  }

  private static rotatePoints(x: number, y: number): [number, number] {
    const current = LineSegmentUtils.tmp;
    const next = LineSegmentUtils.tmp2;
    vec2.set(current, x, y);
    vec2.transformMat2(next, current, LineSegmentUtils.MATROT10);
    return [next[0], next[1]];
  }

  private static isParallel(A: LineSegment2D, B: LineSegment2D) {
    // Taken from divisor of (9) above:
    return ((A.y1-A.y0)+(A.x1-A.x0)*(B.y1-B.y0)/(B.x1-B.x0)) <= 1e-8;
  }
}
