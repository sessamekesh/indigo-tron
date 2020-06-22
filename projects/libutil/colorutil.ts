export class ColorUtil {
  static hexToGlRgb(hex: string): {r: number, g: number, b: number} {
    const rstr = hex.slice(1, 3);
    const gstr = hex.slice(3, 5);
    const bstr = hex.slice(5, 7);
    return {
      r: parseInt(rstr, 16) / 255.,
      g: parseInt(gstr, 16) / 255.,
      b: parseInt(bstr, 16) / 255.,
    };
  }

  // https://coolors.co/4b0082-37392e-adffe8-ddcecd-fe755d
  static COLOR_THEME_INDIGO = ColorUtil.hexToGlRgb('#300052');
  static COLOR_THEME_MIDTONE_GRAY = ColorUtil.hexToGlRgb('#454545');
  static COLOR_THEME_CHOCOLATE = ColorUtil.hexToGlRgb('#21221B');
  static COLOR_THEME_RIFLE_GREEN = ColorUtil.hexToGlRgb('#4D4F40');
  static COLOR_THEME_MINT = ColorUtil.hexToGlRgb('#ADFFE8');
  static COLOR_THEME_SILVER = ColorUtil.hexToGlRgb('#DDCECD');
  static COLOR_THEME_BITTERSWEET = ColorUtil.hexToGlRgb('#FE755D');
}
