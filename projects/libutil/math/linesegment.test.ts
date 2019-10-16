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
          {x0: 0, x1: 1, y0: 0, y1: 0},
          {x0: 1, x1: 2, y0: 0, y1: 0});
        expect(touchEndHorizontal).not.toBeNull();
        compare({isColinear:true,collisionStartAlongA:1,collisionLength:0}, touchEndHorizontal);
      });
    });
  });
});
