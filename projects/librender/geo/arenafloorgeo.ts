import { IBDesc, IBData } from './ibdesc';

export type ArenaFloorRawVertexData = {
  PosAttribLocation: number,
  NormalAttribLocation: number,

  PositionData: Float32Array|ArrayBuffer,
  NormalData: Float32Array|ArrayBuffer,
};

export class ArenaFloorGeo {
  constructor(
    public readonly vao: WebGLVertexArrayObject,
    public readonly ib: WebGLBuffer,
    public readonly numIndices: number,
    public readonly ibDesc: IBDesc) {}

  static create(
      gl: WebGL2RenderingContext,
      rawVertexData: ArenaFloorRawVertexData,
      ibData: IBData): ArenaFloorGeo|null {
    const posVB = gl.createBuffer();
    const normalVB = gl.createBuffer();
    const ib = gl.createBuffer();
    const vao = gl.createVertexArray();

    if (!posVB || !normalVB || !ib || !vao) {
      console.error(`Could not create ArenaFloorGeo WebGL objects: {
        PosVB: ${posVB},
        normalVB: ${normalVB},
        ib: ${ib},
        vao: ${vao}
      }`);
      return null;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, posVB);
    gl.bufferData(gl.ARRAY_BUFFER, rawVertexData.PositionData, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, normalVB);
    gl.bufferData(gl.ARRAY_BUFFER, rawVertexData.NormalData, gl.STATIC_DRAW);

    gl.bindVertexArray(vao);

    gl.enableVertexAttribArray(rawVertexData.PosAttribLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, posVB);
    gl.vertexAttribPointer(rawVertexData.PosAttribLocation, 3, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(rawVertexData.NormalAttribLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, normalVB);
    gl.vertexAttribPointer(rawVertexData.NormalAttribLocation, 3, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(null);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, ibData.Data, gl.STATIC_DRAW);

    return new ArenaFloorGeo(vao, ib, ibData.Data.length, ibData);
  }
}
