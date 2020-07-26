import {GeoBase } from '@librender/geo/geobase';
import { mat4, vec2, vec3 } from 'gl-matrix';
import { Texture } from '@librender/texture/texture';
import { ShaderBase } from './shaderbase';
import { IBDescBitWidthToType } from '@librender/geo/ibdesc';

const VS_TEXT = `#version 300 es
precision mediump float;

uniform mat4 matProj;
uniform mat4 matView;
uniform mat4 matWorld;

in vec3 v_pos;

void main() {
  gl_Position = matProj * matView * matWorld * vec4(v_pos, 1.0);
}`;

const FS_TEXT = `#version 300 es
precision mediump float;

uniform vec2 viewportSize;
uniform vec3 floorColor;

uniform sampler2D reflectionTexture;
uniform float reflectionFactor;

out vec4 color;

const vec2 gaussFilter[7] = vec2[](
	vec2(-3.0,	0.015625),
	vec2(-2.0,	0.09375),
	vec2(-1.0,	0.234375),
	vec2(0.0,	0.3125),
	vec2(1.0,	0.234375),
	vec2(2.0,	0.09375),
	vec2(3.0,	0.015625)
);

void main() {
  vec2 reflectionTexCoords = gl_FragCoord.xy / viewportSize;
  reflectionTexCoords.x = 1.0 - reflectionTexCoords.x;
  // vec3 reflectionColor = texture(reflectionTexture, reflectionTexCoords).rgb;

  // TODO (sessamekesh): Make this depend on the framebuffer texture width, eh?
  vec2 scale = vec2(1.0 / 512.0, 0.0);

  vec3 reflectionColor = vec3(0.0);
	for (int i = 0; i < 7; i++) {
		reflectionColor += texture(
      reflectionTexture,
      vec2(
        reflectionTexCoords.x + gaussFilter[i].x * scale.x,
        reflectionTexCoords.y + gaussFilter[i].x * scale.y)).rgb * gaussFilter[i].y / 2.0;
  }
  scale = vec2(0.0, 1.0 / 512.0);
  for (int i = 0; i < 7; i++) {
		reflectionColor += texture(
      reflectionTexture,
      vec2(
        reflectionTexCoords.x + gaussFilter[i].x * scale.x,
        reflectionTexCoords.y + gaussFilter[i].x * scale.y)).rgb * gaussFilter[i].y / 2.0;
  }

  color = vec4(reflectionColor * reflectionFactor + floorColor * (1.0 - reflectionFactor), 1.0);
}`;

const AttribNames = {
  pos: 'v_pos',
};

export type ArenaFloorShader3AttribType = typeof AttribNames;

const UniformNames = {
  matProj: 'matProj',
  matView: 'matView',
  matWorld: 'matWorld',

  viewportSize: 'viewportSize',
  floorColor: 'floorColor',

  reflectionTexture: 'reflectionTexture',
  reflectionFactor: 'reflectionFactor',
};

export type ArenaFloor3RenderCall = {
  geo: GeoBase<ArenaFloorShader3AttribType>,
  matWorld: mat4,
  matView: mat4,
  matProj: mat4,
  viewportSize: vec2,
  floorColor: vec3,
  reflectionTexture: Texture,
  reflectionFactor: number,
};

export class ArenaFloorShader3 extends ShaderBase<typeof AttribNames, typeof UniformNames> {
  static create(gl: WebGL2RenderingContext) {
    const rsl = ShaderBase.createInternal(
      gl, 'ArenaFloorShader3', VS_TEXT, FS_TEXT, AttribNames, UniformNames);
    return rsl && new ArenaFloorShader3(rsl.program, rsl.attribs, rsl.uniforms);
  }

  render(gl: WebGL2RenderingContext, call: ArenaFloor3RenderCall) {
    gl.uniformMatrix4fv(this.uniforms.matProj, false, call.matProj);
    gl.uniformMatrix4fv(this.uniforms.matView, false, call.matView);
    gl.uniformMatrix4fv(this.uniforms.matWorld, false, call.matWorld);

    gl.uniform2fv(this.uniforms.viewportSize, call.viewportSize);
    gl.uniform3fv(this.uniforms.floorColor, call.floorColor);

    call.reflectionTexture.bindUniform(gl, this.uniforms.reflectionTexture, 0);
    gl.uniform1f(this.uniforms.reflectionFactor, call.reflectionFactor);

    gl.bindVertexArray(call.geo.vao);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, call.geo.ib);
    gl.drawElements(
      gl.TRIANGLES, call.geo.numIndices, IBDescBitWidthToType[call.geo.ibDesc.BitWidth], 0);
  }
}
