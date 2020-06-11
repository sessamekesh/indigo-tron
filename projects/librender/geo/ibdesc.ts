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

export class IBDescUtil {
  static getBitDepth(numVertices: number): 8|16|32 {
    if (numVertices < 2**8) {
      return 8;
    }

    if (numVertices < 2 ** 16) {
      return 16;
    }

    if (numVertices < 2 ** 32) {
      return 32;
    }

    throw new Error(`Input ${numVertices} exceeds maximum size ${2 ** 32}`);
  }

  static createIBData(data: number[]): IBData {
    let max = data[0];
    data.forEach(num => max = Math.max(num, max));
    switch (IBDescUtil.getBitDepth(max)) {
      case 8: return {BitWidth: 8, Data: new Uint8Array(data)};
      case 16: return {BitWidth: 16, Data: new Uint16Array(data)};
      case 32: return {BitWidth: 32, Data: new Uint32Array(data)};
    }
  }
}
