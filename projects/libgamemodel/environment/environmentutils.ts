import { ECSManager } from "@libecs/ecsmanager";
import { Entity } from "@libecs/entity";
import { FloorComponent } from "@libgamemodel/components/floor.component";
import { GroundTileHeightMap } from "./groundtileheightmap/groundtileheightmap";
import { FlatColorGroundHeightMapComponent, FlatColorTileRenderProp, FlatColorVertexRenderProp } from "./groundtileheightmap/flatcolorgroundheightmapcomponent";
import { vec4, vec3 } from "gl-matrix";
import { ArenaConfigObject, EnvironmentConfigObject } from '@libgamemodel/config';
import { ArenaWallComponent } from "@libgamemodel/arena/arenawall.component";
import { OwnedMathAllocatorsComponent, MathAllocatorsComponent } from "@libgamemodel/components/commoncomponents";
import { PlaneAbsoluteConstraintComponent } from "@libgamemodel/physics/planeabsoluteconstraint.component";

export class EnvironmentUtils {
  static spawnArenaFloor(ecs: ECSManager, width: number, height: number): Entity|null {
    const e = ecs.createEntity();

    // Floor configuration (super easy)
    e.addComponent(FloorComponent, width, height);

    // Attach base wall components
    const wall1 = ecs.createEntity();
    const wall2 = ecs.createEntity();
    const wall3 = ecs.createEntity();
    const wall4 = ecs.createEntity();
    wall1.addComponent(ArenaWallComponent, {
      x0: -width/2, y0: -height/2,
      x1: width/2, y1: -height/2,
    }, false);
    wall2.addComponent(ArenaWallComponent, {
      x0: -width/2, y1: height/2,
      x1: -width/2, y0: -height/2,
    }, true);
    wall3.addComponent(ArenaWallComponent, {
      x0: width/2, y0: -height/2,
      x1: width/2, y1: height/2,
    }, true);
    wall4.addComponent(ArenaWallComponent, {
      x0: -width/2, y0: height/2,
      x1: width/2, y1: height/2,
    }, false);
    e.addListener('destroy', () => {
      wall1.destroy();
      wall2.destroy();
      wall3.destroy();
      wall4.destroy();
    });

    // Attach physics planes
    const {
      Plane: planeAllocator,
    } = ecs.getSingletonComponentOrThrow(OwnedMathAllocatorsComponent);
    const {
      Vec3: tempVec3,
    } = ecs.getSingletonComponentOrThrow(MathAllocatorsComponent);
    tempVec3.get(1, (normal) => {
      const leftPlane = planeAllocator.get();
      const rightPlane = planeAllocator.get();
      const frontPlane = planeAllocator.get();
      const rearPlane = planeAllocator.get();

      vec3.set(normal, 1, 0, 0);
      leftPlane.Value.setNormalAndDistance(normal, -width/2);
      vec3.set(normal, -1, 0, 0);
      rightPlane.Value.setNormalAndDistance(normal, -width/2);
      vec3.set(normal, 0, 0, 1);
      frontPlane.Value.setNormalAndDistance(normal, -height/2);
      vec3.set(normal, 0, 0, -1);
      rearPlane.Value.setNormalAndDistance(normal, -height/2);

      // TODO (sessamekesh): Put these on the right walls (right now they are not)
      wall1.addComponent(PlaneAbsoluteConstraintComponent, leftPlane);
      wall2.addComponent(PlaneAbsoluteConstraintComponent, rightPlane);
      wall3.addComponent(PlaneAbsoluteConstraintComponent, frontPlane);
      wall4.addComponent(PlaneAbsoluteConstraintComponent, rearPlane);
      PlaneAbsoluteConstraintComponent.setOwnership(wall1);
      PlaneAbsoluteConstraintComponent.setOwnership(wall2);
      PlaneAbsoluteConstraintComponent.setOwnership(wall3);
      PlaneAbsoluteConstraintComponent.setOwnership(wall4);
    });

    return e;
  }
  static destroyArenaFloor(ecs: ECSManager) {
    ecs.iterateComponents([FloorComponent], (entity) => entity.destroy());
  }
  static getArenaFloorConfig(ecs: ECSManager): ArenaConfigObject|null {
    const e = ecs.getSingletonComponent(FloorComponent);
    if (!e) return null;

    return {
      Width: e.Width,
      Height: e.Height,
    };
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
  static getEnvironmentConfig(ecs: ECSManager): EnvironmentConfigObject|null {
    const e = ecs.getSingletonComponent(FlatColorGroundHeightMapComponent);
    if (!e) return null;
    return {
      Width: e.HeightMap.numCols * e.HeightMap.xGridSize,
      Height: e.HeightMap.numRows * e.HeightMap.zGridSize,
      NumCols: e.HeightMap.numCols,
      NumRows: e.HeightMap.numRows,
      StartX: e.StartX,
      StartZ: e.StartZ,
    };
  }
}
