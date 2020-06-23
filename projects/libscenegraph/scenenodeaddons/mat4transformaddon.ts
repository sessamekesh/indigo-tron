import { SceneNode2Addon } from '../scenenode2addon';
import { mat4, vec3, quat } from 'gl-matrix';
import { SceneNode2 } from '../scenenode2';
import { LifecycleOwnedAllocator, OwnedResource, TempGroupAllocator } from '@libutil/allocator';

export interface SceneNodeUpdateOptions {
  pos?: vec3;
  rot?: {
    axis?: vec3;
    angle?: number;
  };
  scl?: vec3;
};


export class Mat4TransformAddon extends SceneNode2Addon {
  private selfTransform_: OwnedResource<mat4>;
  private worldTransform_: OwnedResource<mat4>

  private isSelfDirty_ = true;
  private isWorldDirty_ = true;
  private pos_: OwnedResource<vec3>;
  private rotAxis_: OwnedResource<vec3>;
  private scl_: OwnedResource<vec3>;
  private rotAngle_ = 0;

  constructor(
      sceneNode: SceneNode2,
      mat4Allocator: LifecycleOwnedAllocator<mat4>,
      vec3Allocator: LifecycleOwnedAllocator<vec3>,
      private tempMat4: TempGroupAllocator<mat4>,
      private tempQuat: TempGroupAllocator<quat>) {
    super(sceneNode);
    this.selfTransform_ = mat4Allocator.get();
    mat4.identity(this.selfTransform_.Value);
    this.worldTransform_ = mat4Allocator.get();
    mat4.identity(this.selfTransform_.Value);

    this.pos_ = vec3Allocator.get();
    vec3.set(this.pos_.Value, 0, 0, 0);
    this.rotAxis_ = vec3Allocator.get();
    vec3.set(this.rotAxis_.Value, 1, 0, 0);
    this.scl_ = vec3Allocator.get();
    vec3.set(this.scl_.Value, 1, 1, 1);
  }

  cleanup() {
    this.selfTransform_.ReleaseFn();
    this.worldTransform_.ReleaseFn();
    this.pos_.ReleaseFn();
    this.scl_.ReleaseFn();
    this.rotAxis_.ReleaseFn();
  }

  update(valsToUpdate: SceneNodeUpdateOptions) {
    let isDirty = false;
    if (valsToUpdate.pos) {
      vec3.copy(this.pos_.Value, valsToUpdate.pos);
      isDirty = true;
    }
    if (valsToUpdate.rot?.angle) {
      this.rotAngle_ = valsToUpdate.rot.angle;
      isDirty = true;
    }
    if (valsToUpdate.rot?.axis) {
      vec3.copy(this.rotAxis_.Value, valsToUpdate.rot.axis);
      isDirty = true;
    }
    if (valsToUpdate.scl) {
      vec3.copy(this.scl_.Value, valsToUpdate.scl);
      isDirty = true;
    }

    if (isDirty) {
      this.dirtySelf();
    }
  }

  private dirtySelf() {
    this.isSelfDirty_ = true;
    this.dirtyWorld();
  }

  private dirtyWorld() {
    this.isWorldDirty_ = true;
    this.sceneNode.onEachChild(child => child.getAddonOpt(Mat4TransformAddon)?.dirtyWorld());
  }

  onChangeParent(oldParent: SceneNode2|null, newParent: SceneNode2|null) {
    if (oldParent !== newParent) {
      this.dirtyWorld();
    }
  }

  private generateSelfTransform() {
    this.tempQuat.get(1, q => {
      quat.setAxisAngle(q, this.rotAxis_.Value, this.rotAngle_);
      mat4.fromRotationTranslationScale(
        this.selfTransform_.Value, q, this.pos_.Value, this.scl_.Value);
      this.isSelfDirty_ = false;
    });
  }

  private generateWorldTransform() {
    if (this.isSelfDirty_) {
      this.generateSelfTransform();
    }

    const parentAddon = this.sceneNode.getParent()?.getAddon(Mat4TransformAddon);
    if (!parentAddon) {
      mat4.copy(this.worldTransform_.Value, this.selfTransform_.Value);
      this.isWorldDirty_ = false;
      return;
    }

    this.tempMat4.get(1, m => {
      parentAddon.getMatWorld(m);
      mat4.mul(this.worldTransform_.Value, m, this.selfTransform_.Value);
      this.isWorldDirty_ = false;
    });
  }

  getMatWorld(o: mat4) {
    if (this.isWorldDirty_) {
      this.generateWorldTransform();
    }
    mat4.copy(o, this.worldTransform_.Value);
  }

  getSelfRotAngle() {
    return this.rotAngle_;
  }

  getPos(o: vec3) {
    this.tempMat4.get(1, matWorld => {
      this.getMatWorld(matWorld);
      mat4.getTranslation(o, matWorld);
    });
  }

  onAddChild(child: SceneNode2) {
    child.getAddonOpt(Mat4TransformAddon)?.dirtyWorld();
  }

  onRemoveChild(child: SceneNode2) {}
}
