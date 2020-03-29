import { IBData, IBDesc } from './ibdesc';

export type LambertGeoRawVertexData = {
  PosAttribLocation: number,
  NormalAttribLocation: number,
  UVAttribLocation: number,

  PositionData: Float32Array|ArrayBuffer,
  NormalData: Float32Array|ArrayBuffer,
  UVData: Float32Array|ArrayBuffer,
};

export class LambertGeo {
  constructor(
    public readonly vao: WebGLVertexArrayObject,
    public readonly ib: WebGLBuffer,
    public readonly numIndices: number,
    public readonly ibDesc: IBDesc,
    public readonly uvBuffer: WebGLBuffer) {}

  static create(gl: WebGL2RenderingContext, rawVertexData: LambertGeoRawVertexData, ibData: IBData): LambertGeo|null {
    const posVB = gl.createBuffer();
    const normalVB = gl.createBuffer();
    const uvVB = gl.createBuffer();
    const ib = gl.createBuffer();
    const vao = gl.createVertexArray();

    if (!posVB || !normalVB || !uvVB || !ib || !vao) {
      console.error('Could not create LambertGeo WebGL objects, aborting');
      return null;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, posVB);
    gl.bufferData(gl.ARRAY_BUFFER, rawVertexData.PositionData, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, normalVB);
    gl.bufferData(gl.ARRAY_BUFFER, rawVertexData.NormalData, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, uvVB);
    gl.bufferData(gl.ARRAY_BUFFER, rawVertexData.UVData, gl.STATIC_DRAW);

    gl.bindVertexArray(vao);

    gl.enableVertexAttribArray(rawVertexData.PosAttribLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, posVB);
    gl.vertexAttribPointer(rawVertexData.PosAttribLocation, 3, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(rawVertexData.NormalAttribLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, normalVB);
    gl.vertexAttribPointer(rawVertexData.NormalAttribLocation, 3, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(rawVertexData.UVAttribLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, uvVB);
    gl.vertexAttribPointer(rawVertexData.UVAttribLocation, 2, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(null);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, ibData.Data, gl.STATIC_DRAW);

    // TODO (sessamekesh): Why is this necessary? The types should be compatible!
    const ibDesc = { BitWidth: ibData.BitWidth } as IBDesc;
    return new LambertGeo(vao, ib, ibData.Data.length, ibDesc, uvVB);
  }
}
