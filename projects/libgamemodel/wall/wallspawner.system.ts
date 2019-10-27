import { ECSSystem } from '@libecs/ecssystem';
import { ECSManager } from '@libecs/ecsmanager';
import { LightcycleComponent2 } from '@libgamemodel/lightcycle/lightcycle.component';
import { Entity } from '@libecs/entity';
import { WallGeneratorComponent } from './wallgenerator.component';
import { VelocityComponent } from '@libgamemodel/components/velocitycomponent';
import { TempGroupAllocator } from '@libutil/allocator';
import { vec3, vec2 } from 'gl-matrix';
import { WallComponent } from './wallcomponent';

export class WallspawnerSystem extends ECSSystem {
  constructor(private vec3Allocator: TempGroupAllocator<vec3>) {
    super();
  }

  start(ecs: ECSManager) {
    return true;
  }

  update(ecs: ECSManager, msDt: number) {
    ecs.iterateComponents(
      [LightcycleComponent2, VelocityComponent],
      (entity, lightcycleComponent, velocityComponent) => {
        const wallGeneratorComponent = this.getWallGenerator(entity, lightcycleComponent);
        const distanceTravelled = velocityComponent.Velocity * msDt / 1000;
        wallGeneratorComponent.DistanceSinceLastSpawn += distanceTravelled;
        if (wallGeneratorComponent.DistanceSinceLastSpawn > wallGeneratorComponent.DistanceBetweenSpawns) {
          // Spawn a wall
          wallGeneratorComponent.DistanceSinceLastSpawn = 0;
          const wallStart = vec2.create();
          const wallEnd = vec2.create();
          vec2.copy(wallStart, wallGeneratorComponent.LastSpawnPoint);
          this.vec3Allocator.get(1, (pos) => {
            lightcycleComponent.RearWheelSceneNode.getPos(pos);
            vec2.set(wallEnd, pos[0], pos[2]);
            vec2.copy(wallGeneratorComponent.LastSpawnPoint, wallEnd);
          });
          const wallEntity = ecs.createEntity();
          wallEntity.addComponent(
            WallComponent, wallStart, wallEnd, wallGeneratorComponent.VitalityAtSpawn);
        }
      });
    ecs.iterateComponents([WallComponent], (entity, wallComponent) => {
      wallComponent.Vitality -= (msDt / 1000);
      if (wallComponent.Vitality < 0) {
        entity.destroy();
      }
    });
  }

  private getWallGenerator(entity: Entity, lightcycleComponent: LightcycleComponent2): WallGeneratorComponent {
    let component = entity.getComponent(WallGeneratorComponent);
    if (!component) {
      this.vec3Allocator.get(1, (startPos) => {
        lightcycleComponent.RearWheelSceneNode.getPos(startPos);
        component = entity.addComponent(
          WallGeneratorComponent, 10, 0, 1, vec2.fromValues(startPos[0], startPos[2]));
      });
    }
    return component!;
  }
}
