import { ECSSystem } from "@libecs/ecssystem";
import { ECSManager } from "@libecs/ecsmanager";
import { GreenAiComponent } from "./greenai.component";
import { GreenAiUtil } from "./greenai.util";
import { AiControlComponent } from "./aicontrol.component";
import { SceneModeUtil } from "@libgamemodel/scenemode/scenemodeutil";
import { LightcycleComponent2 } from "@libgamemodel/lightcycle/lightcycle.component";
import { MathAllocatorsComponent, OwnedMathAllocatorsComponent } from "@libgamemodel/components/commoncomponents";
import { vec2 } from "gl-matrix";
import { FloorComponent } from "@libgamemodel/components/floor.component";

/**
 * Green AI system. Aggressive when confronted, but otherwise just sorta wanders about randomly.
 * Intended to be a machine that must be actively sought out and destroyed.
 *
 * TODO (sessamekesh): Also write a "pink" which actively seeks out a random bike to cut them off.
 * TODO (sessamekesh): Also write a "orange" is like green, but avoids players without engaging.
 */
export class GreenAiSystem extends ECSSystem {
  start() { return true; }

  // TODO (sessamekesh): Write the AI system!
  // - Avoid imminent collisions (turn in direction that is furthest from wall)
  // - If there is a nearby player, extrapolate their path 2/3 seconds, and...
  //   + Avoid any imminent collision
  //   + Try to create an imminent collision for them
  //   + If both are impossible, ignore it.
  // - If there is no destination spot, pick one
  // - Travel in the direction towards the destination spot
  //   + Pick seven lines in a cone in the direction towards the destination.
  //   + Pick the closest line that does not collide with any existing walls, or the line with the
  //     longest distance until it collides if none are available.
  // Difficulty level adjustment: Delay response to actions for a time before performing them,
  //  and adjust the distance it scans for danger / players
  update(ecs: ECSManager, msDt: number) {
    if (SceneModeUtil.isPaused(ecs)) {
      return;
    }

    const {
      Vec3: tempVec3,
      Vec2: tempVec2,
    } = ecs.getSingletonComponentOrThrow(MathAllocatorsComponent);

    const { Vec2: vec2Allocator } = ecs.getSingletonComponentOrThrow(OwnedMathAllocatorsComponent);
    const arenaFloorComponent = ecs.getSingletonComponentOrThrow(FloorComponent);

    const dt = msDt / 1000;
    ecs.iterateComponents(
        [GreenAiComponent, AiControlComponent, LightcycleComponent2],
        (entity, greenAi, aiControl, lightcycle) => {
      if (greenAi.NextStrategy) {
        greenAi.NextStrategy.reactionTimeRemaining -= dt;
      }
      if (greenAi.NextStrategy && greenAi.NextStrategy.reactionTimeRemaining <= 0) {
        greenAi.CurrentAction = greenAi.NextStrategy.nextStrategy;
        GreenAiUtil.cleanupStrategy(greenAi.NextStrategy.nextStrategy);
        greenAi.NextStrategy = null;

        if (greenAi.CurrentAction.action === 'APPROACH_LOCATION') {
          vec2.copy(greenAi.CurrentGoalLocation, greenAi.CurrentAction.location.Value);
        }
      }

      const action = tempVec3.get(1, (lightcyclePos) => {
        return tempVec2.get(1, (lightcyclePos2) => {
          lightcycle.BodySceneNode.getPos(lightcyclePos);
          vec2.set(lightcyclePos2, lightcyclePos[0], lightcyclePos[2]);
          // TODO (sessamekesh): Inject in the randFn()
          return GreenAiUtil.getStrategyRecommendation(
            ecs, greenAi, lightcyclePos2, vec2Allocator, Math.random, arenaFloorComponent);
        });
      });

      if (!GreenAiUtil.strategyIsEqual(action, greenAi.CurrentAction)) {
        if (!greenAi.NextStrategy
            || !GreenAiUtil.strategyIsEqual(action, greenAi.NextStrategy.nextStrategy)) {
          greenAi.NextStrategy = {
            nextStrategy: action,
            reactionTimeRemaining: greenAi.ReactionTimeDelay,
          };
        }
      }

      tempVec3.get(1, (lightcyclePos) => {
        return tempVec2.get(1, (lightcyclePos2) => {
          lightcycle.BodySceneNode.getPos(lightcyclePos);
          vec2.set(lightcyclePos2, lightcyclePos[0], lightcyclePos[2]);
          GreenAiUtil.applyStrategyRecommendation(greenAi.CurrentAction, aiControl, lightcyclePos2);
        });
      });
    });
  }
}
