import { Entity } from "@libecs/entity";
import { ECSManager } from "@libecs/ecsmanager";
import { vec2, vec3 } from "gl-matrix";
import { LightcycleColor, LightcycleColorComponent } from "@libgamemodel/lightcycle/lightcyclecolor.component";
import { FloorComponent } from "@libgamemodel/components/floor.component";
import { LightcycleSpawner } from "@libgamemodel/lightcycle/lightcyclespawner";
import { GreenAiComponent2 } from "./greenai2.component";
import { AiControlComponent } from "@libgamemodel/ai/aicontrol.component";
import { GreenAiBlackboardComponent } from "./greenai.blackboard.component";
import { WanderState } from "./wander.state";
import { AIStateManager, AIStateManagerMap } from "../aistatemanager";
import { AIStateManagerComponent } from "../aistatemanager.component";
import { AvoidWallState, AvoidWallDecoratorState } from "./avoidwall.state";
import { Lightcycle3SpawnerUtil, LightcycleInitialSpawnConfig } from "@libgamemodel/lightcycle3/lightcycle3spawner.util";

/**
 * Utility class for attaching a green AI to an entity
 */
export class GreenAiUtil2 {
  static createAiPlayer(
      ecs: ECSManager,
      startLocation: vec2,
      startAngle: number,
      color: LightcycleColor,
      wallScanDistance: number,
      wanderRandFn: ()=>number): Entity {
    const entity = ecs.createEntity();

    // Lightcycle creation
    LightcycleSpawner.attachLightcycle(
      ecs, entity, {
        Position: vec3.fromValues(startLocation[0], 0, startLocation[1]),
        Orientation: startAngle,
        Velocity: 38.5,
        AngularVelocity: 1.85
      });

    // General AI configuration
    entity.addComponent(GreenAiComponent2, wanderRandFn, /* Wander threshold */ 25);
    entity.addComponent(AiControlComponent, 1.85, startAngle);
    entity.addComponent(LightcycleColorComponent, color);

    // Initialize blackboard
    const blackboard = GreenAiBlackboardComponent.get(entity);
    const arena = ecs.getSingletonComponentOrThrow(FloorComponent);
    blackboard.Blackboard.set('WanderBounds', {
      minX: -arena.Width/2,
      maxX: arena.Width/2,
      minZ: -arena.Height/2,
      maxZ: arena.Height/2,
    });
    blackboard.Blackboard.set('WallScanDistance', wallScanDistance);
    blackboard.Blackboard.set('OversteerTimeTotal', 0.05);

    // Setup state machine
    const stateMap: AIStateManagerMap = new Map();
    stateMap.set(WanderState, new AvoidWallDecoratorState(new WanderState()));
    stateMap.set(AvoidWallState, new AvoidWallState());
    const stateManager = new AIStateManager(stateMap, stateMap.get(WanderState)!);
    entity.addComponent(AIStateManagerComponent, stateManager);

    return entity;
  }

  static createAiPlayer2(
      ecs: ECSManager,
      lightcycleConfig: LightcycleInitialSpawnConfig,
      wallScanDistance: number,
      wanderRandFn: ()=>number): Entity {
    const entity = Lightcycle3SpawnerUtil.spawnLightcycle(ecs, lightcycleConfig);

    // General AI configuration
    entity.addComponent(GreenAiComponent2, wanderRandFn, /* Wander threshold */ 25);
    entity.addComponent(
      AiControlComponent,
      /* angularVelocity */ lightcycleConfig.MaxSteeringAngularVelocity,
      /* goalOrientation */ lightcycleConfig.BodyOrientation);

    // Blackboard initialization
    const blackboard = GreenAiBlackboardComponent.get(entity);
    const arena = ecs.getSingletonComponentOrThrow(FloorComponent);
    blackboard.Blackboard.set('WanderBounds', {
      minX: -arena.Width/2,
      maxX: arena.Width/2,
      minZ: -arena.Height/2,
      maxZ: arena.Height/2,
    });
    blackboard.Blackboard.set('WallScanDistance', wallScanDistance);
    blackboard.Blackboard.set('OversteerTimeTotal', 0.05);

    // Setup state machine
    const stateMap: AIStateManagerMap = new Map();
    stateMap.set(WanderState, new AvoidWallDecoratorState(new WanderState()));
    stateMap.set(AvoidWallState, new AvoidWallState());
    const stateManager = new AIStateManager(stateMap, stateMap.get(WanderState)!);
    entity.addComponent(AIStateManagerComponent, stateManager);

    return entity;
  }
}
