/// <reference path="../../testutils/custommatchers.d.ts" />

import 'jasmine';
import { Lightcycle3WallGeneratorSystem } from './lightcycle3wallgenerator.system';
import { ECSManager } from '@libecs/ecsmanager';
import { SceneGraphComponent, MathAllocatorsComponent, OwnedMathAllocatorsComponent } from '@libgamemodel/components/commoncomponents';
import { LightcycleComponent3 } from './lightcycle3.component';
import { Lightcycle3SpawnerUtil } from './lightcycle3spawner.util';
import { vec2, vec3 } from 'gl-matrix';
import { WallGeneratorComponent } from '@libgamemodel/wall/wallgenerator.component';
import { GLMatrixMatchers, vec3ToVec2 } from '@testutils/mathcompare';
import { Mat4TransformAddon } from '@libscenegraph/scenenodeaddons/mat4transformaddon';
import { Mat4TransformModule } from '@libscenegraph/scenenodeaddons/mat4transformmodule';

function assertNotNull<T>(obj: T|null|undefined): T {
  if (obj == null) {
    throw new Error('Object is null: ' + obj);
  }
  return obj;
}

describe('Lightcycle3WallGeneratorSystem', () => {

  beforeEach(() => {
    jasmine.addMatchers(GLMatrixMatchers);
  });

  const setupEcsAndSystem = () => {
    const ecs = new ECSManager();

    const tempAllocators = MathAllocatorsComponent.upsertSingleton(ecs);
    const ownedAllocators = OwnedMathAllocatorsComponent.upsertSingleton(ecs);
    const sceneGraphComponent = SceneGraphComponent.upsertSingleton(ecs);

    sceneGraphComponent.SceneGraph.addModule(Mat4TransformModule, new Mat4TransformModule(
      ownedAllocators.Mat4,
      ownedAllocators.Vec3,
      tempAllocators.Mat4,
      tempAllocators.Quat));

    const wallGeneratorSystem = ecs.addSystem2(Lightcycle3WallGeneratorSystem);

    return { ecs, wallGeneratorSystem };
  };

  it('attaches a wall generator to existing lightcycles', () => {
    const { ecs, wallGeneratorSystem } = setupEcsAndSystem();

    Lightcycle3SpawnerUtil.assertSingletonsPresent(ecs);

    const cycleEntity = Lightcycle3SpawnerUtil.spawnLightcycle(ecs, {
      BodyOrientation: 0,
      Color: 'blue',
      MaxSteeringAngularVelocity: 1,
      Position: vec2.fromValues(1, 1),
      SpawnHealth: 100,
      Velocity: 10,
      WallSpawnHealth: 100,
    });

    wallGeneratorSystem.update(ecs);

    const wallGeneratorComponent = assertNotNull(cycleEntity.getComponent(WallGeneratorComponent));
    const lightcycleComponent = assertNotNull(cycleEntity.getComponent(LightcycleComponent3));

    // Position should be at the expected position of the rear wheel
    expect(lightcycleComponent.RearWheelPosition.Value)
      .toAlmostEqualVec2(wallGeneratorComponent.LastSpawnPoint);
    const actualPos = vec3.create();
    wallGeneratorComponent.PositionSceneNode.getAddon(Mat4TransformAddon).getPos(actualPos);
    expect(lightcycleComponent.RearWheelPosition.Value)
      .toAlmostEqualVec2(vec3ToVec2(actualPos));

    // Misc equality checks
    expect(wallGeneratorComponent.DistanceBetweenSpawns).toBe(1);
    expect(wallGeneratorComponent.VitalityAtSpawn).toBe(100);
  });
});
