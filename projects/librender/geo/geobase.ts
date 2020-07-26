import { IBDesc, IBData } from './ibdesc';

export type AttribLocationsType<AttribNamesType extends BasicMapType> = {
  [Key in keyof AttribNamesType]: number;
};

type GLBuffersType<AttribTypesName extends BasicMapType> = {
  [Key in keyof AttribTypesName]: WebGLBuffer
};

type PartialNull<T> = {
  [P in keyof T]: T[P]|null;
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

function isFullBuffersObject<AttribNamesType extends BasicMapType>(
    obj: GLBuffersType<AttribNamesType>|PartialNull<GLBuffersType<AttribNamesType>>)
    : obj is GLBuffersType<AttribNamesType> {
  return Object.keys(obj).every(buffer => buffer != null);
}

export class GeoBase<AttribNamesType extends BasicMapType> {
  protected constructor(
    public readonly vao: WebGLVertexArrayObject,
    public readonly buffers: GLBuffersType<AttribNamesType>,
    public readonly ib: WebGLBuffer,
    public numIndices: number,
    public readonly ibDesc: IBDesc) {}

  static create<AttribNamesType extends BasicMapType>(
      gl: WebGL2RenderingContext,
      attribLocations: AttribLocationsType<AttribNamesType>,
      attribBuffers: AttribBuffersType<AttribNamesType>,
      ibData: IBData): GeoBase<AttribNamesType>|null {
    const attribNames = Object.keys(attribLocations);
    const buffers = {} as PartialNull<GLBuffersType<AttribNamesType>>|GLBuffersType<AttribNamesType>;
    attribNames.forEach((attribName) => {
      (buffers as any)[attribName] = gl.createBuffer();
    });
    const vao = gl.createVertexArray();
    const ib = gl.createBuffer();
    if (!isFullBuffersObject(buffers) || !vao || !ib) {
      console.error('Could not create all WebGL objects for geo, aborting');
      return null;
    }

    attribNames.forEach((attribName) => {
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers[attribName]);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        attribBuffers[attribName].data,
        gl.STATIC_DRAW);
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
    return new GeoBase(vao, buffers, ib, ibData.Data.length, ibDesc);
  }
}
