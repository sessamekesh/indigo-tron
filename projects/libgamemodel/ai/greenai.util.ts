import { ECSManager } from "@libecs/ecsmanager";
import { Entity } from "@libecs/entity";
import { vec2, vec3 } from "gl-matrix";
import { LightcycleSpawner } from "@libgamemodel/lightcycle/lightcyclespawner";
import { GreenAiComponent, GreenAiStrategy } from "./greenai.component";
import { FloorComponent } from "@libgamemodel/components/floor.component";
import { AiControlComponent } from "./aicontrol.component";
import { MathUtils } from "@libutil/mathutils";
import { LightcycleColorComponent, LightcycleColor } from "@libgamemodel/lightcycle/lightcyclecolor.component";
import { LifecycleOwnedAllocator } from "@libutil/allocator";
import { ArenaCollisionUtil } from "@libgamemodel/arena/arenacollisionutil";

type GREEN_AI_DIFFICULTY = 'easy'|'medium'|'hard';

export class GreenAiUtil {
  static createAiPlayer(
      ecs: ECSManager,
      startLocation: vec2,
      startAngle: number,
      difficulty: GREEN_AI_DIFFICULTY,
      color: LightcycleColor,
      randFn: ()=>number): Entity {
    const entity = ecs.createEntity();

    const arena = ecs.getSingletonComponentOrThrow(FloorComponent);

    LightcycleSpawner.attachLightcycle(
      ecs, entity, {
        Position: vec3.fromValues(startLocation[0], 0, startLocation[1]),
        Orientation: startAngle,
        Velocity: 38.5,
        AngularVelocity: 1.85,
      });

    const goalLocation = vec2.create();
    GreenAiUtil.getNextGoalLocation(goalLocation, randFn, arena);

    entity.addComponent(
      GreenAiComponent,
      goalLocation,
      GreenAiUtil.reactionTimeDelay(difficulty),
      GreenAiUtil.scanRadius(difficulty),
      { action: 'COAST' },
      /* NextStrategies */ null,
      randFn);

    entity.addComponent(AiControlComponent, 1.85, startAngle);
    entity.addComponent(LightcycleColorComponent, color);

    return entity;
  }

  static getNextGoalLocation(o: vec2, randFn: ()=>number, arenaDimensions: FloorComponent) {
    const x = randFn() - 0.5;
    const z = randFn() - 0.5;
    vec2.set(o, x * arenaDimensions.Width, z * arenaDimensions.Height);
  }

  static getStrategyRecommendation(
      ecs: ECSManager, component: GreenAiComponent, lightcyclePos: vec2, lightcycleDir: vec2,
      vec2Allocator: LifecycleOwnedAllocator<vec2>, randFn: ()=>number,
      arenaDimensions: FloorComponent): GreenAiStrategy {
    // TODO (sessamekesh): If there is a nearby player, extrapolate their path 2/3 seconds, and...
    //  + Avoid any imminent collision
    //   ~ Pick the non-colliding path closest to straight forward
    //   ~ If all paths are colliding, pick the one with the longest distance travelled to collision
    //  + Try to create an imminent collision for them
    //  + If neither case is relevant (e.g., no collision paths, ignore the player)

    // Avoid any imminent wall collision
    // TODO (sessamekesh): Use the right and left collision bounds instead of the lightcycle!
    const imminentCollision = ArenaCollisionUtil.getClosestWallInPath(
      ecs, lightcyclePos, lightcycleDir, component.ScanRadius);
    if (imminentCollision) {
      return {
        action: 'AVOID_WALL',
        wall: imminentCollision,
      };
    }

    // If we are within 85 units of the goal location, pick a new goal location
    const sqDist = vec2.squaredDistance(lightcyclePos, component.CurrentGoalLocation);
    if (sqDist < (55 * 55)
        && (component.NextStrategy == null
              || component.NextStrategy.nextStrategy.action !== 'APPROACH_LOCATION')) {
      const newGoalLocation = vec2Allocator.get();
      GreenAiUtil.getNextGoalLocation(newGoalLocation.Value, randFn, arenaDimensions);
      return {
        action: 'APPROACH_LOCATION',
        location: newGoalLocation,
      };
    }

    // If we are not currently headed towards the goal but want to be, start heading there.
    if (component.CurrentAction.action !== 'APPROACH_LOCATION') {
      return {
        action: 'APPROACH_LOCATION',
        location: {
          ReleaseFn: ()=>{},
          Value: component.CurrentGoalLocation,
        },
      };
    }

    // Otherwise, keep our current strategy
    return component.CurrentAction;
  }

  static cleanupStrategy(strategy: GreenAiStrategy) {
    if (strategy.action === 'APPROACH_LOCATION') {
      strategy.location.ReleaseFn();
    }
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

      return a.wall.x0 === b.wall.x0 && a.wall.x1 === b.wall.x1
        && a.wall.y0 === b.wall.y0 && a.wall.y1 === b.wall.y1;
    }

    if (a.action === 'CUT_OFF_PLAYER') {
      if (b.action !== 'CUT_OFF_PLAYER') return false;

      return a.playerEntity === b.playerEntity;
    }

    return a === b;
  }

  static applyStrategyRecommendation(
      strategy: GreenAiStrategy, control: AiControlComponent, currentPos: vec2,
      currentOrientation: number) {
    // TODO (sessamekesh): Fill in this method
    switch (strategy.action) {
      case 'COAST':
        // no-op: continue along current path
        break;
      case 'AVOID_WALL':
        // TODO (sessamekesh): Normalize these, and extend by some specific distance
        const extendedWallCornerX = strategy.wall.x1 + (strategy.wall.x1 - strategy.wall.x0) * 2;
        const extendedWallCornerZ = strategy.wall.y1 + (strategy.wall.y1 - strategy.wall.y0) * 2;
        const toWallCornerX = extendedWallCornerX - currentPos[0];
        const toWallCornerZ = extendedWallCornerZ - currentPos[1];
        const goalOrientation = MathUtils.clampAngle(Math.atan2(toWallCornerX, toWallCornerZ));
        // Hack to adjust the angle to avoid collision - may require more thought.
        const dir = MathUtils.getAngleTowardsGoal(currentOrientation, goalOrientation, 0.001);
        if (dir > currentOrientation) {
          control.GoalOrientation = goalOrientation + 0.5;
        } else {
          control.GoalOrientation = goalOrientation - 0.5;
        }
        break;
      case 'APPROACH_LOCATION':
        // Find the angle required to get from self to there, and use it!
        const toGoalX = strategy.location.Value[0] - currentPos[0];
        const toGoalZ = strategy.location.Value[1] - currentPos[1];
        control.GoalOrientation = MathUtils.clampAngle(Math.atan2(toGoalX, toGoalZ));
        break;
      default:
        control.GoalOrientation = MathUtils.clampAngle(control.GoalOrientation - 0.01);
        break;
    }
  }

  private static reactionTimeDelay(difficulty: GREEN_AI_DIFFICULTY) {
    switch (difficulty) {
      case 'easy': return 0.25;
      case 'medium': return 0.2;
      case 'hard': return 0.175;
    }
  }

  private static scanRadius(difficulty: GREEN_AI_DIFFICULTY) {
    switch (difficulty) {
      case 'easy': return 30;
      case 'medium': return 50;
      case 'hard': return 100;
    }
  }
}
