import { mat4 } from 'gl-matrix';
import { ShaderUtils } from './shaderutils';
import { TriangleGeo } from '@librender/geo/trianglegeo';

/**
 * DEMO shader, not very useful and should be removed promptly when implementing the game!
 */
const VS_TEXT = `#version 300 es
precision mediump float;
uniform mat4 matPerspectiveProjection;
uniform mat4 matCamera;
uniform mat4 matWorld;
in vec3 pos;
in vec3 color;
out vec3 fColor;
void main() {
  fColor = color;
  gl_Position = matPerspectiveProjection * matCamera * matWorld * vec4(pos, 1.0);
}`;

const FS_TEXT = `#version 300 es
precision mediump float;
in vec3 fColor;
out vec4 color;
void main() {
  color = vec4(fColor, 1.0);
}`;

type Attribs = {
  Pos: number,
  Color: number,
};

type Uniforms = {
  MatPerspectiveProjection: WebGLUniformLocation,
  MatCamera: WebGLUniformLocation,
  MatWorld: WebGLUniformLocation,
};

export type TriangleShaderCall = {
  Geo: TriangleGeo,
  NumVertices: number,

  MatWorld: mat4,
  MatCamera: mat4,
  MatProj: mat4,
};

export class TriangleShader {
  private constructor(
    private program: WebGLProgram,
    private attribs: Attribs,
    private uniforms: Uniforms) {}

  static create(gl: WebGL2RenderingContext): TriangleShader|null {
    const program = ShaderUtils.createShaderFromSource(gl, 'triangleShader', VS_TEXT, FS_TEXT);
    if (!program) {
      return null;
    }

    const matWorld = gl.getUniformLocation(program, 'matWorld');
    const matView = gl.getUniformLocation(program, 'matCamera');
    const matProj = gl.getUniformLocation(program, 'matPerspectiveProjection');
    if (!matWorld || !matView || !matProj) {
      console.error('Failed to get all uniform locations for triangle program, aborting');
      return null;
    }

    const posAttrib = gl.getAttribLocation(program, 'pos');
    const colorAttrib = gl.getAttribLocation(program, 'color');
    if (posAttrib < 0 || colorAttrib < 0) {
      console.error('Failed to get all attributes for triangle program, aborting');
      return null;
    }

    return new TriangleShader(program, {
      Pos: posAttrib,
      Color: colorAttrib,
    }, {
      MatCamera: matView,
      MatPerspectiveProjection: matProj,
      MatWorld: matWorld,
    });
  }

  getAttribLocations(): Attribs {
    return {
      Color: this.attribs.Color,
      Pos: this.attribs.Pos,
    };
  }

  activate(gl: WebGLRenderingContext) {
    gl.useProgram(this.program);
  }

  render(gl: WebGL2RenderingContext, call: TriangleShaderCall) {
    gl.bindVertexArray(call.Geo.getVAO());
    gl.uniformMatrix4fv(this.uniforms.MatWorld, false, call.MatWorld);
    gl.uniformMatrix4fv(this.uniforms.MatCamera, false, call.MatCamera);
    gl.uniformMatrix4fv(this.uniforms.MatPerspectiveProjection, false, call.MatProj);
    gl.drawArrays(gl.TRIANGLES, 0, call.NumVertices);
  }
}
