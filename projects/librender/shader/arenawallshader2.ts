import { mat4, vec4, vec3, vec2 } from 'gl-matrix';
import { Texture } from '@librender/texture/texture';
import { ShaderBase } from './shaderbase';
import { GeoBase } from '@librender/geo/geobase';
import { IBDescBitWidthToType } from '@librender/geo/ibdesc';

const VS_TEXT = `#version 300 es
precision mediump float;

uniform mat4 matProj;
uniform mat4 matView;
uniform mat4 matWorld;

in vec3 pos;
in vec2 uv;

out vec2 fUV;

void main() {
  fUV = uv;
  gl_Position = matProj * matView * matWorld * vec4(pos, 1.0);
}`;

const FS_TEXT = `#version 300 es
precision mediump float;

in vec2 fUV;

uniform vec4 baseColor;

uniform float wispMaxIntensity;
uniform vec3 wispColor;

uniform vec2 wispMovement1;
uniform vec2 wispMovement2;

uniform vec2 wispScale1;
uniform vec2 wispScale2;

uniform sampler2D cloudWispTexture1;
uniform sampler2D cloudWispTexture2;

out vec4 color;

void main() {
  vec2 tex1uv = fUV * wispScale1 + wispMovement1;
  vec2 tex2uv = fUV * wispScale2 + wispMovement2;

  float wisp1Alpha = texture(cloudWispTexture1, tex1uv).r * 0.5;
  float wisp2Alpha = texture(cloudWispTexture2, tex2uv).r;

  float wi = wispMaxIntensity * wisp1Alpha * wisp2Alpha;

  color = mix(baseColor, vec4(wispColor, baseColor.a), wi);
}`;

const Attribs = {
  pos: 'pos',
  uv: 'uv',
};

export type ArenaWall2AttribType = typeof Attribs;

const Uniforms = {
  matWorld: 'matWorld',
  matView: 'matView',
  matProj: 'matProj',
  baseColor: 'baseColor',
  wispMaxIntensity: 'wispMaxIntensity',
  wispColor: 'wispColor',
  wispMovement1: 'wispMovement1',
  wispMovement2: 'wispMovement2',
  wispScale1: 'wispScale1',
  wispScale2: 'wispScale2',
  cloudWispTexture1: 'cloudWispTexture1',
  cloudWispTexture2: 'cloudWispTexture2',
};

export type ArenaWall2RenderCall = {
  geo: GeoBase<ArenaWall2AttribType>,

  matWorld: mat4,
  matView: mat4,
  matProj: mat4,
  baseColor: vec4,
  wispMaxIntensity: number,
  wispColor: vec3,
  wispMovement1: vec2,
  wispMovement2: vec2,
  wispScale1: vec2,
  wispScale2: vec2,
  cloudWispTexture1: Texture,
  cloudWispTexture2: Texture,
};

export class ArenaWallShader2 extends ShaderBase<typeof Attribs, typeof Uniforms> {
  static create(gl: WebGL2RenderingContext) {
    const rsl = ShaderBase.createInternal(
      gl, 'ArenaWallShader2', VS_TEXT, FS_TEXT, Attribs, Uniforms);
    return rsl && new ArenaWallShader2(rsl.program, rsl.attribs, rsl.uniforms);
  }

  render(gl: WebGL2RenderingContext, call: ArenaWall2RenderCall) {
    gl.uniformMatrix4fv(this.uniforms.matProj, false, call.matProj);
    gl.uniformMatrix4fv(this.uniforms.matView, false, call.matView);
    gl.uniformMatrix4fv(this.uniforms.matWorld, false, call.matWorld);

    gl.uniform4fv(this.uniforms.baseColor, call.baseColor);
    gl.uniform1f(this.uniforms.wispMaxIntensity, call.wispMaxIntensity);
    gl.uniform3fv(this.uniforms.wispColor, call.wispColor);
    gl.uniform2fv(this.uniforms.wispMovement1, call.wispMovement1);
    gl.uniform2fv(this.uniforms.wispMovement2, call.wispMovement2);

    gl.uniform2fv(this.uniforms.wispScale1, call.wispScale1);
    gl.uniform2fv(this.uniforms.wispScale2, call.wispScale2);

    call.cloudWispTexture1.bindUniform(gl, this.uniforms.cloudWispTexture1, 0);
    call.cloudWispTexture2.bindUniform(gl, this.uniforms.cloudWispTexture2, 1);

    gl.bindVertexArray(call.geo.vao);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, call.geo.ib);
    gl.drawElements(
      gl.TRIANGLES, call.geo.numIndices, IBDescBitWidthToType[call.geo.ibDesc.BitWidth], 0);
  }
}
