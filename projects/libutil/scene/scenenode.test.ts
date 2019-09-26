/// <reference path="../../testutils/custommatchers.d.ts"/>

import { TempGroupAllocator } from "@libutil/allocator";
import { mat4, quat, vec3, glMatrix } from 'gl-matrix';
import { SceneNode } from './scenenode';
import { GLMatrixMatchers } from '@testutils/mathcompare';

// The top-level "describe" statement should encapsulate the class
//  that is being tested - in this case, SceneNode.
describe('SceneNode', () => {
  beforeEach(() => {
    jasmine.addMatchers(GLMatrixMatchers);
  })

  function getSetupObjects() {
    const mat4Allocator = new TempGroupAllocator(mat4.create);
    const quatAllocator = new TempGroupAllocator(quat.create);
    const vec3Allocator = new TempGroupAllocator(vec3.create);

    return { mat4Allocator, quatAllocator, vec3Allocator };
  }

  // If needed, tests can be further divided into sub-groups. In this case,
  //  it is useful to test scene nodes both as isolated entities (thin
  //  wrappers around a transformation mat4) and as members of a scene
  //  graph (nodes with a parent and/or children).
  // Generally, sub-groups should not be necessary for unit tests, though
  //  complex classes like this one may call for it.
  describe('isolated scene node', () => {
    // Default states are always good to verify!
    it('creates identity scene node by default', () => {
      const {mat4Allocator, quatAllocator, vec3Allocator} = getSetupObjects();
      const defaultNode = new SceneNode(mat4Allocator, quatAllocator);
      mat4Allocator.get(2, (expected, actual) => {
        mat4.identity(expected);
        defaultNode.getMatWorld(actual);
        expect(actual).toAlmostEqualMat4(expected);
      });

      vec3Allocator.get(2, (expected, actual) => {
        vec3.set(expected, 0, 0, 0);
        defaultNode.getPos(actual);
        expect(actual).toAlmostEqualVec3(expected);
      });
    });

    // Non-default states are good to test too. In this case, I think only
    //  one non-default test case is good enough. Adding more to test all
    //  permutations of default and non-default arguments would not add much
    //  value in my opinion.
    it('creates transform with given arguments', () => {
      const {mat4Allocator, quatAllocator, vec3Allocator} = getSetupObjects();
      vec3Allocator.get(3, (pos, scl, axis) => {
        quatAllocator.get(1, (rot) => {
          mat4Allocator.get(2, (expected, actual) => {
            vec3.set(pos, 1, 2, 3);
            vec3.set(scl, 4, 5, 6);
            vec3.set(axis, 0, 0, 1);
            const angle = glMatrix.toRadian(87.5);
            quat.setAxisAngle(rot, axis, angle);
            mat4.fromRotationTranslationScale(expected, rot, pos, scl);

            const sceneNode = new SceneNode(mat4Allocator, quatAllocator, {
              pos,
              rot: {
                axis: axis,
                angle,
              },
              scl,
            });
            sceneNode.getMatWorld(actual);

            expect(actual).toAlmostEqualMat4(expected);
          });
        });
      });
    });

    // Generally, only the public API of a class should be tested.
    // Sometimes, an implementation detail is sufficiently important that
    //  it should be tested. In this case, the detail is that modifying
    //  one of the inputs used to create a scene node should not cause the
    //  scene node to change its value.
    // Writing a test like this prevents a future well-intentioned but
    //  at least partially clueless developer (possibly the original
    //  author!) from making a seemingly innocuous change that breaks the
    //  tested code in subtle ways.
    it('copies initial values (does not use originals)', () => {
      const pos = vec3.fromValues(1, 2, 3);
      const axis = vec3.fromValues(0, 0, 1);
      const angle = 1;
      const scl = vec3.fromValues(2, 2, 2);
      const rot = quat.create();
      quat.setAxisAngle(rot, axis, angle);

      const {mat4Allocator, quatAllocator} = getSetupObjects();
      const sceneNode = new SceneNode(mat4Allocator, quatAllocator, {
        pos, rot: { axis, angle }, scl
      });
      const expected = mat4.create();
      const actual = mat4.create();
      mat4.fromRotationTranslationScale(expected, rot, pos, scl);

      vec3.set(pos, 555, 213, 879);
      vec3.set(scl, 123, 324, 536);
      vec3.set(axis, 0, 1, 0);
      const newAngle = 2;
      quat.setAxisAngle(rot, axis, newAngle);

      sceneNode.getMatWorld(actual);
      expect(actual).toAlmostEqualMat4(expected);
    });
  });

  describe('scene graph', () => {
    it('parent/child transforms generate correct values', () => {
      const {mat4Allocator, quatAllocator} = getSetupObjects();
      const parent = new SceneNode(mat4Allocator, quatAllocator, {
        pos: vec3.fromValues(1, 1, 1),
        rot: {
          angle: glMatrix.toRadian(45),
          axis: vec3.fromValues(0, 1, 0),
        },
      });
      const fwdTranslation = new SceneNode(mat4Allocator, quatAllocator, { pos: vec3.fromValues(0, 0, 1)});
      const rightTranslation = new SceneNode(mat4Allocator, quatAllocator, { pos: vec3.fromValues(1, 0, 0)});

      const fwdFwdTranslation = new SceneNode(mat4Allocator, quatAllocator, { pos: vec3.fromValues(0, 0, 3)});

      const actual = vec3.create();

      parent.getPos(actual);
      expect(actual).toAlmostEqualVec3(vec3.fromValues(1, 1, 1));

      fwdTranslation.getPos(actual);
      expect(actual).toAlmostEqualVec3(vec3.fromValues(0, 0, 1));

      rightTranslation.getPos(actual);
      expect(actual).toAlmostEqualVec3(vec3.fromValues(1, 0, 0));

      fwdFwdTranslation.getPos(actual);
      expect(actual).toAlmostEqualVec3(vec3.fromValues(0, 0, 3));

      fwdTranslation.attachToParent(parent);
      rightTranslation.attachToParent(parent);
      fwdFwdTranslation.attachToParent(fwdTranslation);

      fwdTranslation.getPos(actual);
      expect(actual).toAlmostEqualVec3(vec3.fromValues(1.707, 1, 1.707));

      rightTranslation.getPos(actual);
      expect(actual).toAlmostEqualVec3(vec3.fromValues(1.707, 1, 0.293));

      fwdFwdTranslation.getPos(actual);
      expect(actual).toAlmostEqualVec3(vec3.fromValues(3.8284, 1, 3.8284));

      fwdFwdTranslation.detach();
      fwdFwdTranslation.getPos(actual);
      expect(actual).toAlmostEqualVec3(vec3.fromValues(0, 0, 3));
    });

    it('causes position of child to change on parent update', () => {
      const {mat4Allocator, quatAllocator} = getSetupObjects();
      const parent = new SceneNode(mat4Allocator, quatAllocator, {
        pos: vec3.fromValues(1, 1, 1),
        rot: {
          angle: glMatrix.toRadian(45),
          axis: vec3.fromValues(0, 1, 0),
        },
      });
      const fwdTranslation = new SceneNode(mat4Allocator, quatAllocator, { pos: vec3.fromValues(0, 0, 1)});
      fwdTranslation.attachToParent(parent);

      const actual = vec3.create();
      parent.getPos(actual);
      expect(actual).toAlmostEqualVec3(vec3.fromValues(1, 1, 1));

      fwdTranslation.getPos(actual);
      expect(actual).toAlmostEqualVec3(vec3.fromValues(1.707, 1, 1.707));

      parent.update({ pos: vec3.fromValues(1, 2, 1), rot: { angle: glMatrix.toRadian(90) }});
      parent.getPos(actual);
      expect(actual).toAlmostEqualVec3(vec3.fromValues(1, 2, 1));

      fwdTranslation.getPos(actual);
      expect(actual).toAlmostEqualVec3(vec3.fromValues(2, 2, 1));
    });
  });
});
