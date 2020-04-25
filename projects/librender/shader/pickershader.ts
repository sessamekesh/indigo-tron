import { mat4 } from 'gl-matrix';
import { ShaderUtils } from './shaderutils';

const VS_TEXT = `#version 300 es
precision mediump float;

uniform mat4 matProj;
uniform mat4 matView;
uniform mat4 matWorld;

in vec3 pos;
in uint uuid;

out vec4 fColor;

vec4 unpackUnorm(uint n) {
  uint remaining = n;
  vec4 tr = vec4(0.0);
  for (int i = 0; i < 4; i++) {
    uint term = remaining % 255;
    remaining = remaining / 255;
    tr[i] = float(term)  / 255.0;
  }
  return tr;
}

void main() {
  fColor = unpackUnorm(uuid);
  gl_Position = matProj * matView * matWorld * vec4(pos, 1.0);
}`;

const FS_TEXT = `#version 300 es
precision mediump float;

in vec4 fColor;
out vec4 color;

void main() {
  color = fColor;
}`;

type Attribs = {
  Pos: number,
  Uuid: number,
};

type Uniforms = {
  MatProj: WebGLUniformLocation,
  MatView: WebGLUniformLocation,
  MatWorld: WebGLUniformLocation,
};

export type PickerShaderRenderCall = {
  Geo: null,
  MatWorld: mat4,
  MatView: mat4,
  MatProj: mat4,
};

export class PickerShader {
  private constructor(
    private program: WebGLProgram,
    private attribs: Attribs,
    private uniforms: Uniforms) {}

  static create(gl: WebGL2RenderingContext) {
    const program = ShaderUtils.createShaderFromSource(
      gl, 'pickerShader', VS_TEXT, FS_TEXT);
    if (!program) {
      return null;
    }

    const matWorld = gl.getUniformLocation(program, 'matWorld');
    const matView = gl.getUniformLocation(program, 'matView');
    const matProj = gl.getUniformLocation(program, 'matProj');
    if (!matWorld || !matView || !matProj) {
      console.error('Failed to get all uniform locations for pickerShader, aborting');
      return null;
    }

    const posAttrib = gl.getAttribLocation(program, 'pos');
    const uuidAttrib = gl.getAttribLocation(program, 'uuid');
    if (posAttrib < 0 || uuidAttrib < 0) {
      console.error('Failed to get all attribs for pickerShader, aborting');
      return null;
    }

    return new PickerShader(program, {
      Pos: posAttrib,
      Uuid: uuidAttrib,
    }, {
      MatWorld: matWorld,
      MatView: matView,
      MatProj: matProj,
    });
  }

  getAttribLocations(): Attribs {
    return {...this.attribs};
  }

  activate(gl: WebGL2RenderingContext) {
    gl.useProgram(this.program);
  }
}
