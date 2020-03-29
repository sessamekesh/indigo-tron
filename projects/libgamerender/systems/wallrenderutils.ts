import { LambertShader } from '@librender/shader/lambertshader';
import { LambertGeoRawVertexData, LambertGeo } from '@librender/geo/lambertgeo';
import { IBData } from '@librender/geo/ibdesc';
import { SegmentUV } from '@libutil/scene/slidingtexturelookup';

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

  static setFullUvs(gl: WebGL2RenderingContext, lambertGeo: LambertGeo, cache: Float32Array) {
    gl.bindBuffer(gl.ARRAY_BUFFER, lambertGeo.uvBuffer);
    cache.set([
      0, 0, 1, 0, 0, 1, 1, 1,
      0, 0, 1, 0, 0, 1, 1, 1,
      0, 0, 1, 0, 0, 1, 1, 1,
    ]);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, cache, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  static setUVs(
      gl: WebGL2RenderingContext, lambertGeo: LambertGeo, uvs: SegmentUV, cache: Float32Array) {
    gl.bindBuffer(gl.ARRAY_BUFFER, lambertGeo.uvBuffer);

    // Ordering: UL, LL, UR, LR x4
    // TODO (sessamekesh): This needs to be verified and almost certainly corrected...
    cache[0] = cache[8] = cache[16] = uvs.TopLeft[0];
    cache[1] = cache[9] = cache[17] = uvs.TopLeft[1];
    cache[2] = cache[10] = cache[18] = uvs.BottomLeft[0];
    cache[3] = cache[11] = cache[19] = uvs.BottomLeft[1];
    cache[4] = cache[12] = cache[20] = uvs.TopRight[0];
    cache[5] = cache[13] = cache[21] = uvs.TopRight[1];
    cache[6] = cache[14] = cache[22] = uvs.BottomRight[0];
    cache[7] = cache[15] = cache[23] = uvs.BottomRight[1];

    gl.bufferSubData(gl.ARRAY_BUFFER, 0, cache);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }
}
