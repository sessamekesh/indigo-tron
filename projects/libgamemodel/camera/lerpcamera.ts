import { Camera } from "./camera";
import { vec3, mat4 } from "gl-matrix";
import { TempGroupAllocator } from "@libutil/allocator";

export class LerpCamera implements Camera {
  private timeRemaining = this.lerpTime;
  constructor(
    private oldCamera: Camera,
    private newCamera: Camera,
    private lerpTime: number,
    private vec3Allocator: TempGroupAllocator<vec3>) {}

  tick(dt: number) {
    this.timeRemaining -= dt;
  }

  isFinished() {
    return this.timeRemaining <= 0;
  }

  pos(o: vec3): void {
    const t = 1 - (this.timeRemaining / this.lerpTime);
    if (t >= 1) return this.newCamera.pos(o);
    if (t <= 0) return this.oldCamera.pos(o);
    return this.vec3Allocator.get(2, (oldPos, newPos) => {
      this.oldCamera.pos(oldPos);
      this.newCamera.pos(newPos);
      vec3.lerp(o, oldPos, newPos, t);
    });
  }
  lookAt(o: vec3): void {
    const t = 1 - (this.timeRemaining / this.lerpTime);
    if (t >= 1) return this.newCamera.lookAt(o);
    if (t <= 0) return this.oldCamera.lookAt(o);
    return this.vec3Allocator.get(2, (oldLA, newLA) => {
      this.oldCamera.lookAt(oldLA);
      this.newCamera.lookAt(newLA);
      vec3.lerp(o, oldLA, newLA, t);
    });
  }
  up(o: vec3): void {
    const t = 1 - (this.timeRemaining / this.lerpTime);
    if (t >= 1) return this.newCamera.up(o);
    if (t <= 0) return this.oldCamera.up(o);
    return this.vec3Allocator.get(2, (oldUp, newUp) => {
      this.oldCamera.up(oldUp);
      this.newCamera.up(newUp);
      vec3.lerp(o, oldUp, newUp, t);
    });
  }
  matView(o: mat4): void {
    this.vec3Allocator.get(3, (pos, lookAt, up) => {
      this.pos(pos);
      this.lookAt(lookAt);
      this.up(up);
      mat4.lookAt(o, pos, lookAt, up);
    });
  }
}
