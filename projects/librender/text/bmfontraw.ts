/**
 * Strongly typed version of BMFont that uses the fields we care about
 */
export type BMFontRaw = {
  chars: BMFontRawChar[],
  info: BMFontInfo,
  common: BMFontCommon,
  kernings: BMFontKernings[],
};

type BMFontRawChar = {
  id: number,
  char: string,
  width: number,
  height: number,
  xoffset: number,
  yoffset: number,
  x: number,
  y: number,
  xadvance: number,
};

export type BMFontInfo = {
  charset: string[],
  padding: [number, number, number, number],
  spacing: [number, number],
};

export type BMFontCommon = {
  lineHeight: number,
  base: number,
  scaleW: number,
  scaleH: number,
};

type BMFontKernings = {
  first: number,
  second: number,
  amount: number,
};

export function parseBMFontRaw(val: any): BMFontRaw {
  if (val == null) throw new Error('BMFontRaw must be undefined');

  return {
    chars: assertRawCharArray(val['chars']),
    common: parseFontCommon(val['common']),
    info: parseFontInfo(val['info']),
    kernings: parseFontKernings(val['kernings']),
  };
}

function assertInt(val: any): number {
  const parsedVal = parseInt(val);
  if (isNaN(parsedVal)) throw new Error('NaN');
  return parsedVal;
}

function assertChar(val: any): string {
  if (typeof val !== 'string') throw new Error('Input must be string');
  if (val.length !== 1) throw new Error('Input string must be a single character');

  return val;
}

function assertCharArray(val: any): string[] {
  if (!Array.isArray(val)) throw new Error('char array must be array');
  return val.map(assertChar);
}

function assertRawChar(val: any): BMFontRawChar {
  if (val == null) throw new Error('char value not defined');

  return {
    id: assertInt(val['id']),
    char: assertChar(val['char']),
    height: assertInt(val['height']),
    width: assertInt(val['width']),
    x: assertInt(val['x']),
    xoffset: assertInt(val['xoffset']),
    y: assertInt(val['y']),
    yoffset: assertInt(val['yoffset']),
    xadvance: assertInt(val['xadvance']),
  };
}

function assertRawCharArray(val: any): BMFontRawChar[] {
  if (!Array.isArray(val)) throw new Error('must be array');
  return val.map(assertRawChar);
}

function parseFontInfo(val: any): BMFontInfo {
  if (val == null) throw new Error('info object undefined');

  return {
    charset: assertCharArray(val['charset']),
    padding: [
      assertInt(val['padding'][0]),
      assertInt(val['padding'][1]),
      assertInt(val['padding'][2]),
      assertInt(val['padding'][3]),
    ],
    spacing: [
      assertInt(val['spacing'][0]),
      assertInt(val['spacing'][1]),
    ],
  };
}

function parseFontCommon(input: any): BMFontCommon {
  if (input == null) throw new Error('common object undefined');
  if (assertInt(input['pages']) > 1) throw new Error('Multiple pages not supported');

  return {
    base: assertInt(input['base']),
    lineHeight: assertInt(input['lineHeight']),
    scaleH: assertInt(input['scaleH']),
    scaleW: assertInt(input['scaleW']),
  };
}

function parseFontKernings(input: any): BMFontKernings[] {
  if (input == null) return [];
  if (!Array.isArray(input)) throw new Error('BMFontKernings is not an array type');

  return input.map((val: any) => {
    return {
      first: assertInt(val['first']),
      amount: assertInt(val['amount']),
      second: assertInt(val['second']),
    }
  });
}

// TODO (sessamekesh): Continue writing the parser here!
// Don't forget to minify OpenSans-Regular-msdf when you're done!
