import { ShaderUtils } from './shaderutils';
import { mat4 } from 'gl-matrix';

export type UniformLocationsType<UniformsType> = {
  [Key in keyof UniformsType]: WebGLUniformLocation;
};

export type AttribLocationsType<AttribsType> = {
  [Key in keyof AttribsType]: number;
};

export type NamesType = {[name: string]: string};

type GenericUniformLocationsType = {[key: string]: WebGLUniformLocation};
type GenericAttribsLocationsType = {[key: string]: number};

export abstract class ShaderBase<AttribsType extends NamesType, UniformsType extends NamesType> {
  protected constructor(
    private program: WebGLProgram,
    protected attribs: AttribLocationsType<AttribsType>,
    protected uniforms: UniformLocationsType<UniformsType>) {}

  protected static createInternal<AttribsType extends NamesType, UniformsType extends NamesType>(
      gl: WebGL2RenderingContext,
      shaderName: string,
      vsText: string,
      fsText: string,
      attribNames: AttribsType,
      uniformNames: UniformsType): {
        attribs: AttribLocationsType<AttribsType>,
        uniforms: UniformLocationsType<UniformsType>,
        program: WebGLProgram,
      }|null {
    const program = ShaderUtils.createShaderFromSource(gl, shaderName, vsText, fsText);
    if (!program) {
      return null;
    }

    const attribs = Object.entries(attribNames).map(([attribKey, attribName]) => {
      return {
        name: attribKey,
        location: gl.getAttribLocation(program, attribName),
      };
    });
    const uniforms = Object.entries(uniformNames).map(([uniformKey, uniformName]) => {
      return {
        name: uniformKey,
        location: gl.getUniformLocation(program, uniformName),
      };
    });

    const missingAttribNames =
        attribs.filter(attrib => attrib.location < 0)
          .map(attrib => attrib.name);
    const missingUniformNames =
        uniforms.filter(uniform => uniform.location == null)
          .map(uniform => uniform.name);

    if (missingAttribNames.length > 0) {
      console.error(`Failed to get all attribs for ${shaderName}: ${missingAttribNames.join(',')}`);
      return null;
    }

    if (missingUniformNames.length > 0) {
      console.error(`Failed to get all uniforms for ${shaderName}: ${missingUniformNames.join(',')}`);
      return null;
    }

    const wrappedUniforms: GenericUniformLocationsType = {};
    const wrappedAttribs: GenericAttribsLocationsType = {};

    attribs.forEach((attrib) => wrappedAttribs[attrib.name] = attrib.location);
    uniforms.forEach((uniform) => wrappedUniforms[uniform.name] = uniform.location!);

    // Gross type assertion allows us to do this shit
    return {program, attribs: wrappedAttribs as any, uniforms: wrappedUniforms as any};
  }

  getAttribLocations(): AttribLocationsType<AttribsType> {
    return {...this.attribs};
  }

  activate(gl: WebGL2RenderingContext) {
    gl.useProgram(this.program);
  }
}
