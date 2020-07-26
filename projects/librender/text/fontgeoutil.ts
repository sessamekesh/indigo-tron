import { BMFont } from './bmfont';

/**
 * Inspired/stolen shamelessly from three-bmfont-text:
 * https://github.com/Jam3/three-bmfont-text/blob/master/lib/vertices.js
 *
 * See also: documentation for the BMFont format:
 * http://www.angelcode.com/products/bmfont/doc/file_format.html
 */
export class FontGeoUtil {
  //
  // Public API
  //
  static generateLineTextGeoData(
      text: string,
      font: BMFont,
      originPos: LineGeoOriginPos,
      geoHeight: number,
      fillZeroZValue: boolean,
      flipY: boolean): LineTextGeoData {
    return {
      posBuffer: FontGeoUtil.generateLineTextPositions(
        text, font, originPos, geoHeight, fillZeroZValue),
      uvBuffer: FontGeoUtil.generateLineTextUVs(text, font, flipY),
      indices: FontGeoUtil.generateLineTextIndices(text),
    }
  }

  //
  // Private utility methods
  //
  private static generateLineTextUVs(text: string, font: BMFont, flipY: boolean) {
    const FLOATS_PER_VERT = 2;
    const VERTS_PER_GLYPH = 4;
    const uvs = new Float32Array(text.length * FLOATS_PER_VERT * VERTS_PER_GLYPH);
    let i = 0;
    [...text].forEach((char) => {
      const glyph = font.getGlyph(char) || font.errorGlyph;
      const bw = glyph.x + glyph.width;
      const bh = glyph.y + glyph.height;

      // Top left position
      const u0 = glyph.x / font.fontCommon.scaleW;
      let v1 = glyph.y / font.fontCommon.scaleH;
      const u1 = bw / font.fontCommon.scaleW;
      let v0 = bh / font.fontCommon.scaleH;

      if (flipY) {
        v1 = (font.fontCommon.scaleH - glyph.y) / font.fontCommon.scaleH;
        v0 = (font.fontCommon.scaleH - bh) / font.fontCommon.scaleH;
      }

      // TL
      uvs[i++] = u0;
      uvs[i++] = v0;
      // TR
      uvs[i++] = u1;
      uvs[i++] = v0;
      // BL
      uvs[i++] = u0;
      uvs[i++] = v1;
      // BR
      uvs[i++] = u1;
      uvs[i++] = v1;
    });
    return uvs;
  }

  private static generateLineTextPositions(
      text: string, font: BMFont, originPos: LineGeoOriginPos, geoHeight: number, fillZ: boolean) {
    const FLOATS_PER_VERT = fillZ ? 3 : 2;
    const VERTS_PER_GLYPH = 4;
    const positions = new Float32Array(text.length * FLOATS_PER_VERT * VERTS_PER_GLYPH);
    let posidx = 0;
    const scale = geoHeight / font.fontCommon.lineHeight;

    let penX = 0;
    let penY = 0;
    let baseline = font.fontCommon.base;
    penY -= baseline;

    let maxX = 0;
    let maxY = 0;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const glyph = font.getGlyph(char) || font.errorGlyph;
      if (i > 0) {
        penX += font.getKerning(text[i - 1], char);
      }

      // Lower-left is penx, peny at this point

      const x = penX + glyph.xoffset;
      const y = penY + glyph.yoffset;
      const w = glyph.width * scale;
      const h = glyph.height * scale;

      // TL
      positions[posidx++] = x;
      positions[posidx++] = y + h;
      if (fillZ) positions[posidx++] = 0;
      // TR
      positions[posidx++] = x + w;
      positions[posidx++] = y + h;
      if (fillZ) positions[posidx++] = 0;
      // BL
      positions[posidx++] = x;
      positions[posidx++] = y;
      if (fillZ) positions[posidx++] = 0;
      // BR
      positions[posidx++] = x + w;
      positions[posidx++] = y;
      if (fillZ) positions[posidx++] = 0;

      // xadvance happens after laying out the position, oddly
      penX += glyph.xadvance;

      maxX = Math.max(maxX, x + w);
      maxY = Math.max(maxY, y + h);
    }

    // Adjust all positions based on the how the origin supposed to be
    switch (originPos) {
      case LineGeoOriginPos.BOTTOM_CENTER:
        for (let i = 0; i < positions.length; i += (fillZ) ? 3 : 2) {
          positions[i] -= maxX / 2;
        }
    }

    return positions;
  }

  private static generateLineTextIndices(text: string) {
    const INDICES_PER_GLYPH = 6;
    const indexBuffer = new Uint16Array(INDICES_PER_GLYPH * text.length);

    for (let i = 0; i < text.length; i++) {
      const baseIdx = i * 6;
      const glyphBaseVertId = i * 4;

      // Default winding is counter-clockwise
      // TL->BL->BR / TL->BR->TR
      // 0->2->3 / 0->3->1
      indexBuffer[baseIdx] = glyphBaseVertId;
      indexBuffer[baseIdx + 1] = glyphBaseVertId + 2;
      indexBuffer[baseIdx + 2] = glyphBaseVertId + 3;
      indexBuffer[baseIdx + 3] = glyphBaseVertId;
      indexBuffer[baseIdx + 4] = glyphBaseVertId + 3;
      indexBuffer[baseIdx + 5] = glyphBaseVertId + 1;
    }
    return indexBuffer;
  }
}

/**
 * Possible values of the origin position for line geometry
 */
export enum LineGeoOriginPos {
  BOTTOM_CENTER,
}

/**
 * Data produced that can be used to generate font geometry
 */
export type LineTextGeoData = {
  uvBuffer: Float32Array,
  posBuffer: Float32Array,
  indices: Uint16Array, // Always 16-bit, because 8-bit gives 64-char limit (16 bit gives 16k)
};
