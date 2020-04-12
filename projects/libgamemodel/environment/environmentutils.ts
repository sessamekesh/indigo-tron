import { ECSManager } from "@libecs/ecsmanager";
import { Entity } from "@libecs/entity";
import { FloorComponent } from "@libgamemodel/components/floor.component";
import { GroundTileHeightMap } from "./groundtileheightmap/groundtileheightmap";
import { FlatColorGroundHeightMapComponent, FlatColorTileRenderProp, FlatColorVertexRenderProp } from "./groundtileheightmap/flatcolorgroundheightmapcomponent";
import { vec4 } from "gl-matrix";

export class EnvironmentUtils {
  static spawnArenaFloor(ecs: ECSManager, width: number, height: number): Entity {
    const e = ecs.createEntity();
    e.addComponent(FloorComponent, width, height);
    return e;
  }
  static destroyArenaFloor(ecs: ECSManager) {
    ecs.iterateComponents([FloorComponent], (entity) => entity.destroy());
  }

  // Utility to use in environment editor - create a new floor from scratch
  static spawnFlatEnvironmentFloor(
      ecs: ECSManager,
      width: number,
      height: number,
      numRows: number,
      numCols: number,
      yPosition: number,
      color: vec4,
      startX: number,
      startZ: number): Entity|null {

    const defaultVertexProp: ()=>FlatColorVertexRenderProp = ()=>{return {};};
    const defaultTileProp: ()=>FlatColorTileRenderProp = () => {
      return {
        color: vec4.fromValues(color[0], color[1], color[2], color[3]),
      };
    };
    const heightmap = GroundTileHeightMap.generateFlat(
      numRows, numCols, height / numRows, width / numCols, yPosition,
      defaultVertexProp, defaultTileProp);
    if (!heightmap) {
      return null;
    }

    const e = ecs.createEntity();
    e.addComponent(FlatColorGroundHeightMapComponent, heightmap, startX, startZ);
    return e;
  }

  static destroyEnvironmentFloor(ecs: ECSManager) {
    ecs.iterateComponents([FlatColorGroundHeightMapComponent], (entity) => entity.destroy());
  }
}
