import { GroundTileHeightMap } from "./groundtileheightmap";
import { vec4 } from "gl-matrix";

export type FlatColorVertexRenderProp = {};
export type FlatColorTileRenderProp = {
  color: vec4,
};

export class FlatColorGroundHeightMapComponent {
  constructor(
    public HeightMap: GroundTileHeightMap<FlatColorVertexRenderProp, FlatColorTileRenderProp>,
    public StartX: number,
    public StartZ: number) {}
}
