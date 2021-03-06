import { ECSSystem } from "@libecs/ecssystem";
import { ECSManager } from "@libecs/ecsmanager";
import { WallGeneratorComponent } from "./wallgenerator.component";
import { vec2 } from "gl-matrix";
import { MathAllocatorsComponent, OwnedMathAllocatorsComponent } from "@libgamemodel/components/commoncomponents";
import { WallSpawnerUtil } from "./wallspawner.util";
import { WallComponent2 } from "./wallcomponent";
import { LightcycleColorComponent } from "@libgamemodel/lightcycle/lightcyclecolor.component";
import { SceneModeUtil } from "@libgamemodel/scenemode/scenemodeutil";
import { Mat4TransformAddon } from "@libscenegraph/scenenodeaddons/mat4transformaddon";

export class WallSpawnerSystem2 extends ECSSystem {
  start(ecs: ECSManager) { return true; }
  update(ecs: ECSManager, msDt: number) {
    if (!SceneModeUtil.isGameplayMode(ecs)) return;

    const {
      Vec2: vec2Allocator,
      Vec3: vec3Allocator,
    } = ecs.getSingletonComponentOrThrow(MathAllocatorsComponent);
    const {
      Vec2: ownedVec2Allocator,
    } = ecs.getSingletonComponentOrThrow(OwnedMathAllocatorsComponent);

    // Spawn new walls
    ecs.iterateComponents(
      [WallGeneratorComponent, LightcycleColorComponent],
      (entity, wallGenerator, colorComponent) => {
        vec3Allocator.get(1, pos3 => {
          vec2Allocator.get(1, pos2 => {
            wallGenerator.PositionSceneNode.getAddon(Mat4TransformAddon).getPos(pos3);
            vec2.set(pos2, pos3[0], pos3[2]);
            WallSpawnerUtil.spawnWallsBetween(
              vec2Allocator,
              ownedVec2Allocator,
              ecs,
              wallGenerator.LastSpawnPoint,
              wallGenerator.DistanceBetweenSpawns,
              pos2,
              wallGenerator.VitalityAtSpawn,
              wallGenerator.LastSpawnPoint,
              colorComponent.Color);
          });
        });
      });

    // Destroy old walls
    ecs.iterateComponents([WallComponent2], (entity, wallComponent) => {
      wallComponent.Vitality -= (msDt / 1000);
      if (wallComponent.Vitality < 0) {
        entity.destroy();
      }
    });
  }
}
