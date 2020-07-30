import { vec2 } from 'gl-matrix';
import { SolidColorUiShader, SolidColorUiShaderAttribType } from './solidcolorui.shader';
import { GeoBase } from '@librender/geo/geobase';

export class RectangleGeoGenerator {
  static createRectangle(
      gl: WebGL2RenderingContext,
      shader: SolidColorUiShader,
      halfSize: vec2): GeoBase<SolidColorUiShaderAttribType>|null {
    return GeoBase.create(
      gl,
      shader.getAttribLocations(),
      {
        pos: {
          data: new Float32Array([
            // TL
            -halfSize[0], halfSize[1],
            // TR
            halfSize[0], halfSize[1],
            // BL
            -halfSize[0], -halfSize[1],
            // BR
            halfSize[0], -halfSize[1],
          ]),
          dataType: 'float',
          sizePerElement: 2,
        }
      }, {
        BitWidth: 8,
        Data: new Uint8Array([0, 2, 1, 1, 2, 3]),
      });
  }
}
