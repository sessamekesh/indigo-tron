// Code very loosely inspired from https://github.com/Nadrin/PBR/blob/master/data/shaders/glsl/pbr_fs.glsl

import { mat4, vec3, vec2 } from 'gl-matrix';
import { GeoBase } from '@librender/geo/geobase';
import { Texture } from '@librender/texture/texture';
import { ShaderBase } from './shaderbase';
import { IBDescBitWidthToType } from '@librender/geo/ibdesc';

// Notice: This is not a full PBR implementation, but it does incorporate a few elements of PBR
const VS_TEXT = `#version 300 es
precision mediump float;

uniform mat4 matProj;
uniform mat4 matView;
uniform mat4 matWorld;

in vec3 v_pos;
in vec3 v_normal;
in vec3 v_tangent;
in vec3 v_bitangent;
in vec2 v_texcoord;

out vec2 f_texcoord;
out mat3 f_tangentBasis;

void main() {
  f_texcoord = v_texcoord;

  f_tangentBasis = mat3(matWorld) * mat3(v_tangent, v_bitangent, v_normal);

  gl_Position = matProj * matView * matWorld * vec4(v_pos, 1.0);
}`;

const FS_TEXT = `#version 300 es
precision mediump float;

uniform vec3 lightDirection;
uniform vec3 lightColor;
uniform float ambientCoefficient;
uniform vec2 viewportSize;

uniform sampler2D reflectionTexture;
uniform sampler2D normalTexture;
uniform sampler2D albedoTexture;
uniform sampler2D roughnessTexture;

in vec2 f_texcoord;
in mat3 f_tangentBasis;

out vec4 color;

void main() {
  // Sample input textures to get shading model params
  vec3 albedo = texture(albedoTexture, f_texcoord).rbg;
  float roughness = texture(roughnessTexture, f_texcoord).r;

  // Get current fragment's normal and transform to world space.
  vec3 worldFragNormal = normalize(2.0 * texture(normalTexture, f_texcoord).rgb - 1.0);
  worldFragNormal = normalize(f_tangentBasis * worldFragNormal);

  vec2 dudv = vec2(dot(worldFragNormal, vec3(1.0, 0.0, 0.0)), dot(worldFragNormal, vec3(0.0, 0.0, 1.0))) * 0.04 * (1.0 - roughness);

  //
  // Direct lighting calculation for scene light
  //
  vec2 reflectionTexCoords = gl_FragCoord.xy / viewportSize;
  reflectionTexCoords.x = 1.0 - reflectionTexCoords.x;
  vec3 reflectionColor = texture(reflectionTexture, reflectionTexCoords + dudv).rgb;

  float diffuseFactor = max(0.0, dot(worldFragNormal, -lightDirection));

  reflectionColor = reflectionColor;
  float mag = (albedo.r + albedo.g + albedo.b) / 3.0;
  float reflectionFactor = 0.0;
  if (mag < 0.05) {
    reflectionFactor = 0.5;
  } else if (mag < 0.2) {
    reflectionFactor = 0.2;
  } else {
    reflectionFactor = 0.01;
  }

  color = vec4((reflectionColor * reflectionFactor + albedo * 0.45 * (1.0 - reflectionFactor)) * lightColor * (ambientCoefficient + (diffuseFactor * (1.0 - ambientCoefficient))), 1.0);
}`;

const AttribNames = {
  position: 'v_pos',
  normal: 'v_normal',
  tangent: 'v_tangent',
  bitangent: 'v_bitangent',
  texcoord: 'v_texcoord',
};

const UniformNames = {
  matProj: 'matProj',
  matView: 'matView',
  matWorld: 'matWorld',
  lightDirection: 'lightDirection',
  lightColor: 'lightColor',
  ambientCoefficient: 'ambientCoefficient',
  viewportSize: 'viewportSize',
  reflectionTexture: 'reflectionTexture',
  normalTexture: 'normalTexture',
  albedoTexture: 'albedoTexture',
  roughnessTexture: 'roughnessTexture',
};

export type ArenaFloorRenderCall = {
  geo: GeoBase,

  matWorld: mat4,
  matView: mat4,
  matProj: mat4,
  lightDirection: vec3,
  lightColor: vec3,
  viewportSize: vec2,
  ambientCoefficient: number,

  reflectionTexture: Texture,
  normalTexture: Texture,
  albedoTexture: Texture,
  roughnessTexture: Texture,
};

export class ArenaFloorShader2 extends ShaderBase<typeof AttribNames, typeof UniformNames> {
  static create(gl: WebGL2RenderingContext) {
    const rsl = ShaderBase.createInternal(
      gl, 'ArenaFloorShader', VS_TEXT, FS_TEXT, AttribNames, UniformNames);
    return rsl && new ArenaFloorShader2(rsl.program, rsl.attribs, rsl.uniforms);
  }

  render(gl: WebGL2RenderingContext, call: ArenaFloorRenderCall) {
    gl.uniformMatrix4fv(this.uniforms.matWorld, false, call.matWorld);
    gl.uniformMatrix4fv(this.uniforms.matView, false, call.matView);
    gl.uniformMatrix4fv(this.uniforms.matProj, false, call.matProj);

    gl.uniform3fv(this.uniforms.lightDirection, call.lightDirection);
    gl.uniform3fv(this.uniforms.lightColor, call.lightColor);
    gl.uniform2fv(this.uniforms.viewportSize, call.viewportSize);

    gl.uniform1f(this.uniforms.ambientCoefficient, call.ambientCoefficient);

    gl.uniform1i(this.uniforms.reflectionTexture, 0);
    call.reflectionTexture.bind(gl, 0);
    gl.uniform1i(this.uniforms.normalTexture, 1);
    call.normalTexture.bind(gl, 1);
    gl.uniform1i(this.uniforms.albedoTexture, 2);
    call.albedoTexture.bind(gl, 2);
    gl.uniform1i(this.uniforms.roughnessTexture, 3);
    call.roughnessTexture.bind(gl, 3);

    gl.bindVertexArray(call.geo.vao);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, call.geo.ib);
    gl.drawElements(
      gl.TRIANGLES, call.geo.numIndices, IBDescBitWidthToType[call.geo.ibDesc.BitWidth], 0);
  }
}
