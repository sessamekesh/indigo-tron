import { ECSSystem } from "@libecs/ecssystem";
import { LightcycleComponent3 } from './lightcycle3.component';
import { ECSManager } from "@libecs/ecsmanager";
import { Entity } from "@libecs/entity";
import { WallGeneratorComponent } from "@libgamemodel/wall/wallgenerator.component";
import { TempGroupAllocator } from "@libutil/allocator";
import { vec3, vec2 } from "gl-matrix";
import { SceneGraph2 } from "@libscenegraph/scenegraph2";
import { Mat4TransformAddon } from "@libscenegraph/scenenodeaddons/mat4transformaddon";
import { LightcycleDrivingStatsComponent } from "./lightcycledrivingstats.component";
import { SceneGraphComponent, MathAllocatorsComponent } from "@libgamemodel/components/commoncomponents";

/**
 * System to synchronize the lightcycle state to a wall generator state on the lightcycle (attached
 *  to the rear wheel).
 */
export class Lightcycle3WallGeneratorSystem extends ECSSystem {
  private SINGLETON_QUERY = {
    sceneGraph: SceneGraphComponent,
    tempAllocator: MathAllocatorsComponent,
  };
  private COMPONENT_QUERY = {
    lightcycle: LightcycleComponent3,
    drivingStats: LightcycleDrivingStatsComponent,
  };

  start(ecs: ECSManager) {
    return this.expectSingletons(ecs, this.SINGLETON_QUERY, 'Lightcycle3WallGeneratorSystem');
  }

  update(ecs: ECSManager) {
    ecs.iterateComponents2(this.SINGLETON_QUERY, this.COMPONENT_QUERY, (e, s, c) => {
      const sceneGraph = s.sceneGraph.SceneGraph;
      const tempVec3 = s.tempAllocator.Vec3;

      const wallGenerator =
        Lightcycle3WallGeneratorSystem.getWallGeneratorComponent(
          e, tempVec3, sceneGraph, c.drivingStats, c.lightcycle);
      tempVec3.get(1, backWheelPos3 => {
        vec3.set(
          backWheelPos3,
          c.lightcycle.RearWheelPosition.Value[0],
          0,
          c.lightcycle.RearWheelPosition.Value[1]);
        wallGenerator.PositionSceneNode.getAddon(Mat4TransformAddon).update({pos: backWheelPos3});
      });
    });
  }

  private static getWallGeneratorComponent(
      entity: Entity,
      tempVec3: TempGroupAllocator<vec3>,
      sceneGraph: SceneGraph2,
      drivingStats: LightcycleDrivingStatsComponent,
      lightcycle: LightcycleComponent3): WallGeneratorComponent {
    let component = entity.getComponent(WallGeneratorComponent);
    if (!component) {
      const sceneNode = sceneGraph.createSceneNode();
      entity.addListener('destroy', () => sceneNode.destroy());

      tempVec3.get(1, (backWheelPos3) => {
        vec3.set(
          backWheelPos3,
          lightcycle.RearWheelPosition.Value[0],
          0,
          lightcycle.RearWheelPosition.Value[1]);
        sceneNode.getAddon(Mat4TransformAddon).update({pos: backWheelPos3});
      });

      component = entity.addComponent(
        WallGeneratorComponent,
        sceneNode,
        drivingStats.WallSpawnHealth,
        /* DistanceBetweenSpawns */ 2.5,
        vec2.copy(vec2.create(), lightcycle.RearWheelPosition.Value));
    }
    return component;
  }
}
