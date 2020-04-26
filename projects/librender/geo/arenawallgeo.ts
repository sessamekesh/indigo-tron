import { IBDesc, IBData } from './ibdesc';
import { ArenaWallShader } from '@librender/shader/arenawallshader';

export type ArenaWallRawVertexData = {
  PosAttribLocation: number,
  UVAttribLocation: number,

  PositionData: Float32Array|ArrayBuffer,
  UVData: Float32Array|ArrayBuffer,
};

export class ArenaWallGeo {
  constructor(
    public readonly vao: WebGLVertexArrayObject,
    public readonly ib: WebGLBuffer,
    public readonly numIndices: number,
    public readonly ibDesc: IBDesc) {}

  static create(
      gl: WebGL2RenderingContext,
      rawVertexData: ArenaWallRawVertexData,
      ibData: IBData): ArenaWallGeo|null {
    const posVB = gl.createBuffer();
    const uvVB = gl.createBuffer();
    const ib = gl.createBuffer();
    const vao = gl.createVertexArray();

    if (!posVB || !uvVB || !ib || !vao) {
      console.error(`Could not create ArenaWallGeo WebGL objects: {
        PosVB: ${posVB},
        uvVB: ${uvVB},
        ib: ${ib},
        vao: ${vao}
      }`);
      return null;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, posVB);
    gl.bufferData(gl.ARRAY_BUFFER, rawVertexData.PositionData, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, uvVB);
    gl.bufferData(gl.ARRAY_BUFFER, rawVertexData.UVData, gl.STATIC_DRAW);

    gl.bindVertexArray(vao);

    gl.enableVertexAttribArray(rawVertexData.PosAttribLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, posVB);
    gl.vertexAttribPointer(rawVertexData.PosAttribLocation, 3, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(rawVertexData.UVAttribLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, uvVB);
    gl.vertexAttribPointer(rawVertexData.UVAttribLocation, 2, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(null);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, ibData.Data, gl.STATIC_DRAW);

    return new ArenaWallGeo(vao, ib, ibData.Data.length, ibData);
  }

  static createUnitWall(gl: WebGL2RenderingContext, shader: ArenaWallShader): ArenaWallGeo|null {
    const attribs = shader.getAttribLocations();
    const posData = new Float32Array([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0]);
    const uvData = new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]);
    return ArenaWallGeo.create(gl, {
      PosAttribLocation: attribs.Pos,
      PositionData: posData,
      UVAttribLocation: attribs.UV,
      UVData: uvData,
    }, {
      BitWidth: 8,
      Data: new Uint8Array([0, 1, 2, 0, 2, 3]),
    });
  }
}
