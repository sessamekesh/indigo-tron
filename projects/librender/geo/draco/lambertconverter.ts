import { LambertGeo } from '../lambertgeo';
import { BufferData, BufferDesc } from './decoderconfig';
import { IBData } from '../ibdesc';
import { LambertShader } from '@librender/shader/lambertshader';

export class LambertConverter {
  static generateLambertGeo(
      gl: WebGL2RenderingContext,
      lambertShader: LambertShader,
      decodingResult: BufferData[],
      indexData: IBData): LambertGeo|null {
    const positionBuffer = decodingResult.find(buffer => buffer.Desc.AttributeName === 'position');
    const normalBuffer = decodingResult.find(buffer => buffer.Desc.AttributeName === 'normal');
    const uvBuffer = decodingResult.find(buffer => buffer.Desc.AttributeName === 'texcoord');

    if (!positionBuffer || !normalBuffer || !uvBuffer) {
      console.error('Could not find all required Lambert buffers from decoding result, aborting');
      return null;
    }

    const attribs = lambertShader.getAttribLocations();

    return LambertGeo.create(
      gl, {
        PositionData: positionBuffer.Data,
        PosAttribLocation: attribs.Pos,
        NormalData: normalBuffer.Data,
        NormalAttribLocation: attribs.Normal,
        UVAttribLocation: attribs.UV,
        UVData: uvBuffer.Data,
      }, indexData);
  }

  static readonly BUFFER_DESC: BufferDesc[] = [
    { AttributeName: 'position', DataType: 'float32' },
    { AttributeName: 'normal', DataType: 'float32' },
    { AttributeName: 'texcoord', DataType: 'float32' },
  ];
}
