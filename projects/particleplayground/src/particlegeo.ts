import { ParticleShader } from "./particleshader";
import { GeoBase } from "@librender/geo/geobase";

export class ParticleGeo {
  static createUnitSquareParticle(
      gl: WebGL2RenderingContext,
      shader: ParticleShader) {
    const halfSize = 0.5;
    const vb = new Float32Array([
      halfSize, halfSize, 0,
      halfSize, -halfSize, 0,
      -halfSize, -halfSize, 0,
      -halfSize, halfSize, 0,
    ]);
    const uvs = new Float32Array([1, 1, 1, 0, 0, 0, 0, 1]);
    const indices = new Uint8Array([1, 0, 2, 3, 2, 0]);
    const attribs = shader.getAttribLocations();

    return GeoBase.create(gl, attribs, {
      pos: {
        data: vb,
        dataType: 'float',
        sizePerElement: 3,
      },
      uv: {
        data: uvs,
        dataType: 'float',
        sizePerElement: 2,
      },
    }, {
      BitWidth: 8,
      Data: indices,
    });
  }
}
