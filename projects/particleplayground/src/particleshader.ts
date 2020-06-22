import { ShaderBase } from '@librender/shader/shaderbase';
import { GeoBase } from '@librender/geo/geobase';
import { Texture } from '@librender/texture/texture';
import { mat4, vec2 } from 'gl-matrix';
import { IBDescBitWidthToType } from '@librender/geo/ibdesc';
import { ECSManager } from '@libecs/ecsmanager';

const VS_TEXT = `#version 300 es
precision mediump float;

in vec3 pos;
in vec2 uv;

uniform mat4 matProj;
uniform mat4 matView;
uniform mat4 matWorld;

out vec2 f_uv;

void main() {
  f_uv = uv;

  gl_Position = matProj * matView * matWorld * vec4(pos, 1.0);
}`;

const FS_TEXT = `#version 300 es
precision mediump float;

in vec2 f_uv;

uniform sampler2D tex1;
uniform sampler2D tex2;
uniform sampler2D tex3;

uniform vec2 uvScale1;
uniform vec2 uvScale2;
uniform vec2 uvScale3;

uniform vec2 uvOffset1;
uniform vec2 uvOffset2;
uniform vec2 uvOffset3;

out vec4 color;

void main() {
  vec4 t1Color = texture(tex1, f_uv * uvScale1 + uvOffset1);
  vec4 t2Color = texture(tex2, f_uv * uvScale2 + uvOffset2);
  vec4 t3Color = texture(tex3, f_uv * uvScale3 + uvOffset3);

  color = t1Color;
  color.a = t1Color.r * t2Color.r * t3Color.r * 2.0;
}`;

const AttribNames = {
  pos: 'pos',
  uv: 'uv',
};

const UniformNames = {
  matProj: 'matProj',
  matView: 'matView',
  matWorld: 'matWorld',
  tex1: 'tex1',
  tex2: 'tex2',
  tex3: 'tex3',
  uvScale1: 'uvScale1',
  uvScale2: 'uvScale2',
  uvScale3: 'uvScale3',
  uvOffset1: 'uvOffset1',
  uvOffset2: 'uvOffset2',
  uvOffset3: 'uvOffset3',
};

export type ParticleRenderCall = {
  geo: GeoBase,

  matWorld: mat4,
  matView: mat4,
  matProj: mat4,

  tex1: Texture,
  tex2: Texture,
  tex3: Texture,

  uvScale1: vec2,
  uvScale2: vec2,
  uvScale3: vec2,
  uvOffset1: vec2,
  uvOffset2: vec2,
  uvOffset3: vec2,
};

export class ParticleShader extends ShaderBase<typeof AttribNames, typeof UniformNames> {
  static create(gl: WebGL2RenderingContext) {
    const rsl = ShaderBase.createInternal(
      gl, 'ParticleShader', VS_TEXT, FS_TEXT, AttribNames, UniformNames);
    return rsl && new ParticleShader(rsl.program, rsl.attribs, rsl.uniforms);
  }

  render(gl: WebGL2RenderingContext, call: ParticleRenderCall) {
    gl.uniformMatrix4fv(this.uniforms.matWorld, false, call.matWorld);
    gl.uniformMatrix4fv(this.uniforms.matView, false, call.matView);
    gl.uniformMatrix4fv(this.uniforms.matProj, false, call.matProj);

    gl.uniform2fv(this.uniforms.uvScale1, call.uvScale1);
    gl.uniform2fv(this.uniforms.uvScale2, call.uvScale2);
    gl.uniform2fv(this.uniforms.uvScale3, call.uvScale3);

    gl.uniform2fv(this.uniforms.uvOffset1, call.uvOffset1);
    gl.uniform2fv(this.uniforms.uvOffset2, call.uvOffset2);
    gl.uniform2fv(this.uniforms.uvOffset3, call.uvOffset3);

    gl.uniform1i(this.uniforms.tex1, 0);
    call.tex1.bind(gl, 0);

    gl.uniform1i(this.uniforms.tex2, 1);
    call.tex2.bind(gl, 1);

    gl.uniform1i(this.uniforms.tex3, 2);
    call.tex3.bind(gl, 2);

    gl.bindVertexArray(call.geo.vao);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, call.geo.ib);
    gl.drawElements(
      gl.TRIANGLES, call.geo.numIndices, IBDescBitWidthToType[call.geo.ibDesc.BitWidth], 0);
  }
}

export class ParticleShaderComponent {
  constructor(public Shader: ParticleShader) {}

  static upsert(ecs: ECSManager, gl: WebGL2RenderingContext) {
    const shader = ParticleShader.create(gl);
    if (!shader) return;

    ecs.iterateComponents2({}, {ParticleShaderComponent}, (e, _1, _2) => e.destroy());

    const e = ecs.createEntity();
    e.addComponent(ParticleShaderComponent, shader);
    return shader;
  }
}
