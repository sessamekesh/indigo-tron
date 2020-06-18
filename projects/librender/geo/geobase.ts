import { IBDesc, IBData } from './ibdesc';

export type AttribLocationsType<AttribNamesType extends BasicMapType> = {
  [Key in keyof AttribNamesType]: number;
};

type VertexInputType = {
  data: Float32Array|ArrayBuffer,
  dataType: 'float',
  sizePerElement: 1|2|3|4,
};

type BasicMapType = {[id: string]: any};

export type AttribBuffersType<AttribNamesType extends BasicMapType> = {
  [Key in keyof AttribNamesType]: VertexInputType;
};

function getGlTypeFromVert(t: VertexInputType) {
  switch (t.dataType) {
    case 'float': return WebGL2RenderingContext.FLOAT;
    default: throw new Error('Not implemented: getGlTypeFromVert');
  }
}

export class GeoBase {
  protected constructor(
    public readonly vao: WebGLVertexArrayObject,
    public readonly ib: WebGLBuffer,
    public readonly numIndices: number,
    public readonly ibDesc: IBDesc) {}

  static create<AttribNamesType extends BasicMapType>(
      gl: WebGL2RenderingContext,
      attribLocations: AttribLocationsType<AttribNamesType>,
      attribBuffers: AttribBuffersType<AttribNamesType>,
      ibData: IBData): GeoBase|null {
    const attribNames = Object.keys(attribLocations);
    const buffers: {[i: string]: (WebGLBuffer|null)} = {};
    attribNames.forEach((attribName) => {
      buffers[attribName] = gl.createBuffer();
    });
    const vao = gl.createVertexArray();
    const ib = gl.createBuffer();
    if (Object.values(buffers).some(buffer => buffer == null) || !vao || !ib) {
      console.error('Could not create all WebGL objects for geo, aborting');
      return null;
    }

    attribNames.forEach((attribName) => {
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers[attribName]);
      gl.bufferData(gl.ARRAY_BUFFER, attribBuffers[attribName].data, gl.STATIC_DRAW);
    });

    gl.bindVertexArray(vao);
    attribNames.forEach((attribName) => {
      gl.enableVertexAttribArray(attribLocations[attribName]);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers[attribName]);
      gl.vertexAttribPointer(
        attribLocations[attribName],
        attribBuffers[attribName].sizePerElement,
        getGlTypeFromVert(attribBuffers[attribName]),
        false,
        0,
        0);
    });

    gl.bindVertexArray(null);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, ibData.Data, gl.STATIC_DRAW);

    const ibDesc = { BitWidth: ibData.BitWidth };
    return new GeoBase(vao, ib, ibData.Data.length, ibDesc);
  }
}
