interface IndexBufferBitWidthMap {
  8: Uint8Array,
  16: Uint16Array,
  32: Uint32Array,
};

type IBDescBase<BitWidth extends keyof IndexBufferBitWidthMap> = {
  BitWidth: BitWidth,
};

type IBDataBase<BitWidth extends keyof IndexBufferBitWidthMap> = {
  BitWidth: BitWidth,
  Data: IndexBufferBitWidthMap[BitWidth],
};

export type IBData = IBDataBase<8> | IBDataBase<16> | IBDataBase<32>;
export type IBDesc = IBDescBase<8> | IBDescBase<16> | IBDescBase<32>;
export const IBDescBitWidthToType = {
  8: WebGL2RenderingContext.UNSIGNED_BYTE,
  16: WebGL2RenderingContext.UNSIGNED_SHORT,
  32: WebGL2RenderingContext.UNSIGNED_INT,
};
