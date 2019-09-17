import { mat4, vec3 } from 'gl-matrix';

export type FrameSettings = {
  MatView: mat4,
  MatProj: mat4,
  LightDirection: vec3,
  LightColor: vec3,
  AmbientCoefficient: number,
};
