import { Glyph } from './glyph';
import { Texture } from '@librender/texture/texture';
import { loadJson } from '@libutil/loadutils';
import { parseBMFontRaw, BMFontCommon, BMFontInfo } from './bmfontraw';

type DeepReadonly<T> =
    T extends (infer R)[] ? DeepReadonlyArray<R> :
    T extends Function ? T :
    T extends object ? DeepReadonlyObject<T> :
    T;

interface DeepReadonlyArray<T> extends ReadonlyArray<DeepReadonly<T>> {}

type DeepReadonlyObject<T> = {
    readonly [P in keyof T]: DeepReadonly<T[P]>;
};

/**
 * Wrapper around the BMFont type, as exported by msdf-bmfont-web tool
 */
export class BMFont {
  private glyphs = new Map<string, Glyph>();
  private kernings = new Map<string, Map<string, number>>();

  private constructor(
    public readonly texture: Texture,
    public readonly fontCommon: DeepReadonly<BMFontCommon>,
    public readonly fontInfo: DeepReadonly<BMFontInfo>,
    public readonly errorGlyph: Glyph) {}

  getGlyph(char: string): Glyph|undefined {
    return this.glyphs.get(char);
  }

  getKerning(charA: string, charB: string): number {
    // Notice: || against number|undefined OK because default value is only falsy value (0)
    return this.kernings.get(charA)?.get(charB) || 0;
  }

  private addGlyph(char: string, glyph: Glyph) {
    this.glyphs.set(char, glyph);
  }

  static async loadFromFile(
      gl: WebGL2RenderingContext,
      bmJsonUrl: string,
      atlasImageUrl: string,
      errorSymbol?: string) {
    const [texture, atlasJson] = await Promise.all([
      Texture.createFromURL(gl, atlasImageUrl, Texture.REPEAT_LINEAR),
      loadJson(bmJsonUrl, parseBMFontRaw),
    ]);

    const errorChar =
      atlasJson.chars.find((char) => char.char === errorSymbol) || atlasJson.chars[0];
    const errorGlyph =
      new Glyph(
        errorChar.x,
        errorChar.y,
        errorChar.width,
        errorChar.height,
        errorChar.xoffset,
        errorChar.yoffset,
        errorChar.xadvance);

    const font = new BMFont(texture, atlasJson.common, atlasJson.info, errorGlyph);

    const ids = new Map<number, string>();
    atlasJson.chars.forEach((char) => {
      ids.set(char.id, char.char);
      font.addGlyph(
        char.char,
        new Glyph(
          char.x, char.y, char.width, char.height, char.xoffset, char.yoffset, char.xadvance));
    });
    atlasJson.kernings.forEach((kerning) => {
      const firstchar = ids.get(kerning.first);
      const secondchar = ids.get(kerning.second);

      if (firstchar && secondchar) {
        font.setKerning(firstchar, secondchar, kerning.amount);
      }
    });

    return font;
  }

  private setKerning(charA: string, charB: string, value: number) {
    const firstMap = this.kernings.get(charA);
    if (firstMap) {
      firstMap.set(charB, value);
    } else {
      this.kernings.set(charA, new Map([[charB, value]]));
    }
  }
}
