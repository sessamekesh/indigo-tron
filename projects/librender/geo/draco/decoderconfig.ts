export interface DracoDecoderCreationOptions {
  jsFallbackURL: string,
  wasmLoaderURL: string,
  wasmBinaryURL: string,
};

export type AttributeNameType = 'position'|'normal'|'texcoord'|'boneweight'|'boneidx';

export type BufferDesc = {
  AttributeName: AttributeNameType,
  DataType: 'float32'|'uint32',
};

export type BufferData = {
  Desc: BufferDesc,
  Data: ArrayBuffer,
};
