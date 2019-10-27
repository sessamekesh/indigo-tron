import { vec4 } from 'gl-matrix';
import { SamplerState, Texture } from './texture';

export class FlatTexture {
  static create(
      gl: WebGL2RenderingContext,
      color: vec4,
      width: number,
      height: number) {
    const data = new Uint8Array(width * height * 4);
    for (let pixel = 0; pixel < (width * height); pixel++) {
      data[pixel * 4] = color[0] * 0xFF;
      data[pixel * 4 + 1] = color[1] * 0xFF;
      data[pixel * 4 + 2] = color[2] * 0xFF;
      data[pixel * 4 + 3] = color[3] * 0xFF;
    }
    const samplerState: SamplerState = {
      MagFilter: 'linear',
      MinFilter: 'linear',
      WrapU: 'clamp-to-edge',
      WrapV: 'clamp-to-edge',
    };

    return Texture.createFromData(gl, width, height, data, samplerState);
  }
}
