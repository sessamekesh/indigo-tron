/// <reference path="../../testutils/custommatchers.d.ts" />
import 'jasmine';

import { getBoxBoxCollision, getBoxLineCollision, getBoxPlaneCollision } from './collisiondetection';
import { TempGroupAllocator, LifecycleOwnedAllocator } from '@libutil/allocator';
import { vec2 } from 'gl-matrix';
import { CollisionBox } from './collisionbox';
import { CollisionPlane } from './collisionplane';
import { GLMatrixMatchers } from '@libgamemodel/../testutils/mathcompare';
import { CollisionLine } from './collisionline';

const createTempVec2Allocator = () => new TempGroupAllocator(vec2.create);
const createVec2Allocator = () => new LifecycleOwnedAllocator(vec2.create);

describe('Collision Detection', () => {
  beforeEach(() => {
    jasmine.addMatchers(GLMatrixMatchers);
  });

  // TODO (sessamekesh): getBoxBoxCollision and getBoxLineCollision tests (maybe)

  describe('getBoxPlaneCollision', () => {
    it('returns null on trivial no-collision', () => {
      const tempAlloc = createTempVec2Allocator();
      const alloc = createVec2Allocator();

      const box = CollisionBox.create(
        vec2.fromValues(0, 2),
        vec2.fromValues(1, 1),
        0, tempAlloc, alloc);
      const normal = alloc.get();
      vec2.set(normal.Value, 0, 1);
      const plane = new CollisionPlane(normal, 0);

      const collision = getBoxPlaneCollision(box, plane, tempAlloc, alloc);
      expect(collision).toBeNull();
    });

    it('gives proper collisions for basic collision', () => {
      const tempAlloc = createTempVec2Allocator();
      const alloc = createVec2Allocator();

      const box = CollisionBox.create(
        vec2.fromValues(0, 0.5),
        vec2.fromValues(1, 1),
        0, tempAlloc, alloc);
      const normal = alloc.get();
      vec2.set(normal.Value, 0, 1);
      const plane = new CollisionPlane(normal, 0);

      const collision = getBoxPlaneCollision(box, plane, tempAlloc, alloc);
      expect(collision).not.toBeNull();

      expect(collision!.length).toBe(2);

      const sortedCollisions =
        collision!.sort((a, b) => a.CollisionPoint.Value[0] - b.CollisionPoint.Value[0]);

      expect(sortedCollisions[0].CollisionDepth).toBeCloseTo(0.5);
      expect(sortedCollisions[1].CollisionDepth).toBeCloseTo(0.5);

      expect(sortedCollisions[0].CollisionNormal.Value).toAlmostEqualVec2(vec2.fromValues(0, 1));
      expect(sortedCollisions[1].CollisionNormal.Value).toAlmostEqualVec2(vec2.fromValues(0, 1));

      expect(sortedCollisions[0].CollisionPoint.Value).toAlmostEqualVec2(vec2.fromValues(-1, -0.5));
      expect(sortedCollisions[1].CollisionPoint.Value).toAlmostEqualVec2(vec2.fromValues(1, -0.5));
    });
  });

  it('gives proper collisions for rotated plane', () => {
    const tempAlloc = createTempVec2Allocator();
    const alloc = createVec2Allocator();

    const box = CollisionBox.create(
      vec2.fromValues(2, 2),
      vec2.fromValues(2, 2),
      0, tempAlloc, alloc);
    const normal = alloc.get();
    vec2.set(normal.Value, Math.sqrt(2) / 2, Math.sqrt(2) / 2);
    const plane = new CollisionPlane(normal, 1);

    const collision = getBoxPlaneCollision(box, plane, tempAlloc, alloc);

    expect(collision).not.toBeNull();
    expect(collision!.length).toBe(1);
    expect(collision![0].CollisionNormal.Value)
      .toAlmostEqualVec2(vec2.fromValues(Math.sqrt(2) / 2, Math.sqrt(2) / 2));
    expect(collision![0].CollisionPoint.Value).toAlmostEqualVec2(vec2.fromValues(0, 0));
    expect(collision?.length).toBe(1);
  });
});

describe('getBoxLineCollision', () => {
  beforeEach(() => {
    jasmine.addMatchers(GLMatrixMatchers);
  });

  it('returns null on trivial non-collision', () => {
    const tempAlloc = createTempVec2Allocator();
    const alloc = createVec2Allocator();

    const box = CollisionBox.create(
      vec2.fromValues(0, 2),
      vec2.fromValues(1, 1),
      0, tempAlloc, alloc);
    const pt1 = alloc.get();
    const pt2 = alloc.get();
    vec2.set(pt1.Value, -5, 0);
    vec2.set(pt2.Value, 5, 0);
    const line = new CollisionLine(pt1, pt2);

    const collision = getBoxLineCollision(box, line, tempAlloc, alloc);
    expect(collision).toBeNull();
  });

  it('returns null on colinear non-collision', () => {
    const tempAlloc = createTempVec2Allocator();
    const alloc = createVec2Allocator();

    const box = CollisionBox.create(
      vec2.fromValues(0, 0),
      vec2.fromValues(1, 1),
      0, tempAlloc, alloc);
    const pt1 = alloc.get();
    const pt2 = alloc.get();
    vec2.set(pt1.Value, 5, 0.5);
    vec2.set(pt2.Value, 10, 0.5);
    const line = new CollisionLine(pt1, pt2);

    const collision = getBoxLineCollision(box, line, tempAlloc, alloc);
    expect(collision).toBeNull();
  });
});
