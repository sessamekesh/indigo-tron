import { vec3, mat4 } from 'gl-matrix';

export interface Camera {
  pos(o: vec3): void;
  lookAt(o: vec3): void;
  up(o: vec3): void;
  matView(o: mat4): void;
}
