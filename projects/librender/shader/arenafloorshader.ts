import { mat4, vec3, vec2 } from 'gl-matrix';
import { Texture } from '@librender/texture/texture';
import { ArenaFloorGeo } from '@librender/geo/arenafloorgeo';
import { ShaderUtils } from './shaderutils';
import { IBDescBitWidthToType } from '@librender/geo/ibdesc';

const VS_TEST = `#version 300 es
precision mediump float;

uniform mat4 matProj;
uniform mat4 matView;
uniform mat4 matWorld;

in vec3 pos;
in vec3 normal;

out vec3 fNormal;

void main() {
  fNormal = (matWorld * vec4(normal, 0.0)).xyz;
  gl_Position = matProj * matView * matWorld * vec4(pos, 1.0);
}`;

const REFLECTIVE_COEFFICIENT = 0.15;

const FS_TEXT = `#version 300 es
precision mediump float;

uniform vec3 lightColor;
uniform vec2 viewportSize;

uniform sampler2D reflectionTexture;
// TODO (sessamekesh): Add in a bump and gloss texture as well, for texturing the floor
// That should give a nice sense of movement

in vec3 fNormal;

out vec4 color;

void main() {
  vec2 uv = gl_FragCoord.xy / viewportSize;
  uv.x = 1.0 - uv.x;
  vec4 reflectionColor = texture(reflectionTexture, uv);
  color = vec4(vec3(0.05) * lightColor, 1.0) * ${1.0 - REFLECTIVE_COEFFICIENT}
        + reflectionColor * ${REFLECTIVE_COEFFICIENT};
}`;

type Attribs = {
  Pos: number,
  Normal: number,
};

type Uniforms = {
  MatProj: WebGLUniformLocation,
  MatView: WebGLUniformLocation,
  MatWorld: WebGLUniformLocation,

  LightColor: WebGLUniformLocation,
  ViewportSize: WebGLUniformLocation,
  ReflectionTexture: WebGLUniformLocation,
};

export type ArenaFloorRenderCall = {
  MatWorld: mat4,
  MatView: mat4,
  MatProj: mat4,

  LightColor: vec3,
  ViewportSize: vec2,
  ReflectionTexture: Texture,

  Geo: ArenaFloorGeo,
};

export class ArenaFloorShader {
  private constructor(
    private program: WebGLProgram,
    private attribs: Attribs,
    private uniforms: Uniforms) {}

  static create(gl: WebGL2RenderingContext): ArenaFloorShader|null {
    const program = ShaderUtils.createShaderFromSource(gl, 'arenaFloorShader', VS_TEST, FS_TEXT);
    if (!program) {
      return null;
    }

    const matWorld = gl.getUniformLocation(program, 'matWorld');
    const matView = gl.getUniformLocation(program, 'matView');
    const matProj = gl.getUniformLocation(program, 'matProj');
    const lightColor = gl.getUniformLocation(program, 'lightColor');
    const reflectionTexture = gl.getUniformLocation(program, 'reflectionTexture');
    const viewportSize = gl.getUniformLocation(program, 'viewportSize');
    if (!matWorld || !matView || !matProj || !lightColor || !reflectionTexture || !viewportSize) {
      console.error(`Failed to get all uniform locations for arena floor shader, {
        MatWorld: ${matWorld},
        MatView: ${matView},
        MatProj: ${matProj},
        LightColor: ${lightColor},
        ReflectionTexture: ${reflectionTexture},
        ViewportSize: ${viewportSize},
      }`);
      return null;
    }

    const posAttrib = gl.getAttribLocation(program, 'pos');
    const normalAttrib = gl.getAttribLocation(program, 'normal');
    if (posAttrib < 0 || normalAttrib < 0) {
      console.error(`Failed to get all attrib locations for arena floor shader, {
        Pos: ${posAttrib},
        Normal: ${normalAttrib},
      }`);
      return null;
    }

    return new ArenaFloorShader(program, {
      Pos: posAttrib, Normal: normalAttrib,
    }, {
      MatWorld: matWorld,
      MatView: matView,
      MatProj: matProj,
      LightColor: lightColor,
      ReflectionTexture: reflectionTexture,
      ViewportSize: viewportSize,
    });
  }

  getAttribLocations(): Attribs {
    return {...this.attribs};
  }

  activate(gl: WebGL2RenderingContext) {
    gl.useProgram(this.program);
  }

  render(gl: WebGL2RenderingContext, call: ArenaFloorRenderCall) {
    gl.uniformMatrix4fv(this.uniforms.MatProj, false, call.MatProj);
    gl.uniformMatrix4fv(this.uniforms.MatView, false, call.MatView);
    gl.uniformMatrix4fv(this.uniforms.MatWorld, false, call.MatWorld);
    gl.uniform3fv(this.uniforms.LightColor, call.LightColor);
    gl.uniform2fv(this.uniforms.ViewportSize, call.ViewportSize);
    gl.uniform1i(this.uniforms.ReflectionTexture, 0);
    call.ReflectionTexture.bind(gl, 0);

    gl.bindVertexArray(call.Geo.vao);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, call.Geo.ib);
    gl.drawElements(
      gl.TRIANGLES, call.Geo.numIndices, IBDescBitWidthToType[call.Geo.ibDesc.BitWidth], 0);
  }
}
