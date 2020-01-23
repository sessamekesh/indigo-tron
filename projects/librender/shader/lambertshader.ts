import { LambertGeo } from '@librender/geo/lambertgeo';
import { mat4, vec3 } from 'gl-matrix';
import { ShaderUtils } from './shaderutils';
import { IBDescBitWidthToType } from '@librender/geo/ibdesc';
import { Texture } from '@librender/texture/texture';
import { RenderProvider } from '@librender/renderprovider';
import { OwnedResource } from '@libutil/allocator';
import { FrameSettings } from '@libgamerender/framesettings';

const VS_TEXT = `#version 300 es
precision mediump float;

uniform mat4 matProj;
uniform mat4 matView;
uniform mat4 matWorld;

in vec3 pos;
in vec3 normal;
in vec2 uv;

out vec2 fUV;
out vec3 fNormal;

void main() {
  fNormal = (matWorld * vec4(normal, 0.0)).xyz;
  fUV = uv;
  gl_Position = matProj * matView * matWorld * vec4(pos, 1.0);
}`;

const FS_TEXT = `#version 300 es
precision mediump float;

// Use the surface color initially when teaching lambert shading
//uniform vec3 surfaceColor;
uniform sampler2D diffuseSampler;
uniform vec3 lightColor;
uniform vec3 lightDirection;
uniform float ambientCoefficient;

in vec2 fUV;
in vec3 fNormal;

out vec4 color;

void main() {
  vec3 surfaceColor = texture(diffuseSampler, fUV).rgb;
  float rawDiffuseCoefficient = -dot(fNormal, lightDirection);
  float colorPower = ambientCoefficient + (rawDiffuseCoefficient * (1.0 - ambientCoefficient));

  color = vec4(colorPower * surfaceColor * lightColor, 1.0);
}`;

type Attribs = {
  Pos: number,
  Normal: number,
  UV: number,
};

type Uniforms = {
  MatProj: WebGLUniformLocation,
  MatView: WebGLUniformLocation,
  MatWorld: WebGLUniformLocation,

  //SurfaceColor: WebGLUniformLocation,
  LightColor: WebGLUniformLocation,
  LightDirection: WebGLUniformLocation,
  AmbientCoefficient: WebGLUniformLocation,
  DiffuseSampler: WebGLUniformLocation,
};

export type LambertRenderCall = {
  Geo: LambertGeo,

  MatWorld: mat4,
  MatView: mat4,
  MatProj: mat4,

  //SurfaceColor: vec3,
  LightColor: vec3,
  LightDirection: vec3,
  AmbientCoefficient: number,

  DiffuseTexture: Texture,
};

export type LambertRenderCall2 = {
  Geo: LambertGeo,
  MatWorld: OwnedResource<mat4>,
  DiffuseTexture: Texture,

  AmbientCoefficientOverride?: number,
};

export class LambertShader {
  private constructor(
    private program: WebGLProgram,
    private attribs: Attribs,
    private uniforms: Uniforms) {}

  static getRenderProvider(): RenderProvider<LambertShader> {
    return new RenderProvider((gl) => LambertShader.create(gl));
  }

  static create(gl: WebGL2RenderingContext): LambertShader|null {
    const program = ShaderUtils.createShaderFromSource(gl, 'lambertShader', VS_TEXT, FS_TEXT);
    if (!program) {
      return null;
    }

    const matWorld = gl.getUniformLocation(program, 'matWorld');
    const matView = gl.getUniformLocation(program, 'matView');
    const matProj = gl.getUniformLocation(program, 'matProj');
    //const surfaceColor = gl.getUniformLocation(program, 'surfaceColor');
    const lightColor = gl.getUniformLocation(program, 'lightColor');
    const lightDirection = gl.getUniformLocation(program, 'lightDirection');
    const ambientCoefficient = gl.getUniformLocation(program, 'ambientCoefficient');
    const diffuseSampler = gl.getUniformLocation(program, 'diffuseSampler');
    if (!matWorld || !matView || !matProj || !diffuseSampler
        || !lightColor || !lightDirection || !ambientCoefficient) {
      console.error('Failed to get all uniform locations for lambert program, aborting');
      return null;
    }

    const posAttrib = gl.getAttribLocation(program, 'pos');
    const normalAttrib = gl.getAttribLocation(program, 'normal');
    const uvAttrib = gl.getAttribLocation(program, 'uv');
    if (posAttrib < 0 || normalAttrib < 0 || uvAttrib < 0) {
      console.error('Failed to get all attribs for lambert program, aborting');
      return null;
    }

    return new LambertShader(program, {
      Pos: posAttrib,
      Normal: normalAttrib,
      UV: uvAttrib,
    }, {
      MatProj: matProj,
      MatView: matView,
      MatWorld: matWorld,

      AmbientCoefficient: ambientCoefficient,
      LightColor: lightColor,
      LightDirection: lightDirection,
      //SurfaceColor: surfaceColor,
      DiffuseSampler: diffuseSampler,
    });
  }

  getAttribLocations(): Attribs {
    return {
      Normal: this.attribs.Normal,
      Pos: this.attribs.Pos,
      UV: this.attribs.UV,
    };
  }

  activate(gl: WebGL2RenderingContext) {
    gl.useProgram(this.program);
  }

  render(gl: WebGL2RenderingContext, call: LambertRenderCall) {
    gl.bindVertexArray(call.Geo.vao);
    gl.uniformMatrix4fv(this.uniforms.MatProj, false, call.MatProj);
    gl.uniformMatrix4fv(this.uniforms.MatView, false, call.MatView);
    gl.uniformMatrix4fv(this.uniforms.MatWorld, false, call.MatWorld);
    gl.uniform3fv(this.uniforms.LightColor, call.LightColor);
    gl.uniform3fv(this.uniforms.LightDirection, call.LightDirection);
    //gl.uniform3fv(this.uniforms.SurfaceColor, call.SurfaceColor);
    gl.uniform1f(this.uniforms.AmbientCoefficient, call.AmbientCoefficient);
    gl.uniform1i(this.uniforms.DiffuseSampler, 0);
    call.DiffuseTexture.bind(gl, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, call.Geo.ib);
    gl.drawElements(
      gl.TRIANGLES, call.Geo.numIndices,
      IBDescBitWidthToType[call.Geo.ibDesc.BitWidth], 0);
  }

  render2(gl: WebGL2RenderingContext, call: LambertRenderCall2, frameSettings: FrameSettings) {
    gl.bindVertexArray(call.Geo.vao);
    gl.uniformMatrix4fv(this.uniforms.MatProj, false, frameSettings.MatProj);
    gl.uniformMatrix4fv(this.uniforms.MatView, false, frameSettings.MatView);
    gl.uniformMatrix4fv(this.uniforms.MatWorld, false, call.MatWorld.Value);
    gl.uniform3fv(this.uniforms.LightColor, frameSettings.LightColor);
    gl.uniform3fv(this.uniforms.LightDirection, frameSettings.LightDirection);
    gl.uniform1f(
      this.uniforms.AmbientCoefficient,
      call.AmbientCoefficientOverride != null
        ? call.AmbientCoefficientOverride
        : frameSettings.AmbientCoefficient);
    gl.uniform1i(this.uniforms.DiffuseSampler, 0);
    call.DiffuseTexture.bind(gl, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, call.Geo.ib);
    gl.drawElements(
      gl.TRIANGLES, call.Geo.numIndices,
      IBDescBitWidthToType[call.Geo.ibDesc.BitWidth], 0);
  }
}
