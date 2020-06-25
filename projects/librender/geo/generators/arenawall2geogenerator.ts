import { ArenaWallShader2 } from '@librender/shader/arenawallshader2';
import { GeoBase } from '../geobase';

export class ArenaWall2GeoGenerator {
  static createUnitWall(gl: WebGL2RenderingContext, shader: ArenaWallShader2): GeoBase|null {
    const attribs = shader.getAttribLocations();
    return GeoBase.create(gl, attribs, {
      pos: {
        data: new Float32Array([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0]),
        dataType: 'float',
        sizePerElement: 3,
      },
      uv: {
        data: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
        dataType: 'float',
        sizePerElement: 2,
      },
    }, {
      BitWidth: 8,
      Data: new Uint8Array([0, 1, 2, 0, 2, 3]),
    });
  }
}
