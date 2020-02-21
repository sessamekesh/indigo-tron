import { mat4, vec3, vec2, vec4 } from 'gl-matrix';
import { Texture } from '@librender/texture/texture';
import { ArenaFloorGeo } from '@librender/geo/arenafloorgeo';
import { ShaderUtils } from './shaderutils';
import { IBDescBitWidthToType } from '@librender/geo/ibdesc';
import { RenderProvider } from '@librender/renderprovider';
import { OwnedResource } from '@libutil/allocator';
import { FrameSettings } from '@libgamerender/framesettings';

const VS_TEST = `#version 300 es
precision mediump float;

uniform mat4 matProj;
uniform mat4 matView;
uniform mat4 matWorld;

uniform vec3 lightDirection;

in vec3 pos;
in vec2 uv;
in vec3 normal;
in vec3 tangent;
in vec3 bitangent;

out vec3 fTangentSpaceLightDirection;
out vec2 fUV;

void main() {
  mat3 mv3x3 = mat3(matView  * matWorld);
  vec3 cameraSpaceNormal = mv3x3 * normalize(normal);
  vec3 cameraSpaceTangent = mv3x3 * normalize(tangent);
  vec3 cameraSpaceBitangent = mv3x3 * normalize(bitangent);
  mat3 TBN = transpose(mat3(
    cameraSpaceTangent,
    cameraSpaceBitangent,
    cameraSpaceNormal
  ));

  fTangentSpaceLightDirection = TBN * -lightDirection;
  fUV = uv;

  gl_Position = matProj * matView * matWorld * vec4(pos, 1.0);
}`;

const REFLECTIVE_COEFFICIENT = 0.15;

const FS_TEXT = `#version 300 es
precision mediump float;

uniform vec3 lightColor;
uniform vec2 viewportSize;
uniform vec2 uvDownscale;
uniform vec2 floorGlowClampValues;
uniform vec4 floorGlowColor;

uniform sampler2D reflectionTexture;
uniform sampler2D bumpMapTexture;

in vec3 fTangentSpaceLightDirection;
in vec2 fUV;

out vec4 color;

void main() {
  vec2 uv = gl_FragCoord.xy / viewportSize;
  uv.x = 1.0 - uv.x;
  vec4 reflectionColor = texture(reflectionTexture, uv);
  vec3 tangentSpaceNormal = normalize(texture(bumpMapTexture, fUV * uvDownscale).rgb * 2.0 - 1.0);

  // Even though we're using reflection mapping, for now just use bump mapping for lighting strength
  float diffuseCoefficient = clamp(dot(tangentSpaceNormal, fTangentSpaceLightDirection), 0.0, 1.0);
  diffuseCoefficient = floorGlowClampValues.x + (floorGlowClampValues.y - floorGlowClampValues.x) * diffuseCoefficient;

  vec4 diffuseColor = vec4(vec3(0.05) * lightColor, 1.0) * ${1.0 - REFLECTIVE_COEFFICIENT}
        + reflectionColor * ${REFLECTIVE_COEFFICIENT};

  // TODO (sessamekesh): Make this underlying color variable with the frame (red for debugging only)
  color = diffuseCoefficient * diffuseColor + (1.0 - diffuseCoefficient) * floorGlowColor;
}`;

type Attribs = {
  Pos: number,
  UV: number,
  Normal: number,
  Tangent: number,
  Bitangent: number,
};

type Uniforms = {
  MatProj: WebGLUniformLocation,
  MatView: WebGLUniformLocation,
  MatWorld: WebGLUniformLocation,

  UVDownscale: WebGLUniformLocation,
  LightDirection: WebGLUniformLocation,
  BumpMapTexture: WebGLUniformLocation,

  FloorGlowClampValues: WebGLUniformLocation,
  FloorGlowColor: WebGLUniformLocation,

  LightColor: WebGLUniformLocation,
  ViewportSize: WebGLUniformLocation,
  ReflectionTexture: WebGLUniformLocation,
};

export type ArenaFloorRenderCall = {
  MatWorld: mat4,
  MatView: mat4,
  MatProj: mat4,

  LightColor: vec3,
  ViewportSize: vec2,
  ReflectionTexture: Texture,
  BumpMapTexture: Texture,

  Geo: ArenaFloorGeo,
};

export type ArenaFloorFrameSettings = {
  UVDownscaling: number,
  FloorGlowClampMin: number,
  FloorGlowClampMax: number,
  FloorGlowColor: vec4,
};

export type ArenaFloorRenderCall2 = {
  Geo: ArenaFloorGeo,

  MatWorld: OwnedResource<mat4>,
  ViewportSize: OwnedResource<vec2>,

  ReflectionTexture: Texture,
  BumpMapTexture: Texture,
};

export class ArenaFloorShader {
  private constructor(
    private program: WebGLProgram,
    private attribs: Attribs,
    private uniforms: Uniforms) {}

  static getRenderProvider() {
    return new RenderProvider((gl) => ArenaFloorShader.create(gl));
  }

  static create(gl: WebGL2RenderingContext): ArenaFloorShader|null {
    const program = ShaderUtils.createShaderFromSource(gl, 'arenaFloorShader', VS_TEST, FS_TEXT);
    if (!program) {
      return null;
    }

    const matWorld = gl.getUniformLocation(program, 'matWorld');
    const matView = gl.getUniformLocation(program, 'matView');
    const matProj = gl.getUniformLocation(program, 'matProj');
    const lightColor = gl.getUniformLocation(program, 'lightColor');
    const reflectionTexture = gl.getUniformLocation(program, 'reflectionTexture');
    const viewportSize = gl.getUniformLocation(program, 'viewportSize');
    const lightDirection = gl.getUniformLocation(program, 'lightDirection');
    const bumpMapTexture = gl.getUniformLocation(program, 'bumpMapTexture');
    const uvDownscale = gl.getUniformLocation(program, 'uvDownscale');
    const floorGlowClampValues = gl.getUniformLocation(program, 'floorGlowClampValues');
    const floorGlowColor = gl.getUniformLocation(program, 'floorGlowColor');
    if (!matWorld || !matView || !matProj || !lightColor || !reflectionTexture || !viewportSize
        || !lightDirection || !bumpMapTexture || !uvDownscale || !floorGlowClampValues
        || !floorGlowColor) {
      console.error(`Failed to get all uniform locations for arena floor shader, {
        MatWorld: ${matWorld},
        MatView: ${matView},
        MatProj: ${matProj},
        LightColor: ${lightColor},
        ReflectionTexture: ${reflectionTexture},
        ViewportSize: ${viewportSize},
        LightDirection: ${lightDirection},
        BumpMapTexture: ${bumpMapTexture},
        UVDownscale: ${uvDownscale},
        FloorGlowClampValues: ${floorGlowClampValues},
        FloorGlowColor: ${floorGlowColor},
      }`);
      return null;
    }

    const posAttrib = gl.getAttribLocation(program, 'pos');
    const uvAttrib = gl.getAttribLocation(program, 'uv');
    const normalAttrib = gl.getAttribLocation(program, 'normal');
    const tangentAttrib = gl.getAttribLocation(program, 'tangent');
    const bitangentAttrib = gl.getAttribLocation(program, 'bitangent');
    if (posAttrib < 0 || uvAttrib < 0 || normalAttrib < 0 ||
        tangentAttrib < 0 || bitangentAttrib < 0) {
      console.error(`Failed to get all attrib locations for arena floor shader, {
        Pos: ${posAttrib},
        UV: ${uvAttrib},
        Normal: ${normalAttrib},
        Tangent: ${tangentAttrib},
        Bitangent: ${bitangentAttrib},
      }`);
    }

    return new ArenaFloorShader(program, {
      Pos: posAttrib, UV: uvAttrib, Normal: normalAttrib, Tangent: tangentAttrib,
      Bitangent: bitangentAttrib,
    }, {
      MatWorld: matWorld,
      MatView: matView,
      MatProj: matProj,
      LightColor: lightColor,
      ReflectionTexture: reflectionTexture,
      ViewportSize: viewportSize,
      LightDirection: lightDirection,
      BumpMapTexture: bumpMapTexture,
      UVDownscale: uvDownscale,
      FloorGlowClampValues: floorGlowClampValues,
      FloorGlowColor: floorGlowColor,
    });
  }

  getAttribLocations(): Attribs {
    return {...this.attribs};
  }

  activate(gl: WebGL2RenderingContext) {
    gl.useProgram(this.program);
  }

  render(gl: WebGL2RenderingContext, call: ArenaFloorRenderCall) {
    gl.uniformMatrix4fv(this.uniforms.MatProj, false, call.MatProj);
    gl.uniformMatrix4fv(this.uniforms.MatView, false, call.MatView);
    gl.uniformMatrix4fv(this.uniforms.MatWorld, false, call.MatWorld);
    gl.uniform3fv(this.uniforms.LightColor, call.LightColor);
    gl.uniform2fv(this.uniforms.ViewportSize, call.ViewportSize);
    gl.uniform1i(this.uniforms.ReflectionTexture, 0);
    call.ReflectionTexture.bind(gl, 0);
    gl.uniform1i(this.uniforms.BumpMapTexture, 1);
    call.BumpMapTexture.bind(gl, 1);

    gl.bindVertexArray(call.Geo.vao);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, call.Geo.ib);
    gl.drawElements(
      gl.TRIANGLES, call.Geo.numIndices, IBDescBitWidthToType[call.Geo.ibDesc.BitWidth], 0);
  }

  render2(
      gl: WebGL2RenderingContext,
      call: ArenaFloorRenderCall2,
      frameSettings: FrameSettings,
      arenaFloorFrameSettings: ArenaFloorFrameSettings) {
    gl.uniformMatrix4fv(this.uniforms.MatProj, false, frameSettings.MatProj);
    gl.uniformMatrix4fv(this.uniforms.MatView, false, frameSettings.MatView);
    gl.uniformMatrix4fv(this.uniforms.MatWorld, false, call.MatWorld.Value);
    gl.uniform3fv(this.uniforms.LightColor, frameSettings.LightColor);
    gl.uniform3fv(this.uniforms.LightDirection, frameSettings.LightDirection);
    gl.uniform2fv(this.uniforms.ViewportSize, call.ViewportSize.Value);
    gl.uniform1i(this.uniforms.ReflectionTexture, 0);
    call.ReflectionTexture.bind(gl, 0);
    gl.uniform1i(this.uniforms.BumpMapTexture, 1);
    call.BumpMapTexture.bind(gl, 1);

    // TODO (sessamekesh): Pass this in as a parameter to the draw call (based on the floor size?)
    gl.uniform2f(
      this.uniforms.UVDownscale,
      arenaFloorFrameSettings.UVDownscaling,
      arenaFloorFrameSettings.UVDownscaling);

    // TODO (sessamekesh): Make these part of the frame settings, oscillating or whatever
    gl.uniform2f(
      this.uniforms.FloorGlowClampValues,
      arenaFloorFrameSettings.FloorGlowClampMin,
      arenaFloorFrameSettings.FloorGlowClampMax);
    gl.uniform4fv(this.uniforms.FloorGlowColor, arenaFloorFrameSettings.FloorGlowColor);

    gl.bindVertexArray(call.Geo.vao);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, call.Geo.ib);
    gl.drawElements(
      gl.TRIANGLES, call.Geo.numIndices, IBDescBitWidthToType[call.Geo.ibDesc.BitWidth], 0);
  }
}
