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

out vec3 f_position;
out vec2 f_texcoord;
out mat3 f_tangentBasis;

void main() {
  f_position = vec3(matWorld * vec4(v_pos, 1.0));
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
uniform vec3 eyePosition;

uniform sampler2D reflectionTexture;
uniform sampler2D normalTexture;
uniform sampler2D albedoTexture;
uniform sampler2D roughnessTexture;

in vec3 f_position;
in vec2 f_texcoord;
in mat3 f_tangentBasis;

out vec4 color;

const float Epsilon = 0.00001;
const float PI = 3.141592;

// GGX/Towbridge-Reitz normal distribution function.
// Uses Disney's reparametrization of alpha = roughness^2.
float ndfGGX(float cosLh, float roughness)
{
	float alpha   = roughness * roughness;
	float alphaSq = alpha * alpha;

	float denom = (cosLh * cosLh) * (alphaSq - 1.0) + 1.0;
	return alphaSq / (PI * denom * denom);
}

// Single term for separable Schlick-GGX below.
float gaSchlickG1(float cosTheta, float k)
{
	return cosTheta / (cosTheta * (1.0 - k) + k);
}

// Schlick-GGX approximation of geometric attenuation function using Smith's method.
float gaSchlickGGX(float cosLi, float cosLo, float roughness)
{
	float r = roughness + 1.0;
	float k = (r * r) / 8.0; // Epic suggests using this roughness remapping for analytic lights.
	return gaSchlickG1(cosLi, k) * gaSchlickG1(cosLo, k);
}

// Shlick's approximation of the Fresnel factor.
vec3 fresnelSchlick(vec3 F0, float cosTheta)
{
	return F0 + (vec3(1.0) - F0) * pow(1.0 - cosTheta, 5.0);
}

void main() {
  // Sample input textures to get shading model params
  vec3 albedo = texture(albedoTexture, f_texcoord).rbg;
  float roughness = texture(roughnessTexture, f_texcoord).r;

  // Outgoing light direction (vector from world space fragment to the "eye")
  vec3 Lo = normalize(eyePosition - f_position);

  // Get current fragment's normal and transform to world space.
  vec3 N = normalize(2.0 * texture(normalTexture, f_texcoord).rgb - 1.0);
  N = normalize(f_tangentBasis * N);

  // Angle between surface normal and outgoing light direction.
  float cosLo = max(0.0, dot(N, Lo));

  // Specular reflection vector.
  vec3 Lr = 2.0 * cosLo * N - Lo;

  // Constant normal incidence Fresnel factor for all dielectrics.
  vec3 F0 = vec3(0.04);

  //
  // Direct lighting calculation for scene light
  //
  vec3 directLighting = vec3(0.0);
  vec3 Li = -lightDirection;
  vec3 Lradiance = lightColor;

  vec2 reflectionTexCoords = gl_FragCoord.xy / viewportSize;
  reflectionTexCoords.x = 1.0 - reflectionTexCoords.x;
  vec3 irradiance = texture(reflectionTexture, reflectionTexCoords).rgb;

  // Half vector between Li and Lo
  vec3 Lh = normalize(Li + Lo);

  // Calculate angles between surface normal and various light vectors.
  float cosLi = max(0.0, dot(N, Li));
  float cosLh = max(0.0, dot(N, Lh));

  // Calculate normal distribution for specular BRDF
  float D = ndfGGX(cosLh, roughness);
  // Calculate geometric attenuation for specular BRDF
  float G = gaSchlickGGX(cosLi, cosLo, roughness);

  vec3 F = fresnelSchlick(F0, max(0.0, dot(Lh, Lo)));

  // Diffuse scattering
  vec3 kd = vec3(1.0) - F;

  // Not considering metalness - so just use nonmetal BRDF (grab albedo, that's... it)
  vec3 diffuseBRDF = kd * albedo;

  // Cook-Torrance specular microfacet BRDF.
  vec3 specularBRDF = ((F * D * G) / max(Epsilon, 4.0 * cosLi * cosLo)) * 0.35;

  directLighting += (diffuseBRDF + specularBRDF) * Lradiance * cosLi;

  //
  // Ambient lighting (IBL)
  //
  vec3 ambientLighting = vec3(0.0);

  // Calculate Fresnel term for ambient lighting.
  F = fresnelSchlick(F0, cosLo);
  // Get diffuse contribution factor (as with direct lighting)
  kd = vec3(1.0) - F;
  // Irradiance map contains exitant radiance assuming Lambertian BRDF, no need to scale 1/PI
  vec3 diffuseIBL = kd * albedo;

  ambientLighting = diffuseIBL;

  //
  // Final fragment color.
  //
  float reflectionFactor = 0.12 - roughness * 0.12;
  color = vec4(
    (directLighting * (1.0 - ambientCoefficient) + ambientLighting * ambientCoefficient) * (1.0 - reflectionFactor)
    + irradiance * reflectionFactor, 1.0);
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
  eyePosition: 'eyePosition',
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
  eyePosition: vec3,
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
    gl.uniform3fv(this.uniforms.eyePosition, call.eyePosition);

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
