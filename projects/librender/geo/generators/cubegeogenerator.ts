import { LambertShader } from '@librender/shader/lambertshader';
import { LambertGeoRawVertexData } from '../lambertgeo';
import { vec3 } from 'gl-matrix';

export class CubeGeoGenerator {
  static generateLambertCubeGeo(
      gl: WebGL2RenderingContext, lambertShader: LambertShader, halfSize: vec3):
      {vertexData: LambertGeoRawVertexData, indices: Uint8Array} {
    const positions = new Float32Array([
      // Top
      -halfSize[0], halfSize[1], -halfSize[2],
      -halfSize[0], halfSize[1], halfSize[2],
      halfSize[0], halfSize[1], -halfSize[2],
      halfSize[0], halfSize[1], halfSize[2],

      // Left
      -halfSize[0], halfSize[1], halfSize[2],
      -halfSize[0], -halfSize[1], halfSize[2],
      -halfSize[0], -halfSize[1], -halfSize[2],
      -halfSize[0], halfSize[1], -halfSize[2],

      // Right
      halfSize[0], halfSize[1], halfSize[2],
      halfSize[0], -halfSize[1], halfSize[2],
      halfSize[0], -halfSize[1], -halfSize[2],
      halfSize[0], halfSize[1], -halfSize[2],

      // Front
      halfSize[0], halfSize[1], halfSize[2],
      halfSize[0], -halfSize[1], halfSize[2],
      -halfSize[0], -halfSize[1], halfSize[2],
      -halfSize[0], halfSize[1], halfSize[2],

      // Back
      halfSize[0], halfSize[1], -halfSize[2],
      halfSize[0], -halfSize[1], -halfSize[2],
      -halfSize[0], -halfSize[1], -halfSize[2],
      -halfSize[0], halfSize[1], -halfSize[2],

      // Bottom
      -halfSize[0], -halfSize[1], -halfSize[2],
      -halfSize[0], -halfSize[1], halfSize[2],
      halfSize[0], -halfSize[1], halfSize[2],
      halfSize[0], -halfSize[1], -halfSize[2],
    ]);
    const normals = new Float32Array([
      // Top, Left, Right, Front, Back, Bottom
      0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
      -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
      1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
      0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
      0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
      0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
    ]);
    // TODO (sessamekesh): Fix this, this should be normal
    const uvs = new Float32Array([
      0, 0, 0, 1, 1, 0, 1, 1,
      0, 0, 0, 1, 1, 0, 1, 1,
      0, 0, 0, 1, 1, 0, 1, 1,
      0, 0, 0, 1, 1, 0, 1, 1,
      0, 0, 0, 1, 1, 0, 1, 1,
      0, 0, 0, 1, 1, 0, 1, 1,
    ]);
    const indices = new Uint8Array([
      // Top
      0, 1, 2, 0, 2, 3,
      // Left
      5, 4, 6, 6, 4, 7,
      // Right
      8, 9, 10, 8, 10, 11,
      // Front
      13, 12, 14, 15, 14, 12,
      // Back
      16, 17, 18, 16, 18, 19,
      // Bottom
      21, 20, 22, 22, 20, 23,
    ]);
    const attribs = lambertShader.getAttribLocations();
    return {
      vertexData: {
        PosAttribLocation: attribs.Pos,
        PositionData: positions,
        NormalAttribLocation: attribs.Normal,
        NormalData: normals,
        UVAttribLocation: attribs.UV,
        UVData: uvs,
      },
      indices,
    };
  }
}
