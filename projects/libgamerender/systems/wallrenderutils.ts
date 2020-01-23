import { LambertShader } from '@librender/shader/lambertshader';
import { LambertGeoRawVertexData, LambertGeo } from '@librender/geo/lambertgeo';
import { IBData } from '@librender/geo/ibdesc';

export class WallRenderUtils {
  static generateWallGeo(
      gl: WebGL2RenderingContext, lambertShader: LambertShader, length: number, height: number) {
    const attribs = lambertShader.getAttribLocations();
    const lambertRawData: LambertGeoRawVertexData = {
      PosAttribLocation: attribs.Pos,
      NormalAttribLocation: attribs.Normal,
      UVAttribLocation: attribs.UV,

      PositionData: new Float32Array([
        -length, -0.5, 0.035, length, -0.5, 0.035, -length, height-0.5, 0.035, length, height-0.5, 0.035,
        -length, -0.5, -0.035, length, -0.5, -0.035, -length, height-0.5, -0.035, length, height-0.5, -0.035,
        -length, height-0.5, 0.035, length, height-0.5, 0.035, -length, height-0.5, -0.035, length, height-0.5, -0.035,
      ]),
      NormalData: new Float32Array([
        0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
        0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
        0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
      ]),
      UVData: new Float32Array([
        0, 0, 1, 0, 0, 1, 1, 1,
        0, 0, 1, 0, 0, 1, 1, 1,
        0, 0, 1, 0, 0, 1, 1, 1,
      ]),
    };
    const indexData: IBData = {
      BitWidth: 8,
      Data: new Uint8Array([
        0, 1, 2, 2, 1, 3,
        4, 6, 5, 6, 5, 7,
        8, 9, 10, 9, 10, 11
      ]),
    };
    const geo = LambertGeo.create(gl, lambertRawData, indexData);
    if (!geo) {
      throw new Error('Failed to generate geometry');
    }
    return geo;
  }
}
