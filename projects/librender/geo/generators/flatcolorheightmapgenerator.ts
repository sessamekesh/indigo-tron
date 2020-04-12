import { FlatColorVertexRenderProp, FlatColorTileRenderProp } from '@libgamemodel/environment/groundtileheightmap/flatcolorgroundheightmapcomponent';
import { GroundTileHeightMap } from '@libgamemodel/environment/groundtileheightmap/groundtileheightmap';
import { FlatColorLambertGeo } from '../flatcolorlambertgeo';
import { vec4 } from 'gl-matrix';
import { FlatColorLambertShader } from '@librender/shader/flatcolorlambertshader';

export class FlatColorHeightmapGenerator {
  static generate(
      gl: WebGL2RenderingContext,
      shader: FlatColorLambertShader,
      heightmap: GroundTileHeightMap<FlatColorVertexRenderProp, FlatColorTileRenderProp>)
      : FlatColorLambertGeo|null {
    const positionData = heightmap.getPositionBuffer();
    const normalData = heightmap.getNormalBuffer();
    const colorData = heightmap.getVec4RenderPropBuffer((renderProp, tileProp, o) => {
      vec4.copy(o, tileProp.color);
    });
    const indexData = heightmap.getIndexBuffer();
    const attribs = shader.getAttribLocations();
    return FlatColorLambertGeo.create(
      gl, {
        PosAttribLocation: attribs.Pos,
        PositionData: positionData,
        NormalAttribLocation: attribs.Normal,
        NormalData: normalData,
        ColorAttribLocation: attribs.Color,
        ColorData: colorData,
      }, {
        BitWidth: 32,
        Data: indexData,
      });
  }
}
