import { vec2, vec3 } from "gl-matrix";
import { Entity } from "@libecs/entity";
import { ECSManager } from "@libecs/ecsmanager";
import { SceneGraphComponent, OwnedMathAllocatorsComponent, MathAllocatorsComponent } from "@libgamemodel/components/commoncomponents";
import { LightcycleComponent3 } from "./lightcycle3.component";
import { HealthComponent } from "@libgamemodel/components/healthcomponent";
import { LightcycleSteeringStateComponent } from "./lightcyclesteeringstate.component";
import { LightcycleDrivingStatsComponent } from "./lightcycledrivingstats.component";
import { Mat4TransformAddon } from "@libgamemodel/../libscenegraph/scenenodeaddons/mat4transformaddon";
import { LightcycleColor, LightcycleColorComponent } from "@libgamemodel/lightcycle/lightcyclecolor.component";

export const BACK_WHEEL_OFFSET = 3.385;

type LightcycleInitialSpawnConfig = {
  Position: vec2,
  BodyOrientation: number,
  Velocity: number,
  MaxSteeringAngularVelocity: number,
  SpawnHealth: number,
  WallSpawnHealth: number,
  Color: LightcycleColor,
};

const ATTACH_LIGHTCYCLE_SINGLETON_QUERY = {
  sceneGraph: SceneGraphComponent,
  allocators: OwnedMathAllocatorsComponent,
  tempAllocators: MathAllocatorsComponent,
};

export class Lightcycle3SpawnerUtil {
  static assertSingletonsPresent(ecs: ECSManager) {
    const missingSingletons = ecs.withSingletons(ATTACH_LIGHTCYCLE_SINGLETON_QUERY, ()=>{});
    if (missingSingletons.length > 0) {
      throw new Error(`[Lightcycle2SpawnerUtil] Missing: ${missingSingletons.join(',')}`);
    }
  }

  static attachLightcycle(ecs: ECSManager, entity: Entity, config: LightcycleInitialSpawnConfig) {
    ecs.withSingletons(ATTACH_LIGHTCYCLE_SINGLETON_QUERY, (s) => {
      const vec2Allocator = s.allocators.Vec2;
      const tempVec2 = s.tempAllocators.Vec2;
      const tempVec3 = s.tempAllocators.Vec3;
      const sceneGraph = s.sceneGraph.SceneGraph;

      // Allocate and set up destructor for lifecycle managed resources
      const frontWheelPos = vec2Allocator.get();
      const rearWheelPos = vec2Allocator.get();
      const wallGeneratorSceneNode = sceneGraph.createSceneNode();

      entity.addListener('destroy', () => {
        frontWheelPos.ReleaseFn();
        rearWheelPos.ReleaseFn();
        wallGeneratorSceneNode.destroy();
      });

      vec2.copy(frontWheelPos.Value, config.Position);

      tempVec2.get(1, (rearWheelDirection) => {
        vec2.set(
          rearWheelDirection,
          Math.sin(config.BodyOrientation),
          Math.cos(config.BodyOrientation));
        vec2.scaleAndAdd(
          rearWheelPos.Value, frontWheelPos.Value, rearWheelDirection, -BACK_WHEEL_OFFSET);
        tempVec3.get(1, (rearWheelPos3) => {
          vec3.set(rearWheelPos3, rearWheelPos.Value[0], 0, rearWheelPos.Value[1]);
          wallGeneratorSceneNode.getAddon(Mat4TransformAddon).update({ pos: rearWheelPos3 });
        });
      });

      // Add all (game model) components here - keep them together for readability
      // Notice: Generated components are not present! They are created by the systems that use
      //  them. This is to allow modular installation of whatever systems the designer wants for
      //  whatever functionality they want present. Want to remove physics for a tool? Just don't
      //  install the physics system. Want to remove wall generators? Then oh boy specify that in
      //  the system.
      entity.addComponent(
        LightcycleComponent3, frontWheelPos, rearWheelPos, config.BodyOrientation);
      entity.addComponent(
        HealthComponent, /* Health */ config.SpawnHealth, /* MaxHealth */ config.SpawnHealth);
      entity.addComponent(LightcycleSteeringStateComponent, 0);
      entity.addComponent(
        LightcycleDrivingStatsComponent,
        /* Velocity */ config.Velocity,
        /* MaxSteeringAngularVelocity */ config.MaxSteeringAngularVelocity,
        /* WallSpawnHealth */ config.WallSpawnHealth);
      entity.addComponent(LightcycleColorComponent, config.Color);
    });
  }

  static spawnLightcycle(ecs: ECSManager, config: LightcycleInitialSpawnConfig) {
    const entity = ecs.createEntity();
    Lightcycle3SpawnerUtil.attachLightcycle(ecs, entity, config);
    return entity;
  }
}
