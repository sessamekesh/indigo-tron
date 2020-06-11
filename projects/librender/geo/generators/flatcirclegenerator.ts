import { Solid2DShader } from '@librender/shader/solid2dshader';
import { GeoBase } from '../geobase';

export class FlatCircleGenerator {
  static generateUnitSolid2DCircle(
      gl: WebGL2RenderingContext,
      shader: Solid2DShader,
      xRadius: number,
      yRadius: number,
      numPoints: number) {
    const vb = new Float32Array((numPoints + 1) * 2);
    vb[0] = 0;
    vb[1] = 0;
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      vb[i * 2] = Math.sin(angle) * xRadius;
      vb[i * 2 + 1] = Math.cos(angle) * yRadius;
    }

    const ib = new Uint8Array(numPoints * 2 * 3);
    for (let i = 0; i < numPoints; i++) {
      const firstPoint = i;
      const nextPoint = (i + 1) % numPoints;
      ib[i * 3] = 0;
      ib[i * 3 + 1] = firstPoint;
      ib[i * 3 + 2] = nextPoint;
    }

    return GeoBase.create(
      gl, shader.getAttribLocations(), {
        Pos: {
          data: vb,
          dataType: 'float',
          sizePerElement: 2,
        },
      }, {
        BitWidth: 8,
        Data: ib,
      });
  }
}
