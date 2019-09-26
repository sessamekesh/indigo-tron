import { glMatrix, vec3 } from 'gl-matrix';

export const BlendSpaceModelRotation = {
  rot: {
    angle: -glMatrix.toRadian(90),
    axis: vec3.fromValues(1, 0, 0),
  }
};

export const X_UNIT_DIR = vec3.fromValues(1, 0, 0);
export const Y_UNIT_DIR = vec3.fromValues(0, 1, 0);
export const Z_UNIT_DIR = vec3.fromValues(0, 0, 1);
