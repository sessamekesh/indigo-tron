import { vec3, quat, mat4 } from 'gl-matrix';
import { TempGroupAllocator } from '@libutil/allocator';

export interface SceneNodeCreationOptions {
  pos?: vec3;
  rot?: {
    axis: vec3;
    angle: number;
  };
  scl?: vec3;
};

export class SceneNode {
  private selfTransform_ = mat4.create();
  private isSelfDirty_ = true;
  private worldTransform_ = mat4.create();
  private isWorldDirty_ = true;
  private parent: SceneNode|null = null;
  private children: SceneNode[] = [];

  private pos_ = vec3.create();
  private rotAxis_ = vec3.fromValues(0, 1, 0);
  private rotAngle_  = 0;
  private scl_ = vec3.fromValues(1, 1, 1);

  constructor(
      private mat4Allocator: TempGroupAllocator<mat4>,
      private quatAllocator: TempGroupAllocator<quat>,
      createOptions?: SceneNodeCreationOptions) {
    createOptions = createOptions || {};
    if (createOptions.pos) {
      vec3.copy(this.pos_, createOptions.pos);
    }
    if (createOptions.rot) {
      vec3.copy(this.rotAxis_, createOptions.rot.axis);
      this.rotAngle_ = createOptions.rot.angle;
    }
    if (createOptions.scl) {
      vec3.copy(this.scl_, createOptions.scl);
    }
  }

  update(valsToUpdate: {
    pos?: vec3,
    rot?: {
      axis?: vec3,
      angle?: number,
    },
    scl?: vec3,
  }) {
    let isDirty = false;
    if (valsToUpdate.pos) {
      vec3.copy(this.pos_, valsToUpdate.pos);
      isDirty = true;
    }
    if (valsToUpdate.rot && valsToUpdate.rot.axis) {
      vec3.copy(this.rotAxis_, valsToUpdate.rot.axis);
      isDirty = true;
    }
    if (valsToUpdate.rot && valsToUpdate.rot.angle != null) {
      this.rotAngle_ = valsToUpdate.rot.angle;
      isDirty = true;
    }
    if (valsToUpdate.scl) {
      vec3.copy(this.scl_, valsToUpdate.scl);
      isDirty = true;
    }

    if (isDirty) {
      this.isSelfDirty_ = true;
      for (let i = 0; i < this.children.length; i++) {
        this.children[i].dirty();
      }
    }
  }

  copyFrom(sceneNode: SceneNode) {
    vec3.copy(this.pos_, sceneNode.pos_);
    vec3.copy(this.rotAxis_, sceneNode.rotAxis_);
    this.rotAngle_ = sceneNode.rotAngle_;
    vec3.copy(this.scl_, sceneNode.scl_);
    this.isSelfDirty_ = true;
    for (let i = 0; i < this.children.length; i++) {
      this.children[i].dirty();
    }
  }

  getPos(o: vec3) {
    this.mat4Allocator.get(1, (matWorld) => {
      this.getMatWorld(matWorld);
      mat4.getTranslation(o, matWorld);
    });
  }

  getMatWorld(o: mat4) {
    if (this.isSelfDirty_ || this.isWorldDirty_) {
      this.generateWorldTransform();
    }
    mat4.copy(o, this.worldTransform_);
  }

  attachToParent(parent: SceneNode) {
    this.parent = parent;
    parent.registerChild(this);
    this.isWorldDirty_ = true;
    this.dirty();
  }

  detach() {
    if (this.parent) {
      this.parent.unregisterChild(this);
      this.parent = null;
      this.isWorldDirty_ = true;
      this.dirty();
    }
  }

  private registerChild(child: SceneNode) {
    this.children.push(child);
  }

  private unregisterChild(child: SceneNode) {
    this.children = this.children.filter(c => c !== child);
  }

  private dirty() {
    this.isWorldDirty_ = true;
    for (let i = 0; i < this.children.length; i++) {
      this.children[i].dirty();
    }
  }

  private generateWorldTransform() {
    if (this.isSelfDirty_) {
      this.generateSelfTransform();
    }

    if (!this.parent) {
      mat4.copy(this.worldTransform_, this.selfTransform_);
      this.isWorldDirty_ = false;
      return;
    }

    this.mat4Allocator.get(1, (m) => {
      this.parent!.getMatWorld(m);
      mat4.mul(this.worldTransform_, m, this.selfTransform_);
      this.isWorldDirty_ = false;
    });
  }

  private generateSelfTransform() {
    this.quatAllocator.get(1, (q) => {
      quat.setAxisAngle(q, this.rotAxis_, this.rotAngle_);
      mat4.fromRotationTranslationScale(this.selfTransform_, q, this.pos_, this.scl_);
      this.isWorldDirty_ = true;
      this.isSelfDirty_ = false;
    });
  }
}
