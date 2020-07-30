import { GeoBase } from '@librender/geo/geobase';
import { SolidColorUiShaderAttribType, SolidColorUiShader } from './solidcolorui.shader';

export class HalfCircleGeoGenerator {
  static generate(
      gl: WebGL2RenderingContext,
      shader: SolidColorUiShader,
      radius: number,
      startAngle: number,
      numPoints: number): GeoBase<SolidColorUiShaderAttribType>|null {
    const verts = [0, 0];
    const indices: number[] = [];
    for (let i = 0; i < numPoints; i++) {
      const angle = startAngle + (i / (numPoints - 1)) * Math.PI;
      verts.push(Math.sin(angle) * radius, Math.cos(angle) * radius);
      if (i > 0) {
        indices.push(0, i, i + 1);
      }
    }

    return GeoBase.create(
      gl, shader.getAttribLocations(),
      {
        pos: {
          data: new Float32Array(verts),
          dataType: 'float',
          sizePerElement: 2,
        }
      }, {
        BitWidth: 16,
        Data: new Uint16Array(indices),
      });
  }
}
