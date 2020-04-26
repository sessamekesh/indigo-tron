import { mat4, vec3, vec2 } from 'gl-matrix';
import { Texture } from '@librender/texture/texture';
import { ShaderUtils } from './shaderutils';
import { LambertGeo } from '@librender/geo/lambertgeo';
import { ArenaWallGeo } from '@librender/geo/arenawallgeo';
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

uniform vec3 forceFieldColor;
uniform vec2 forceFieldIntensityDisplacement;
uniform vec2 distortionOffset;

uniform vec2 baseColorTilingScale;
uniform vec2 intensityTilingScale;
uniform vec2 forceFieldTilingScale;

uniform sampler2D baseColorTexture;
uniform sampler2D baseColorDistortionTexture;
uniform sampler2D forceFieldIntensityTexture;
uniform sampler2D forceFieldPatternTexture;

out vec4 color;

void main() {
  vec2 baseColorUV = fUV + texture(baseColorDistortionTexture, fUV + distortionOffset).rg;
  vec4 baseColor = texture(baseColorTexture, baseColorUV * baseColorTilingScale);

  float forceFieldIntensity =
      texture(
        forceFieldIntensityTexture,
        (fUV + forceFieldIntensityDisplacement) * intensityTilingScale).r;
  vec4 forceFieldPatternColor = forceFieldIntensity
      * texture(forceFieldPatternTexture, fUV * forceFieldTilingScale);

  float baseColorIntensity = 1.0 - forceFieldPatternColor.a;
  float forceFieldColorIntensity = forceFieldPatternColor.a;

  color = (baseColor * 4.0 + vec4(forceFieldColor, 1.0)) * baseColorIntensity / 5.0
          + forceFieldPatternColor * forceFieldColorIntensity;
}`;

type Attribs = {
  Pos: number,
  UV: number,
};

type Uniforms = {
  MatWorld: WebGLUniformLocation,
  MatView: WebGLUniformLocation,
  MatProj: WebGLUniformLocation,

  ForceFieldColor: WebGLUniformLocation,
  ForceFieldIntensityDisplacement: WebGLUniformLocation,
  DistortionOffset: WebGLUniformLocation,

  BaseColorTilingScale: WebGLUniformLocation,
  IntensityTilingScale: WebGLUniformLocation,
  ForceFieldTilingScale: WebGLUniformLocation,

  BaseColorTexture: WebGLUniformLocation,
  BaseColorDistortionTexture: WebGLUniformLocation,
  ForceFieldIntensityTexture: WebGLUniformLocation,
  ForceFieldPatternTexture: WebGLUniformLocation,
};

export type ArenaWallRenderCall = {
  MatWorld: mat4,
  MatView: mat4,
  MatProj: mat4,

  ForceFieldColor: vec3,
  ForceFieldIntensityDisplacement: vec2,
  DistortionOffset: vec2,

  BaseColorTilingScale: vec2,
  IntensityTilingScale: vec2,
  ForceFieldTilingScale: vec2,

  BaseColorTexture: Texture,
  BaseColorDistortionTexture: Texture,
  ForceFieldIntensityTexture: Texture,
  ForceFieldPatternTexture: Texture,

  Geo: ArenaWallGeo,
};

export class ArenaWallShader {
  private constructor(
    private program: WebGLProgram,
    private attribs: Attribs,
    private uniforms: Uniforms) {}

  static create(gl: WebGL2RenderingContext): ArenaWallShader|null {
    const program = ShaderUtils.createShaderFromSource(gl, 'arenaWallShader', VS_TEXT, FS_TEXT);
    if (!program) {
      return null;
    }

    const matWorld = gl.getUniformLocation(program, 'matWorld');
    const matView = gl.getUniformLocation(program, 'matView');
    const matProj = gl.getUniformLocation(program, 'matProj');
    const ForceFieldColor = gl.getUniformLocation(program, 'forceFieldColor');
    const ForceFieldIntensityDisplacement = gl.getUniformLocation(program, 'forceFieldIntensityDisplacement');
    const DistortionOffset = gl.getUniformLocation(program, 'distortionOffset');
    const BaseColorTilingScale = gl.getUniformLocation(program, 'baseColorTilingScale');
    const IntensityTilingScale = gl.getUniformLocation(program, 'intensityTilingScale');
    const ForceFieldTilingScale = gl.getUniformLocation(program, 'forceFieldTilingScale');
    const BaseColorTexture = gl.getUniformLocation(program, 'baseColorTexture');
    const BaseColorDistortionTexture = gl.getUniformLocation(program, 'baseColorDistortionTexture');
    const ForceFieldIntensityTexture = gl.getUniformLocation(program, 'forceFieldIntensityTexture');
    const ForceFieldPatternTexture = gl.getUniformLocation(program, 'forceFieldPatternTexture');
    if (!matWorld || !matView || !matProj || !ForceFieldColor || !DistortionOffset
        || !ForceFieldIntensityDisplacement || !BaseColorTexture || !BaseColorDistortionTexture
        || !ForceFieldIntensityTexture || !ForceFieldPatternTexture
        || !BaseColorTilingScale || !IntensityTilingScale || !ForceFieldTilingScale) {
      console.error(`Failed to get all uniform locations for arena wall shader: {
        MatWorld: ${matWorld},
        MatView: ${matView},
        MatProj: ${matProj},
        ForceFieldColor: ${ForceFieldColor},
        ForceFieldIntensityDisplacement: ${ForceFieldIntensityDisplacement},
        DistortionOffset: ${DistortionOffset},
        BaseColorTexture: ${BaseColorTexture},
        BaseColorDistortionTexture: ${BaseColorDistortionTexture},
        ForceFieldIntensityTexture: ${ForceFieldIntensityTexture},
        ForceFieldPatternTexture: ${ForceFieldPatternTexture},
        BaseColorTilingScale: ${BaseColorTilingScale},
        IntensityTilingScale: ${IntensityTilingScale},
        ForceFieldTilingScale: ${ForceFieldTilingScale},
      }`);
      return null;
    }

    const posAttrib = gl.getAttribLocation(program, 'pos');
    const uvAttrib = gl.getAttribLocation(program, 'uv');
    if (posAttrib < 0 || uvAttrib < 0) {
      console.error(`Failed to get all attrib locations for arena wall shader: {
        Pos: ${posAttrib},
        UV: ${uvAttrib},
      }`);
      return null;
    }

    return new ArenaWallShader(program, {
      Pos: posAttrib,
      UV: uvAttrib,
    }, {
      MatWorld: matWorld,
      MatView: matView,
      MatProj: matProj,
      BaseColorDistortionTexture, BaseColorTexture, DistortionOffset, ForceFieldColor,
      ForceFieldIntensityDisplacement, ForceFieldIntensityTexture, ForceFieldPatternTexture,
      BaseColorTilingScale, ForceFieldTilingScale, IntensityTilingScale,
    });
  }

  getAttribLocations(): Attribs {
    return {...this.attribs};
  }

  activate(gl: WebGL2RenderingContext) {
    gl.useProgram(this.program);
  }

  render(gl: WebGL2RenderingContext, call: ArenaWallRenderCall) {
    gl.uniformMatrix4fv(this.uniforms.MatProj, false, call.MatProj);
    gl.uniformMatrix4fv(this.uniforms.MatView, false, call.MatView);
    gl.uniformMatrix4fv(this.uniforms.MatWorld, false, call.MatWorld);

    gl.uniform3fv(this.uniforms.ForceFieldColor, call.ForceFieldColor);
    gl.uniform2fv(this.uniforms.ForceFieldIntensityDisplacement, call.ForceFieldIntensityDisplacement);
    gl.uniform2fv(this.uniforms.DistortionOffset, call.DistortionOffset);

    gl.uniform2fv(this.uniforms.BaseColorTilingScale, call.BaseColorTilingScale);
    gl.uniform2fv(this.uniforms.IntensityTilingScale, call.IntensityTilingScale);
    gl.uniform2fv(this.uniforms.ForceFieldTilingScale, call.ForceFieldTilingScale);

    gl.uniform1i(this.uniforms.BaseColorTexture, 0);
    gl.uniform1i(this.uniforms.BaseColorDistortionTexture, 1);
    gl.uniform1i(this.uniforms.ForceFieldIntensityTexture, 2);
    gl.uniform1i(this.uniforms.ForceFieldPatternTexture, 3);

    call.BaseColorTexture.bind(gl, 0);
    call.BaseColorDistortionTexture.bind(gl, 1);
    call.ForceFieldIntensityTexture.bind(gl, 2);
    call.ForceFieldPatternTexture.bind(gl, 3);

    gl.bindVertexArray(call.Geo.vao);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, call.Geo.ib);
    gl.drawElements(
      gl.TRIANGLES, call.Geo.numIndices, IBDescBitWidthToType[call.Geo.ibDesc.BitWidth], 0);
  }
}
