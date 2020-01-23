import { vec3, mat4 } from 'gl-matrix';
import { Camera } from './camera';

export class BasicCamera implements Camera {
  private pos_ = vec3.create();
  private lookAt_ = vec3.create();
  private up_ = vec3.create();
  private diry_ = true;
  private matView_ = mat4.create();

  constructor(
      pos: vec3,
      lookAt: vec3,
      up: vec3) {
    vec3.copy(this.pos_, pos);
    vec3.copy(this.lookAt_, lookAt);
    vec3.copy(this.up_, up);
  }

  pos(o: vec3) {
    vec3.copy(o, this.pos_);
  }

  lookAt(o: vec3) {
    vec3.copy(o, this.lookAt_);
  }

  up(o: vec3) {
    vec3.copy(o, this.up_);
  }

  setPos(pos: vec3) {
    vec3.copy(this.pos_, pos);
    this.diry_ = true;
  }

  setLookAt(lookAt: vec3) {
    vec3.copy(this.lookAt_, lookAt);
    if (this.lookAt_[0] == 0 && this.lookAt_[1] == -1 && this.lookAt_[2] == 0) {
      throw new Error('bad case?');
    }
    this.diry_ = true;
  }

  matView(o: mat4) {
    if (this.diry_) {
      mat4.lookAt(this.matView_, this.pos_, this.lookAt_, this.up_);
      this.diry_ = false;
    }
    mat4.copy(o, this.matView_);
  }
}
