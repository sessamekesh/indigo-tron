/**
 * Data for a single glyph
 */
export class Glyph {
  constructor(
    public readonly x: number,
    public readonly y: number,
    public readonly width: number,
    public readonly height: number,
    public readonly xoffset: number,
    public readonly yoffset: number,
    public readonly xadvance: number) {}
}
