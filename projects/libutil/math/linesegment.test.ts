import { LineSegmentUtils, LineSegment2DCollision } from "./linesegment";
import { fail } from "assert";

function compare(expected: LineSegment2DCollision, actual: LineSegment2DCollision) {
  if (expected.isColinear) {
    if (!actual.isColinear) {
      fail(`${JSON.stringify(actual)} is not colinear, expected value ${JSON.stringify(expected)} is.`);
      return;
    }
    expect(actual.collisionLength).toBeCloseTo(expected.collisionLength, 4);
    expect(actual.collisionStartAlongA).toBeCloseTo(expected.collisionStartAlongA, 4);
    return;
  }

  if (expected.isColinear === false) {
    if (actual.isColinear !== false) {
      fail(`${JSON.stringify(actual)} is colinear, expected value ${JSON.stringify(expected)} is not.`);
      return;
    }
    expect(actual.angle).toBeCloseTo(expected.angle, 6);
    expect(actual.depth).toBeCloseTo(expected.depth, 4);
  }
}

describe('LineSegmentUtils', () => {
  describe('isPoint', () => {
    it('rejects actual lines', () => {
      // Horizontal line
      expect(LineSegmentUtils.isPoint({ x0: 0, x1: 5, y0: 0, y1: 0 })).toBeFalsy();
      // Vertical line
      expect(LineSegmentUtils.isPoint({ x0: 0, x1: 0, y0: 0, y1: 5 })).toBeFalsy();
      // Diagonal line
      expect(LineSegmentUtils.isPoint({ x0: 0, x1: 5, y0: 0, y1: 5 })).toBeFalsy();
      // Point
      expect(LineSegmentUtils.isPoint({ x0: 5, x1: 5, y0: 3, y1: 3 })).toBeTruthy();
    });
  });

  describe('getCollision', () => {
    describe('co-linear inputs', () => {
      it('rejects second line totally before or after first (non-horizontal inputs)', () => {
        expect(LineSegmentUtils.getCollision(
          {x0: 0, x1: 1, y0: 0, y1: 1},
          {x0: -2, x1: -1, y0: -2, y1: -1})).toBeNull();
        expect(LineSegmentUtils.getCollision(
          {x0: 0, x1: 1, y0: 0, y1: 1},
          {x0: -1, x1: -2, y0: -1, y1: -2})).toBeNull();
        expect(LineSegmentUtils.getCollision(
          {x0: 0, x1: 1, y0: 0, y1: 1},
          {x0: 3, x1: 2, y0: 3, y1: 2})).toBeNull();
        expect(LineSegmentUtils.getCollision(
          {x0: 0, x1: 1, y0: 0, y1: 1},
          {x0: 2, x1: 3, y0: 2, y1: 3})).toBeNull();
      });

      it('rejects second line totally before or after first (horizontal inputs)', () => {
        expect(LineSegmentUtils.getCollision(
          {x0: 0, x1: 1, y0: 0, y1: 0},
          {x0: -2, x1: -1, y0: 0, y1: 0})).toBeNull();
        expect(LineSegmentUtils.getCollision(
          {x0: 0, x1: 1, y0: 0, y1: 0},
          {x0: -1, x1: -2, y0: 0, y1: 0})).toBeNull();
        expect(LineSegmentUtils.getCollision(
          {x0: 0, x1: 1, y0: 0, y1: 0},
          {x0: 3, x1: 2, y0: 0, y1: 0})).toBeNull();
        expect(LineSegmentUtils.getCollision(
          {x0: 0, x1: 1, y0: 0, y1: 0},
          {x0: 2, x1: 3, y0: 0, y1: 0})).toBeNull();
      });

      it('returns correctly for only barely touching', () => {
        // Barely touching at end, horizontal
        const touchEndHorizontal = LineSegmentUtils.getCollision(
          {x0: 0, x1: 3, y0: 0, y1: 0},
          {x0: 3, x1: 4, y0: 0, y1: 0});
        expect(touchEndHorizontal).not.toBeNull();
        compare({isColinear:true,collisionStartAlongA:3,collisionLength:0}, touchEndHorizontal);

        // Inverted
        const touchEndHorizontalInverted = LineSegmentUtils.getCollision(
          {x0: 0, x1: 3, y0: 0, y1: 0},
          {x0: 4, x1: 3, y0: 0, y1: 0});
        expect(touchEndHorizontalInverted).not.toBeNull();
        compare(
          {isColinear:true,collisionStartAlongA:3,collisionLength:0}, touchEndHorizontalInverted);

        // At beginning of A
        const touchStart = LineSegmentUtils.getCollision(
          {x0: 0, x1: 3, y0: 0, y1: 0},
          {x0: -5, x1: 0, y0: 0, y1: 0});
        expect(touchStart).not.toBeNull();
        compare(
          {isColinear:true,collisionStartAlongA:0,collisionLength:0}, touchStart);
      });

      it('returns correctly for overlaps', () => {
        const overlapAtStart = LineSegmentUtils.getCollision(
          {x0: 0, x1: 3, y0: 0, y1: 0},
          {x0: -5, x1: 2, y0: 0, y1: 0});
        expect(overlapAtStart).not.toBeNull();
        compare(
          {isColinear:true,collisionStartAlongA:0,collisionLength:2}, overlapAtStart);

        const overlapAtEnd = LineSegmentUtils.getCollision(
          {x0: 0, x1: 3, y0: 0, y1: 0},
          {x0: 5, x1: 2, y0: 0, y1: 0});
        expect(overlapAtEnd).not.toBeNull();
        compare(
          {isColinear:true,collisionStartAlongA:2,collisionLength:1}, overlapAtEnd);

        const overlapInMiddle = LineSegmentUtils.getCollision(
          {x0: 0, x1: 8, y0: 0, y1: 0},
          {x0: 4, x1: 2, y0: 0, y1: 0});
        expect(overlapInMiddle).not.toBeNull();
        compare(
          {isColinear:true,collisionStartAlongA:2,collisionLength:2}, overlapInMiddle);

        const fullOverlap = LineSegmentUtils.getCollision(
          {x0: 0, x1: 3, y0: 0, y1: 0},
          {x0: -5, x1: 5, y0: 0, y1: 0});
        expect(fullOverlap).not.toBeNull();
        compare(
          {isColinear:true,collisionStartAlongA:0,collisionLength:3}, fullOverlap);
      });
    });
    it('rejects parallel but non-colinear inputs', () => {
      const parallelHorizontal = LineSegmentUtils.getCollision(
        {x0: 0, x1: 3, y0: 0, y1: 0},
        {x0: 0, x1: 3, y0: 1, y1: 1});
      expect(parallelHorizontal).toBeNull();
      const parallelHorizontalOffset = LineSegmentUtils.getCollision(
        {x0: 0, x1: 3, y0: 0, y1: 0},
        {x0: 4, x1: 7, y0: 1, y1: 1});
      expect(parallelHorizontalOffset).toBeNull();

      const parallelVertical = LineSegmentUtils.getCollision(
        {x0: 0, x1: 0, y0: 0, y1: 5},
        {x0: 1, x1: 1, y0: 0, y1: 5});
      expect(parallelVertical).toBeNull();
      const parallelVerticalOffset = LineSegmentUtils.getCollision(
        {x0: 0, x1: 0, y0: 0, y1: 5},
        {x0: 1, x1: 1, y0: 10, y1: 5});
      expect(parallelVerticalOffset).toBeNull();

      const parallelDiagonal = LineSegmentUtils.getCollision(
        {x0: 0, x1: 5, y0: 0, y1: 5},
        {x0: 0, x1: 5, y0: 1, y1: 6});
      expect(parallelDiagonal).toBeNull();
    });
    it('rejects uncolliding non-parallel lines', () => {
      const someLines = LineSegmentUtils.getCollision(
        {x0: 0, x1: 5, y0: 1, y1: 7},
        {x0: -3, x1: -5, y0: -6, y1: -1},);
      expect(someLines).toBeNull();
    });
    describe('non-parallel line collisions', () => {
      it('handles corners touching', () => {
        const cornerTouchStar = LineSegmentUtils.getCollision(
          {x0: 5, x1: 10, y0: 5, y1: 5},
          {x0: 5, x1: 5, y0: 5, y1: 10});
        expect(cornerTouchStar).not.toBeNull();
        compare({
          isColinear: false,
          angle: Math.PI / 2,
          depth: 5,
        }, cornerTouchStar);

        const cornerTouchEnd = LineSegmentUtils.getCollision(
          {x0: 0, x1: 5, y0: 5, y1: 5},
          {x0: 5, x1: 5, y0: 5, y1: 10});
        expect(cornerTouchEnd).not.toBeNull();
        compare({
          isColinear: false,
          angle: Math.PI / 2,
          depth: 0,
        }, cornerTouchEnd);
      });

      it('handles collisions', () => {
        const glancingCorner = LineSegmentUtils.getCollision(
          {x0: 0, x1: 5, y0: 4, y1: -1},
          {x0: 0, x1: 10, y0: 0, y1: 0});
        expect(glancingCorner).not.toBeNull();
        compare({
          isColinear: false,
          angle: Math.PI / 4,
          depth: 1,
        }, glancingCorner);
      });
    });
  });
});
