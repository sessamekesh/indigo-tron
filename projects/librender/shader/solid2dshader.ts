import { ShaderBase } from './shaderbase';
import { vec2, vec4 } from 'gl-matrix';
import { IBDescBitWidthToType } from '@librender/geo/ibdesc';
import { GeoBase } from '@librender/geo/geobase';

const VS_TEXT = `#version 300 es
precision mediump float;

in vec2 pos;

uniform vec2 scale;
uniform vec2 rotation;
uniform vec2 offset;

void main() {
  vec2 rotatedPosition = vec2(
    pos.x * rotation.y + pos.y * rotation.x,
    pos.y * rotation.y - pos.x * rotation.x);
  gl_Position = vec4(rotatedPosition * scale + offset, 0.0, 1.0);
}`;

const FS_TEXT = `#version 300 es
precision mediump float;

uniform vec4 iColor;

out vec4 color;

void main() {
  color = iColor;
}`;

const AttribNames = {
  Pos: 'pos',
};
const UniformNames = {
  Scale: 'scale',
  Rotation: 'rotation',
  Offset: 'offset',
  Color: 'iColor',
};

export type Solid2DRenderCall = {
  Geo: GeoBase,

  Scale: vec2,
  Rotation: number,
  Offset: vec2,
  Color: vec4,
};

export class Solid2DShader extends ShaderBase<typeof AttribNames, typeof UniformNames> {
  static create(gl: WebGL2RenderingContext) {
    const rsl = ShaderBase.createInternal(
      gl, 'Solid2DShader', VS_TEXT, FS_TEXT, AttribNames, UniformNames);
    return rsl && new Solid2DShader(rsl.program, rsl.attribs, rsl.uniforms);
  }

  private rotationVec = vec2.create();
  render(gl: WebGL2RenderingContext, call: Solid2DRenderCall) {
    gl.bindVertexArray(call.Geo.vao);
    vec2.set(this.rotationVec, Math.sin(call.Rotation), Math.cos(call.Rotation));
    gl.uniform2fv(this.uniforms.Rotation, this.rotationVec);
    gl.uniform2fv(this.uniforms.Scale, call.Scale);
    gl.uniform2fv(this.uniforms.Offset, call.Offset);
    gl.uniform4fv(this.uniforms.Color, call.Color);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, call.Geo.ib);
    gl.drawElements(
      gl.TRIANGLES, call.Geo.numIndices,
      IBDescBitWidthToType[call.Geo.ibDesc.BitWidth], 0);
  }
}
