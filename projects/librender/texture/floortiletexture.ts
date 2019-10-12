import { vec4 } from 'gl-matrix';
import { SamplerState, Texture } from './texture';

export class FloorTileTexture {
  static create(
      gl: WebGL2RenderingContext,
      innerColor: vec4,
      outerColor: vec4,
      width: number,
      height: number,
      solidWidth: number,
      fadeWidth: number,
      solidHeight: number,
      fadeHeight: number): Texture {
    const data = new Uint8Array(width * height * 4);
    const color = vec4.create();

    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const fadeToInnerPercent = FloorTileTexture.fadeToInnerPercent(
          row, col, width, height, solidWidth, solidHeight, fadeWidth, fadeHeight);
        vec4.lerp(color, outerColor, innerColor, fadeToInnerPercent);
        const startIdx = ((row * width) + col) * 4;
        data[startIdx] = color[0] * 0xFF;
        data[startIdx+1] = color[1] * 0xFF;
        data[startIdx+2] = color[2] * 0xFF;
        data[startIdx+3] = color[3] * 0xFF;
      }
    }
    const samplerState: SamplerState = {
      MagFilter: 'linear',
      MinFilter: 'linear',
      WrapU: 'repeat',
      WrapV: 'repeat',
    };

    return Texture.createFromData(gl, width, height, data, samplerState);
  }

  private static fadeToInnerPercent(
      row: number, col: number,
      width: number, height: number,
      solidWidth: number, solidHeight: number,
      fadeWidth: number, fadeHeight: number): number {
    return Math.min(
      FloorTileTexture.fadeToInnerPercentOneDimension(row, height, solidHeight, fadeHeight),
      FloorTileTexture.fadeToInnerPercentOneDimension(col, width, solidWidth, fadeWidth));
  }

  private static fadeToInnerPercentOneDimension(
      col: number, width: number, solidWidth: number, fadeWidth: number) {
    if (col < solidWidth) return 0;
    if (col > (width - solidWidth)) return 0;
    if (col < (width - solidWidth - fadeWidth) && col > (solidWidth + fadeWidth)) return 1;

    if (col > (width - solidWidth - fadeWidth)) {
      return (width - col - solidWidth) / fadeWidth;
    } else {
      return (col - solidWidth) / fadeWidth;
    }
  }
}
