import { GeoBase } from '@librender/geo/geobase';
import { BMFont } from './bmfont';
import { MsdfGlyphShader, MsdfGlyphShaderAttribType } from './msdfglyphshader';
import { LineGeoOriginPos, FontGeoUtil } from './fontgeoutil';

export class MsdfGlyphGeo {
  private constructor(
    public geo: GeoBase<MsdfGlyphShaderAttribType>,
    private text: string,
    private allocatedLength: number,
    private readonly originPos: LineGeoOriginPos,
    private readonly geoHeight: number,
    private readonly fillZeroZValue: boolean,
    private readonly flipY: boolean) {}

  static create(
      gl: WebGL2RenderingContext,
      msdfShader: MsdfGlyphShader,
      text: string,
      font: BMFont,
      originPos: LineGeoOriginPos,
      geoHeight: number,
      fillZeroZValue: boolean,
      flipY: boolean) {
    const data = MsdfGlyphGeo.createInternal(
      gl, msdfShader, text, font, originPos, geoHeight, fillZeroZValue, flipY);
    return data && new MsdfGlyphGeo(
      data.geo, text, data.len, data.originPos, data.geoHeight, data.fillZeroZValue, data.flipY);
  }

  updateText(gl: WebGL2RenderingContext, msdfShader: MsdfGlyphShader, text: string, font: BMFont) {
    if (text === this.text) return;

    if (text.length > this.allocatedLength) {
      const data = MsdfGlyphGeo.createInternal(
        gl, msdfShader, text, font,
        this.originPos, this.geoHeight, this.fillZeroZValue, this.flipY);
      if (!data) return;
      this.geo = data.geo;
      this.allocatedLength = data.len;
      this.text = text;
      return;
    }

    // In-place update
    const geoData = FontGeoUtil.generateLineTextGeoData(
    text, font, this.originPos, this.geoHeight, this.fillZeroZValue, this.flipY);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.geo.buffers.pos);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, geoData.posBuffer);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.geo.buffers.uv);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, geoData.uvBuffer);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.geo.ib);
    gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, geoData.indices);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    this.text = text;

    this.geo.numIndices = geoData.indices.length;
  }

  private static createInternal(
      gl: WebGL2RenderingContext,
      msdfShader: MsdfGlyphShader,
      text: string,
      font: BMFont,
      originPos: LineGeoOriginPos,
      geoHeight: number,
      fillZeroZValue: boolean,
      flipY: boolean) {
    const geoData = FontGeoUtil.generateLineTextGeoData(
      text, font, originPos, geoHeight, fillZeroZValue, flipY);
    const geo = GeoBase.create(gl, msdfShader.getAttribLocations(), {
      pos: {
        data: geoData.posBuffer,
        dataType: 'float',
        sizePerElement: fillZeroZValue ? 3 : 2,
      },
      uv: {
        data: geoData.uvBuffer,
        dataType: 'float',
        sizePerElement: 2,
      },
    }, {
      BitWidth: 16,
      Data: geoData.indices,
    });

    if (!geo) return null;

    return {geo, len: text.length, originPos, geoHeight, fillZeroZValue, flipY};
  }
}
