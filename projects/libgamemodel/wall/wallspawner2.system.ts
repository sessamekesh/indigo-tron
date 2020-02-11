import { ECSSystem } from "@libecs/ecssystem";
import { ECSManager } from "@libecs/ecsmanager";
import { Entity } from "@libecs/entity";
import { LightcycleComponent2 } from "@libgamemodel/lightcycle/lightcycle.component";
import { WallGeneratorComponent } from "./wallgenerator.component";
import { TempGroupAllocator } from "@libutil/allocator";
import { vec3, vec2 } from "gl-matrix";
import { VelocityComponent } from "@libgamemodel/components/velocitycomponent";
import { MathAllocatorsComponent, OwnedMathAllocatorsComponent } from "@libgamemodel/components/commoncomponents";
import { WallSpawnerUtil } from "./wallspawner.util";
import { WallComponent2 } from "./wallcomponent";

export class WallSpawnerSystem2 extends ECSSystem {
  start(ecs: ECSManager) { return true; }
  update(ecs: ECSManager, msDt: number) {
    const {
      Vec2: vec2Allocator,
      Vec3: vec3Allocator,
    } = ecs.getSingletonComponentOrThrow(MathAllocatorsComponent);
    const {
      Vec2: ownedVec2Allocator,
    } = ecs.getSingletonComponentOrThrow(OwnedMathAllocatorsComponent);

    // Spawn new walls
    ecs.iterateComponents(
      [LightcycleComponent2, VelocityComponent],
      (entity, lightcycleComponent, velocityComponent) => {
        const wallGeneratorComponent = this.getWallGenerator(
          entity, lightcycleComponent, vec3Allocator);
        const distanceTravelled = velocityComponent.Velocity * msDt / 1000;
        wallGeneratorComponent.DistanceSinceLastSpawn += distanceTravelled;
        if (wallGeneratorComponent.DistanceSinceLastSpawn > wallGeneratorComponent.DistanceBetweenSpawns) {
          // Spawn a wall
          vec2Allocator.get(2, (start, end) => {
            vec2.copy(start, wallGeneratorComponent.LastSpawnPoint);
            vec3Allocator.get(1, (pos) => {
              lightcycleComponent.RearWheelSceneNode.getPos(pos);
              vec2.set(end, pos[0], pos[2]);
              vec2.copy(wallGeneratorComponent.LastSpawnPoint, end);
            });
            WallSpawnerUtil.spawnWall(
              ecs, start, end, wallGeneratorComponent.VitalityAtSpawn, ownedVec2Allocator);
            wallGeneratorComponent.DistanceSinceLastSpawn = 0;
          });
        }
      });

    // Destroy old walls
    ecs.iterateComponents([WallComponent2], (entity, wallComponent) => {
      wallComponent.Vitality -= (msDt / 1000);
      if (wallComponent.Vitality < 0) {
        entity.destroy();
      }
    });
  }

  private getWallGenerator(
      entity: Entity,
      lightcycleComponent: LightcycleComponent2,
      vec3Allocator: TempGroupAllocator<vec3>): WallGeneratorComponent {
    let component = entity.getComponent(WallGeneratorComponent);
    if (!component) {
      vec3Allocator.get(1, startPos => {
        lightcycleComponent.RearWheelSceneNode.getPos(startPos);
        component = entity.addComponent(
          WallGeneratorComponent, 10, 0, 1, vec2.fromValues(startPos[0], startPos[2]));
      });
    }
    return component!;
  }
}
