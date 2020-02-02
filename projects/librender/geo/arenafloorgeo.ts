import { IBDesc, IBData } from './ibdesc';

export type ArenaFloorRawVertexData = {
  PosAttribLocation: number,
  UVAttribLocation: number,
  NormalAttribLocation: number,
  TangentAttribLocation: number,
  BitangentAttribLocation: number,

  PositionData: Float32Array|ArrayBuffer,
  UVData: Float32Array|ArrayBuffer,
  NormalData: Float32Array|ArrayBuffer,
  TangentData: Float32Array|ArrayBuffer,
  BitangentData: Float32Array|ArrayBuffer,
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
    const uvVB = gl.createBuffer();
    const normalVB = gl.createBuffer();
    const tangentVB = gl.createBuffer();
    const bitangentVB = gl.createBuffer();
    const ib = gl.createBuffer();
    const vao = gl.createVertexArray();

    if (!posVB || !uvVB || !normalVB || !tangentVB || !bitangentVB || !ib || !vao) {
      console.error(`Could not create ArenaFloorGeo WebGL objects: {
        PosVB: ${posVB},
        uvVB: ${uvVB},
        normalVB: ${normalVB},
        ib: ${ib},
        vao: ${vao}
      }`);
      return null;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, posVB);
    gl.bufferData(gl.ARRAY_BUFFER, rawVertexData.PositionData, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, uvVB);
    gl.bufferData(gl.ARRAY_BUFFER, rawVertexData.UVData, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, normalVB);
    gl.bufferData(gl.ARRAY_BUFFER, rawVertexData.NormalData, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, tangentVB);
    gl.bufferData(gl.ARRAY_BUFFER, rawVertexData.TangentData, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, bitangentVB);
    gl.bufferData(gl.ARRAY_BUFFER, rawVertexData.BitangentData, gl.STATIC_DRAW);

    gl.bindVertexArray(vao);

    gl.enableVertexAttribArray(rawVertexData.PosAttribLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, posVB);
    gl.vertexAttribPointer(rawVertexData.PosAttribLocation, 3, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(rawVertexData.UVAttribLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, uvVB);
    gl.vertexAttribPointer(rawVertexData.UVAttribLocation, 2, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(rawVertexData.NormalAttribLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, normalVB);
    gl.vertexAttribPointer(rawVertexData.NormalAttribLocation, 3, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(rawVertexData.TangentAttribLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, tangentVB);
    gl.vertexAttribPointer(rawVertexData.TangentAttribLocation, 3, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(rawVertexData.BitangentAttribLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, bitangentVB);
    gl.vertexAttribPointer(rawVertexData.BitangentAttribLocation, 3, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(null);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, ibData.Data, gl.STATIC_DRAW);

    return new ArenaFloorGeo(vao, ib, ibData.Data.length, ibData);
  }
}
