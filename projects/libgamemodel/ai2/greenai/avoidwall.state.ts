/**
 * TODO (sessamekesh):
 *
 * Write a wall avoidance state. All that it does is attempt to avoid a wall - it puts the wall on
 * the blackboard, and steers hard to avoid the wall. If it is no longer on collision path with
 * the wall, it returns the state type specified in the constructor (e.g., WanderState)
 *
 * Also provide a decorator class AvoidWallDecoratorState, that simply takes over the wrapped state
 * by returning to avoid a wall if it detects one nearby.
 */

import { AIState } from "../aistate";
import { ECSManager } from "@libecs/ecsmanager";
import { Entity } from "@libecs/entity";
import { ArenaCollisionUtil } from "@libgamemodel/arena/arenacollisionutil";
import { GreenAiBlackboardComponent } from "./greenai.blackboard.component";
import { LightcycleUtils } from "@libgamemodel/lightcycle/lightcycleutils";
import { MathAllocatorsComponent } from "@libgamemodel/components/commoncomponents";
import { vec2 } from "gl-matrix";
import { LightcycleComponent2 } from "@libgamemodel/lightcycle/lightcycle.component";
import { LineSegment2D } from "@libutil/math/linesegment";
import { WanderState } from "./wander.state";
import { AiControlComponent } from "@libgamemodel/ai/aicontrol.component";
import { MathUtils } from "@libutil/mathutils";

export class AvoidWallState extends AIState {
  transition(ecs: ECSManager, entity: Entity, dt: number) {
    const wall = getWallToAvoid(ecs, entity);
    if (!wall) {
      const blackboard = GreenAiBlackboardComponent.get(entity).Blackboard;
      // In the case of oversteer time, don't return yet.
      if (blackboard.get('OversteerDirection') === undefined) {
        return WanderState;
      }
    }

    return null;
  }

  execute(ecs: ECSManager, entity: Entity, dt: number) {
    const wall = getWallToAvoid(ecs, entity);

    if (!wall) {
      // No more wall collision - start oversteer
      const blackboard = GreenAiBlackboardComponent.get(entity).Blackboard;
      let timeRemaining =
          blackboard.get('OversteerTimeRemaining') || blackboard.get('OversteerTimeTotal') || 0;
      timeRemaining -= dt;
      if (timeRemaining <= 0) {
        blackboard.delete('OversteerTimeRemaining');
        blackboard.delete('OversteerDirection');
      } else {
        blackboard.set('OversteerTimeRemaining', timeRemaining);
      }
      return;
    }

    const steerDir = this.getSteerDir(ecs, entity, wall);
    GreenAiBlackboardComponent.get(entity).Blackboard.set('OversteerDirection', steerDir);
    const control = entity.getComponent(AiControlComponent);
    const lightcycleComponent = entity.getComponent(LightcycleComponent2);
    if (!lightcycleComponent || !control) {
      throw new Error('Failed to execute action, control not defined on entity');
    }

    const lightcycleOrientation = lightcycleComponent.BodySceneNode.getRotAngle();
    // TODO (sessamekesh): Is this arbitrary value a good enough one to use? I think so...
    if (steerDir === 'left') {
      control.GoalOrientation = MathUtils.clampAngle(lightcycleOrientation + 0.5);
    } else {
      control.GoalOrientation = MathUtils.clampAngle(lightcycleOrientation - 0.5);
    }
  }

  private getSteerDir(ecs: ECSManager, entity: Entity, wall: LineSegment2D): 'left'|'right' {
    const {
      Vec2: tempVec2,
      Vec3: tempVec3,
    } = ecs.getSingletonComponentOrThrow(MathAllocatorsComponent);

    const lightcycleComponent = entity.getComponent(LightcycleComponent2);
    if (!lightcycleComponent) {
      throw new Error('Failed to execute action, control not defined on entity');
    }

    const lightcycleOrientation = lightcycleComponent.BodySceneNode.getRotAngle();
    return tempVec2.get(
      5,
      (lineSegmentDir, cycleForward, lightcyclePos2, farWallPoint, nearWallPoint) => {
        LightcycleUtils.currentPosition2(lightcyclePos2, entity, ecs);
        vec2.sub(lineSegmentDir, farWallPoint, nearWallPoint);
        vec2.set(cycleForward, Math.sin(lightcycleOrientation), Math.cos(lightcycleOrientation));
        vec2.set(nearWallPoint, wall.x0, wall.y0);
        vec2.set(farWallPoint, wall.x1, wall.y1);

        return tempVec3.get(1, (crossResult) => {
          vec2.cross(crossResult, cycleForward, lineSegmentDir);
          return crossResult[2] <= 0 ? 'left' : 'right';
        });
      });
  }
}

/**
 * Simple decorator - transitions the underlying state to "AvoidWallState" if there is a wall nearby
 */
export class AvoidWallDecoratorState extends AIState {
  constructor(private baseState: AIState) {
    super();
  }

  transition(ecs: ECSManager, entity: Entity, dt: number) {
    const wall = getWallToAvoid(ecs, entity);
    if (wall) {
      return AvoidWallState;
    }

    return this.baseState.transition(ecs, entity, dt);
  }

  execute(ecs: ECSManager, entity: Entity, dt: number) {
    return this.baseState.execute(ecs, entity, dt);
  }
}

// TODO (sessamekesh): Extend along collision side lines, instead of just the bike line
function getWallToAvoid(ecs: ECSManager, entity: Entity): LineSegment2D|null {
  const blackboard = GreenAiBlackboardComponent.get(entity).Blackboard;
  const { Vec2: tempVec2 } = ecs.getSingletonComponentOrThrow(MathAllocatorsComponent);
  return tempVec2.get(2, (lightcyclePos2, lightcycleDir2) => {
    LightcycleUtils.currentPosition2(lightcyclePos2, entity, ecs);
    const lightcycleComponent = entity.getComponent(LightcycleComponent2)!;
    const lightcycleOrientation = lightcycleComponent.BodySceneNode.getRotAngle();
    vec2.set(lightcycleDir2, Math.sin(lightcycleOrientation), Math.cos(lightcycleOrientation));
    return ArenaCollisionUtil.getClosestWallInPath(
      ecs, lightcyclePos2, lightcycleDir2, blackboard.forceGet('WallScanDistance'));
  });
}
