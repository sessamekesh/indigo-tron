import { loadImage } from '@libutil/loadutils';

type TextureWrapType = 'repeat'|'clamp-to-edge';
type FilterType = 'linear';
export type SamplerState = {
  WrapU: TextureWrapType,
  WrapV: TextureWrapType,
  MinFilter: FilterType,
  MagFilter: FilterType,
};

const DEFAULT_SAMPLER_STATE: SamplerState = {
  MinFilter: 'linear',
  MagFilter: 'linear',
  WrapU: 'clamp-to-edge',
  WrapV: 'clamp-to-edge',
};

export class Texture {
  constructor(
    public readonly tex: WebGLTexture,
    private samplerState: SamplerState) {}

  static getTextureWrapGL(type: TextureWrapType) {
    switch (type) {
      case 'repeat': return WebGL2RenderingContext.REPEAT;
      case 'clamp-to-edge': return WebGL2RenderingContext.CLAMP_TO_EDGE;
      default: throw new Error('Not implemented');
    }
  }

  static getTextureFilterTypeGL(type: FilterType) {
    switch (type) {
      case 'linear': return WebGL2RenderingContext.LINEAR;
      default: throw new Error('Not implemented');
    }
  }

  static async createFromURL(
      gl: WebGL2RenderingContext,
      url: string,
      samplerState: SamplerState = DEFAULT_SAMPLER_STATE) {
    const tex = gl.createTexture();
    if (!tex) {
      throw new Error('Could not create GL texture object');
    }
    const img = await loadImage(url);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, Texture.getTextureWrapGL(samplerState.WrapU));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, Texture.getTextureWrapGL(samplerState.WrapV));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, Texture.getTextureFilterTypeGL(samplerState.MinFilter));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, Texture.getTextureFilterTypeGL(samplerState.MagFilter));

    return new Texture(tex, samplerState);
  }

  static createFromData(
      gl: WebGL2RenderingContext,
      width: number,
      height: number,
      data: Uint8Array,
      samplerState: SamplerState = DEFAULT_SAMPLER_STATE) {
    const tex = gl.createTexture();
    if (!tex) {
      throw new Error('Could not create GL texture object');
    }
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, Texture.getTextureWrapGL(samplerState.WrapU));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, Texture.getTextureWrapGL(samplerState.WrapV));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, Texture.getTextureFilterTypeGL(samplerState.MinFilter));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, Texture.getTextureFilterTypeGL(samplerState.MagFilter));

    return new Texture(tex, samplerState);
  }

  bind(gl: WebGL2RenderingContext, slot: number = 0) {
    gl.activeTexture(gl.TEXTURE0 + slot);
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
  }

  setWrapU(gl: WebGL2RenderingContext, wrapType: TextureWrapType) {
    if (wrapType === this.samplerState.WrapU) {
      return;
    }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, Texture.getTextureWrapGL(wrapType));
  }
}