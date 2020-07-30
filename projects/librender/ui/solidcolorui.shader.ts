import { GeoBase } from '@librender/geo/geobase';
import { vec2, vec4 } from 'gl-matrix';
import { ShaderBase } from '@librender/shader/shaderbase';
import { IBDescBitWidthToType } from '@librender/geo/ibdesc';

const VS_TEXT = `#version 300 es
precision mediump float;

in vec2 position;

uniform vec2 topLeftOffset;
uniform vec2 scale;
uniform vec2 viewportSize;
uniform float z;

void main() {
  gl_Position = vec4(((position * scale + topLeftOffset) / viewportSize - vec2(0.5, 0.5)) * 2.0, z, 1.0);
}`;

const FS_TEXT = `#version 300 es
precision mediump float;

uniform vec4 color;

out vec4 oColor;

void main() {
  oColor = color;
}`;

const AttribNames = {
  pos: 'position',
};

export type SolidColorUiShaderAttribType = typeof AttribNames;

const UniformNames = {
  topLeftOffset: 'topLeftOffset',
  scale: 'scale',
  viewportSize: 'viewportSize',
  z: 'z',
  color: 'color',
};

export type SolidColorUiRenderCall = {
  Geo: GeoBase<SolidColorUiShaderAttribType>,
  topLeftOffset: vec2,
  viewportSize: vec2,
  scale: vec2,
  z: number,
  color: vec4,
};

export class SolidColorUiShader extends ShaderBase<typeof AttribNames, typeof UniformNames> {
  static create(gl: WebGL2RenderingContext) {
    const rsl = ShaderBase.createInternal(
      gl, 'SolidColorUiShader', VS_TEXT, FS_TEXT, AttribNames, UniformNames);
    return rsl && new SolidColorUiShader(rsl.program, rsl.attribs, rsl.uniforms);
  }

  render(gl: WebGL2RenderingContext, call: SolidColorUiRenderCall) {
    gl.uniform1f(this.uniforms.z, call.z);
    gl.uniform2fv(this.uniforms.viewportSize, call.viewportSize);
    gl.uniform2fv(this.uniforms.topLeftOffset, call.topLeftOffset);
    gl.uniform2fv(this.uniforms.scale, call.scale);
    gl.uniform4fv(this.uniforms.color, call.color);

    gl.bindVertexArray(call.Geo.vao);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, call.Geo.ib);
    gl.drawElements(
      gl.TRIANGLES, call.Geo.numIndices, IBDescBitWidthToType[call.Geo.ibDesc.BitWidth], 0);
  }
}
