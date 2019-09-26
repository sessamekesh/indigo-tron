import { SceneNodeCreationOptions, SceneNode } from './scenenode';
import { TempGroupAllocator } from '@libutil/allocator';
import { mat4, quat } from 'gl-matrix';
import { BlendSpaceModelRotation } from '@libutil/helpfulconstants';

/**
 * Utility class for constructing scene nodes - some of the parameters to a scene
 *  node are reasonably consistent between all scene nodes in an application (or
 *  module), so they can be constructed with only a config if the allocators are
 *  known ahead of time.
 */
export class SceneNodeFactory {
  constructor(
    private mat4Allocator: TempGroupAllocator<mat4>,
    private quatAllocator: TempGroupAllocator<quat>) {}

  createSceneNode(sceneNodeConfig: SceneNodeCreationOptions = {}) {
    return new SceneNode(this.mat4Allocator, this.quatAllocator, sceneNodeConfig);
  }

  createLoadedModelRotationSceneNode() {
    return new SceneNode(this.mat4Allocator, this.quatAllocator, BlendSpaceModelRotation);
  }
}
