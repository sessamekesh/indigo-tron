import { ECSManager } from "@libecs/ecsmanager";
import { Entity } from "@libecs/entity";
import { vec2, vec3 } from "gl-matrix";
import { LightcycleSpawner } from "@libgamemodel/lightcycle/lightcyclespawner";
import { GreenAiComponent, GreenAiStrategy } from "./greenai.component";
import { FloorComponent } from "@libgamemodel/components/floor.component";
import { AiControlComponent } from "./aicontrol.component";
import { MathUtils } from "@libutil/mathutils";
import { LightcycleColorComponent } from "@libgamemodel/lightcycle/lightcyclecolor.component";

type GREEN_AI_DIFFICULTY = 'easy'|'medium'|'hard';

export class GreenAiUtil {
  static createAiPlayer(
      ecs: ECSManager,
      startLocation: vec2,
      startAngle: number,
      difficulty: GREEN_AI_DIFFICULTY,
      randFn: ()=>number): Entity {
    const entity = ecs.createEntity();

    const arena = ecs.getSingletonComponentOrThrow(FloorComponent);

    LightcycleSpawner.attachLightcycle(
      ecs, entity, {
        Position: vec3.fromValues(startLocation[0], 0, startLocation[1]),
        Orientation: startAngle,
      });

    const goalLocation = vec2.create();
    GreenAiUtil.getNextGoalLocation(goalLocation, randFn, arena);

    entity.addComponent(
      GreenAiComponent,
      goalLocation,
      GreenAiUtil.reactionTimeDelay(difficulty),
      GreenAiUtil.scanRadius(difficulty),
      { action: 'COAST' },
      /* NextStrategy */ undefined,
      randFn);

    entity.addComponent(AiControlComponent, 1.85, startAngle);
    entity.addComponent(LightcycleColorComponent, 'green');

    return entity;
  }

  static getNextGoalLocation(o: vec2, randFn: ()=>number, arenaDimensions: FloorComponent) {
    vec2.set(o, randFn() * arenaDimensions.Width, randFn() * arenaDimensions.Height);
  }

  static getStrategyRecommendation(ecs: ECSManager, component: GreenAiComponent): GreenAiStrategy {
    // TODO (sessamekesh): Fill this in
    return {
      action: 'COAST',
    };
  }

  static strategyIsEqual(a: GreenAiStrategy, b: GreenAiStrategy) {
    if (a.action === 'COAST') {
      return b.action === 'COAST';
    }

    if (a.action === 'APPROACH_LOCATION') {
      if (b.action !== 'APPROACH_LOCATION') return false;

      return vec2.equals(a.location.Value, b.location.Value);
    }

    if (a.action === 'AVOID_PLAYER') {
      if (b.action !== 'AVOID_PLAYER') return false;

      return a.playerEntity === b.playerEntity;
    }

    if (a.action === 'AVOID_WALL') {
      if (b.action !== 'AVOID_WALL') return false;

      return a.wallEntity === b.wallEntity;
    }

    if (a.action === 'CUT_OFF_PLAYER') {
      if (b.action !== 'CUT_OFF_PLAYER') return false;

      return a.playerEntity === b.playerEntity;
    }

    return a === b;
  }

  static applyStrategyRecommendation(strategy: GreenAiStrategy, control: AiControlComponent) {
    // TODO (sessamekesh): Fill in this method
    control.GoalOrientation = MathUtils.clampAngle(control.GoalOrientation - 0.01);
  }

  private static reactionTimeDelay(difficulty: GREEN_AI_DIFFICULTY) {
    switch (difficulty) {
      case 'easy': return 0.75;
      case 'medium': return 0.35;
      case 'hard': return 0.125;
    }
  }

  private static scanRadius(difficulty: GREEN_AI_DIFFICULTY) {
    switch (difficulty) {
      case 'easy': return 8;
      case 'medium': return 15;
      case 'hard': return 30;
    }
  }
}
