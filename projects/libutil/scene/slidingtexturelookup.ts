import { vec2 } from "gl-matrix";

export type SlidingTextureLookupConstructionError =
    'HEIGHT_EXCEEDS_LENGTH'
    | 'SEGMENT_LENGTH_EXCEEDS_LENGTH'
    | 'REQUIRED_TEXTURE_ABOVE_4096_WIDTH'
    | 'NONSENSE_INPUT_LT0';

export type LookupError = 'START_OOB'|'END_OOB'|'SEGMENT_TOO_LONG';

export type SegmentUV = {
  TopLeft: vec2,
  TopRight: vec2,
  BottomLeft: vec2,
  BottomRight: vec2,
};

/**
 * A strip of height H and length L with maximum segment length S is placed in a square texture of
 * dimension NxN. This class helps to generate such textures, and find UV coordinates across the
 * surface of those textures based on queries.
 */
export class SlidingTextureLookup {
  constructor(
    public readonly stripHeight: number,
    public readonly stripLength: number,
    public readonly maxSegmentLength: number,
    public readonly textureWidth: number,
    public readonly padding: number) {}

  static construct(
      stripHeight: number,
      stripLength: number,
      maxSegmentLength: number,
      padding: number): SlidingTextureLookup|SlidingTextureLookupConstructionError {
    // Input validation
    if (stripHeight >= stripLength) return 'HEIGHT_EXCEEDS_LENGTH';
    if (maxSegmentLength >= stripLength) return 'SEGMENT_LENGTH_EXCEEDS_LENGTH';
    if (stripHeight <= 0 || stripLength <= 0 || maxSegmentLength <= 0 || padding < 0)
        return 'NONSENSE_INPUT_LT0';

    // Find number of rows
    const functionalStripHeight = stripHeight + padding;
    for (let twoPower = 1; twoPower <= 12; twoPower++) {
      const textureWidth = 2 ** twoPower;
      if (functionalStripHeight + padding > textureWidth) continue;

      // Row 0 format:
      // | padding | Unique segment of length K + S | padding |
      // Rows 1-N format:
      // | padding | Repeated S | Unique Segment of length K | padding |
      // "usefulRowLength" is K
      const usefulRowLength = textureWidth - padding * 2 - maxSegmentLength;
      if (usefulRowLength <= 0) continue;

      // Adjust for the fact that the first row needs no duplicated area (K + S first row)
      const requiredRowCoverage = stripLength - maxSegmentLength;
      const numRows = Math.ceil(requiredRowCoverage / usefulRowLength);

      const heightUsed = numRows * (stripHeight + padding) + padding;
      if (heightUsed > textureWidth) continue;

      return new SlidingTextureLookup(
        stripHeight, stripLength, maxSegmentLength, textureWidth, padding);
    }

    return 'REQUIRED_TEXTURE_ABOVE_4096_WIDTH';
  }

  lookupSegmentUV(segmentStart: number, segmentLength: number, o_uvs: SegmentUV): LookupError|null {
    if (segmentLength >= this.maxSegmentLength) return 'SEGMENT_TOO_LONG';
    if (segmentStart < 0) return 'START_OOB'
    const segmentEnd = segmentStart + segmentLength;
    if (segmentEnd > this.stripLength) return 'END_OOB';

    const rowLength = this.textureWidth - this.padding * 2 - this.maxSegmentLength;
    // Special case for the first row...
    if (segmentEnd < (rowLength + this.maxSegmentLength)) {
      const startU = (this.padding + segmentStart) / this.textureWidth;
      const endU = (this.padding + segmentEnd) / this.textureWidth;
      const startV = this.padding / this.textureWidth;
      const endV = (this.padding + this.stripHeight) / this.textureWidth;
      vec2.set(o_uvs.TopLeft, startU, startV);
      vec2.set(o_uvs.TopRight, endU, startV);
      vec2.set(o_uvs.BottomLeft, startU, endV);
      vec2.set(o_uvs.BottomRight, endU, endV);
      return null;
    }

    const firstRowOffsetStart = segmentStart - rowLength - this.maxSegmentLength;
    const rowIdx = Math.floor(firstRowOffsetStart / rowLength);
    const rowStart = firstRowOffsetStart - (rowIdx * rowLength);
    const rowEnd = rowStart + segmentLength;
    const startU = (this.padding + rowStart) / this.textureWidth;
    const endU = (this.padding + rowEnd) / this.textureWidth;
    const startV = (this.padding + (rowIdx + 1) * this.stripHeight) / this.textureWidth;
    const endV = (this.padding + (rowIdx + 2) * this.stripHeight) / this.textureWidth;
    vec2.set(o_uvs.TopLeft, startU, startV);
    vec2.set(o_uvs.TopRight, endU, startV);
    vec2.set(o_uvs.BottomLeft, startU, endV);
    vec2.set(o_uvs.BottomRight, endU, endV);
    return null;
  }
}
