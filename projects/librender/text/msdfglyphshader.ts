import { ShaderBase } from '@librender/shader/shaderbase';
import { GeoBase } from '@librender/geo/geobase';
import { vec4, vec2 } from 'gl-matrix';
import { Texture } from '@librender/texture/texture';
import { IBDescBitWidthToType } from '@librender/geo/ibdesc';

const VS_TEXT = `#version 300 es
precision mediump float;

in vec2 position;
in vec2 uv;

uniform vec2 topLeftOffset;
uniform vec2 scale;
uniform vec2 viewportSize;
uniform float z;
out vec2 fUV;

void main() {
  fUV = uv;
  gl_Position = vec4(((position * scale + topLeftOffset) / viewportSize - vec2(0.5, 0.5)) * 2.0, z, 1.0);
}`;

const FS_TEXT = `#version 300 es
precision mediump float;

uniform sampler2D glyphTexture;
uniform vec4 glyphColor;
uniform float alphaThreshold;

in vec2 fUV;

out vec4 color;

float median (float r, float g, float b) {
  return max(min(r, g), min(max(r, g), b));
}

void main() {
  vec3 sampleColor = texture(glyphTexture, fUV).rgb;
  float sigDist = median(sampleColor.r, sampleColor.g, sampleColor.b) - 0.5;
  float alpha = clamp(sigDist / fwidth(sigDist) + 0.5, 0.0, 1.0);
  color = vec4(glyphColor.xyz, alpha * glyphColor.a);
  if (color.a < alphaThreshold) discard;
}`;

const AttribNames = {
  pos: 'position',
  uv: 'uv',
};

export type MsdfGlyphShaderAttribType = typeof AttribNames;

const UniformNames = {
  topLeftOffset: 'topLeftOffset',
  viewportSize: 'viewportSize',
  z: 'z',
  scale: 'scale',
  glyphTexture: 'glyphTexture',
  glyphColor: 'glyphColor',
  alphaThreshold: 'alphaThreshold',
};

export type MSDFRenderCall = {
  Geo: GeoBase<MsdfGlyphShaderAttribType>,

  topLeftOffset: vec2,
  viewportSize: vec2,
  scale: vec2,
  z: number,

  GlyphTexture: Texture,
  GlyphColor: vec4,
  AlphaThreshold: number,
}

export class MsdfGlyphShader extends ShaderBase<typeof AttribNames, typeof UniformNames> {
  static create(gl: WebGL2RenderingContext) {
    const rsl = ShaderBase.createInternal(
      gl, 'MsdfGlyphShader', VS_TEXT, FS_TEXT, AttribNames, UniformNames);
    return rsl && new MsdfGlyphShader(rsl.program, rsl.attribs, rsl.uniforms);
  }

  render(gl: WebGL2RenderingContext, call: MSDFRenderCall) {
    gl.uniform1f(this.uniforms.z, call.z);
    gl.uniform2fv(this.uniforms.viewportSize, call.viewportSize);
    gl.uniform2fv(this.uniforms.topLeftOffset, call.topLeftOffset);
    gl.uniform2fv(this.uniforms.scale, call.scale);

    call.GlyphTexture.bindUniform(gl, this.uniforms.glyphTexture, 0);
    gl.uniform1f(this.uniforms.alphaThreshold, call.AlphaThreshold);
    gl.uniform4fv(this.uniforms.glyphColor, call.GlyphColor);

    gl.bindVertexArray(call.Geo.vao);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, call.Geo.ib);
    gl.drawElements(
      gl.TRIANGLES, call.Geo.numIndices, IBDescBitWidthToType[call.Geo.ibDesc.BitWidth], 0);
  }
}
