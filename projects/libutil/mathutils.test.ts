/// <reference path="../testutils/custommatchers.d.ts" />

import 'jasmine';
import { GLMatrixMatchers } from '@testutils/mathcompare';
import { TempGroupAllocator } from 'allocator';
import { vec2, glMatrix } from 'gl-matrix';
import { MathUtils } from 'mathutils';

const createVec2Allocator = () => new TempGroupAllocator(vec2.create);

describe('MathUtils', () => {
  beforeEach(() => {
    jasmine.addMatchers(GLMatrixMatchers);
  });

  describe('nudgeToDistance2', () => {
    it('no-op for properly separated points', () => {
      const tempVec2 = createVec2Allocator();

      const o = vec2.create();
      const originPos = vec2.fromValues(0, 0);
      const inputPos = vec2.fromValues(1, 0);
      MathUtils.nudgeToDistance2(o, originPos, inputPos, 1, tempVec2);

      expect(o).toAlmostEqualVec2(inputPos);
    });

    it('pushes slightly off-center vector forwards', () => {
      const tempVec2 = createVec2Allocator();

      const o = vec2.create();
      const originPos = vec2.fromValues(0, 0);
      const direction = vec2.normalize(vec2.create(), vec2.fromValues(5, 1));
      const justRight = vec2.scaleAndAdd(vec2.create(), originPos, direction, 5);
      const tooClose = vec2.scaleAndAdd(vec2.create(), originPos, direction, 4.5);
      const tooFar = vec2.scaleAndAdd(vec2.create(), originPos, direction, 5.5);

      MathUtils.nudgeToDistance2(o, originPos, tooClose, 5, tempVec2);
      expect(o).toAlmostEqualVec2(justRight);

      MathUtils.nudgeToDistance2(o, originPos, tooFar, 5, tempVec2);
      expect(o).toAlmostEqualVec2(justRight);
    });
  });

  describe('invTransformVec2', () => {
    it('no-op for zero op', () => {
      const tempVec2 = createVec2Allocator();
      const o = vec2.create();
      const originPos = vec2.fromValues(0, 0);
      const point = vec2.fromValues(1, 0);

      MathUtils.invTransformVec2(o, point, originPos, 0, tempVec2);
      expect(o).toAlmostEqualVec2(vec2.fromValues(1, 0));
    });

    it('handles non-origin translation', () => {
      const tempVec2 = createVec2Allocator();

      const o = vec2.create();
      const originPos = vec2.fromValues(-5, -3);
      const inputPos = vec2.fromValues(1, 2);

      MathUtils.invTransformVec2(o, inputPos, originPos, 0, tempVec2);
      expect(o).toAlmostEqualVec2(vec2.fromValues(6, 5));
    });

    it('handles origin rotation', () => {
      const tempVec2 = createVec2Allocator();

      const o = vec2.create();
      const originPos = vec2.fromValues(0, 0);
      const originalPoint = vec2.fromValues(1, 0);
      const rotatedPoint = vec2.create();
      const rotation = glMatrix.toRadian(45);

      vec2.rotate(rotatedPoint, originalPoint, originPos, rotation);

      MathUtils.invTransformVec2(o, rotatedPoint, originPos, rotation, tempVec2);
      expect(o).toAlmostEqualVec2(vec2.fromValues(1, 0));
    });

    it('handles both rotation and translation', () => {
      const tempVec2 = createVec2Allocator();

      const o = vec2.create();
      const originPos = vec2.fromValues(2, 3);
      const otherPos = vec2.fromValues(1, -1);

      MathUtils.invTransformVec2(o, otherPos, originPos, glMatrix.toRadian(45), tempVec2);
      expect(o).toAlmostEqualVec2(vec2.fromValues(-3.535534, -2.12132025));

    });
  });

  describe('transformVec2', () => {
    // A little bit of a hack - if the above works, we can leverage it. This is bad testing practice
    it('properly translates', () => {
      const tempVec2 = createVec2Allocator();

      const o = vec2.create();
      const intermediatePoint = vec2.create();
      const originPos = vec2.fromValues(2, 3);
      const otherPos = vec2.fromValues(1, -1);
      const rotation = glMatrix.toRadian(12);

      MathUtils.invTransformVec2(intermediatePoint, otherPos, originPos, rotation, tempVec2);
      MathUtils.transformVec2(o, intermediatePoint, originPos, rotation, tempVec2);
      expect(o).toAlmostEqualVec2(vec2.fromValues(1, -1));
    });
  });

  describe('getProjectionOnLine', () => {
    it('works on a horizontal line', () => {
      expect(
        MathUtils.getProjectionOnLine(
          vec2.fromValues(2, 5),
          vec2.fromValues(-1, 0),
          vec2.fromValues(2, 0),
          createVec2Allocator()))
        .toEqual(1.0);
    });
  });
});
