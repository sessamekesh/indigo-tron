import { SceneGraph2Module } from '../scenenode2module';
import { SceneNode2 } from '../scenenode2';
import { Mat4TransformAddon } from './mat4transformaddon';
import { mat4, vec3, quat } from 'gl-matrix';
import { LifecycleOwnedAllocator, TempGroupAllocator } from '@libutil/allocator';

export class Mat4TransformModule extends SceneGraph2Module {
  constructor(
      private mat4Allocator: LifecycleOwnedAllocator<mat4>,
      private vec3Allocator: LifecycleOwnedAllocator<vec3>,
      private tempMat4: TempGroupAllocator<mat4>,
      private tempQuat: TempGroupAllocator<quat>) {
    super();
  }

  __extendSceneNode(sceneNode: SceneNode2) {
    sceneNode.setAddon(
      Mat4TransformAddon,
      new Mat4TransformAddon(
        sceneNode, this.mat4Allocator, this.vec3Allocator, this.tempMat4, this.tempQuat));
  }

  getMat4Transform(sceneNode: SceneNode2) {
    return sceneNode.getAddon(Mat4TransformAddon);
  }
}
