import { FlatColorLambertGeo } from '@librender/geo/flatcolorlambertgeo';
import { mat4, vec3 } from 'gl-matrix';
import { ShaderUtils } from './shaderutils';
import { IBDescBitWidthToType } from '@librender/geo/ibdesc';

const VS_TEXT = `#version 300 es
precision mediump float;

uniform mat4 matProj;
uniform mat4 matView;
uniform mat4 matWorld;

in vec3 pos;
in vec3 normal;
in vec4 color;

out vec3 fNormal;
out vec4 fColor;

void main() {
  fNormal = (matWorld * vec4(normal, 0.0)).xyz;
  fColor = color;
  gl_Position = matProj * matView * matWorld * vec4(pos, 1.0);
}`;

const FS_TEXT = `#version 300 es
precision mediump float;

uniform vec3 lightColor;
uniform vec3 lightDirection;
uniform float ambientCoefficient;

in vec3 fNormal;
in vec4 fColor;

out vec4 color;

void main() {
  vec4 surfaceColor = fColor;
  float rawDiffuseCoefficient = -dot(fNormal, lightDirection);
  float colorPower = ambientCoefficient + (rawDiffuseCoefficient * (1.0 - ambientCoefficient));

  color = vec4(colorPower * surfaceColor.rgb * lightColor, surfaceColor.a);
}`;

type Attribs = {
  Pos: number,
  Normal: number,
  Color: number,
};

type Uniforms = {
  MatProj: WebGLUniformLocation,
  MatView: WebGLUniformLocation,
  MatWorld: WebGLUniformLocation,

  //SurfaceColor: WebGLUniformLocation,
  LightColor: WebGLUniformLocation,
  LightDirection: WebGLUniformLocation,
  AmbientCoefficient: WebGLUniformLocation,
};

export type FlatColorLambertRenderCall = {
  Geo: FlatColorLambertGeo,
  MatWorld: mat4,
  MatView: mat4,
  MatProj: mat4,
  LightColor: vec3,
  LightDirection: vec3,
  AmbientCoefficient: number,
};

export class FlatColorLambertShader {
  private constructor(
    private program: WebGLProgram,
    private attribs: Attribs,
    private uniforms: Uniforms) {}

  static create(gl: WebGL2RenderingContext): FlatColorLambertShader|null {
    const program = ShaderUtils.createShaderFromSource(
      gl, 'flatColorLambertShader', VS_TEXT, FS_TEXT);
    if (!program) {
      return null;
    }

    const matWorld = gl.getUniformLocation(program, 'matWorld');
    const matView = gl.getUniformLocation(program, 'matView');
    const matProj = gl.getUniformLocation(program, 'matProj');
    const lightColor = gl.getUniformLocation(program, 'lightColor');
    const lightDirection = gl.getUniformLocation(program, 'lightDirection');
    const ambientCoefficient = gl.getUniformLocation(program, 'ambientCoefficient');
    if (!matWorld || !matView || !matProj
        || !lightColor || !lightDirection || !ambientCoefficient) {
      console.error('Failed to get all uniform locations for flatColorLambertShader, aborting');
      return null;
    }

    const posAttrib = gl.getAttribLocation(program, 'pos');
    const normalAttrib = gl.getAttribLocation(program, 'normal');
    const colorAttrib = gl.getAttribLocation(program, 'color');
    if (posAttrib < 0 || normalAttrib < 0 || colorAttrib < 0) {
      console.error('Failed to get all attribs for flatColorLambertShader, aborting');
      return null;
    }

    return new FlatColorLambertShader(program, {
      Pos: posAttrib,
      Normal: normalAttrib,
      Color: colorAttrib,
    }, {
      MatWorld: matWorld,
      MatView: matView,
      MatProj: matProj,
      AmbientCoefficient: ambientCoefficient,
      LightColor: lightColor,
      LightDirection: lightDirection,
    });
  }

  getAttribLocations(): Attribs {
    return {...this.attribs};
  }

  activate(gl: WebGL2RenderingContext) {
    gl.useProgram(this.program);
  }

  render(gl: WebGL2RenderingContext, call: FlatColorLambertRenderCall) {
    gl.bindVertexArray(call.Geo.vao);
    gl.uniformMatrix4fv(this.uniforms.MatProj, false, call.MatProj);
    gl.uniformMatrix4fv(this.uniforms.MatView, false, call.MatView);
    gl.uniformMatrix4fv(this.uniforms.MatWorld, false, call.MatWorld);
    gl.uniform3fv(this.uniforms.LightColor, call.LightColor);
    gl.uniform3fv(this.uniforms.LightDirection, call.LightDirection);
    gl.uniform1f(this.uniforms.AmbientCoefficient, call.AmbientCoefficient);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, call.Geo.ib);
    gl.drawElements(
      gl.TRIANGLES, call.Geo.numIndices,
      IBDescBitWidthToType[call.Geo.ibDesc.BitWidth], 0);
  }
}
