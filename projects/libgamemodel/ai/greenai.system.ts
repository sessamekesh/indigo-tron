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
 * TODO (sessamekesh): Use a state machine instead, this is getting unweildly.
 */
export class GreenAiSystem extends ECSSystem {
  start() { return true; }

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
      if (greenAi.NextStrategy
          && (greenAi.NextStrategy.reactionTimeRemaining <= 0
              || (greenAi.CurrentAction.action === 'AVOID_WALL'
                  && greenAi.NextStrategy.nextStrategy.action === 'AVOID_WALL'))) {
        greenAi.CurrentAction = greenAi.NextStrategy.nextStrategy;
        GreenAiUtil.cleanupStrategy(greenAi.NextStrategy.nextStrategy);
        greenAi.NextStrategy = null;

        if (greenAi.CurrentAction.action === 'APPROACH_LOCATION') {
          vec2.copy(greenAi.CurrentGoalLocation, greenAi.CurrentAction.location.Value);
        }
      }

      const action = tempVec3.get(1, (lightcyclePos) => {
        return tempVec2.get(2, (lightcyclePos2, lightcycleDir2) => {
          lightcycle.BodySceneNode.getPos(lightcyclePos);
          vec2.set(lightcyclePos2, lightcyclePos[0], lightcyclePos[2]);
          lightcycleDir2[0] = Math.sin(lightcycle.BodySceneNode.getRotAngle());
          lightcycleDir2[1] = Math.cos(lightcycle.BodySceneNode.getRotAngle());
          return GreenAiUtil.getStrategyRecommendation(
            ecs, greenAi, lightcyclePos2, lightcycleDir2, vec2Allocator, greenAi.RandFn,
            arenaFloorComponent);
        });
      });

      if (!GreenAiUtil.strategyIsEqual(action, greenAi.CurrentAction)) {
        if (!greenAi.NextStrategy
            || !GreenAiUtil.strategyIsEqual(action, greenAi.NextStrategy.nextStrategy)) {
          if (greenAi.NextStrategy) GreenAiUtil.cleanupStrategy(greenAi.NextStrategy.nextStrategy);
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
          GreenAiUtil.applyStrategyRecommendation(
            greenAi.CurrentAction, aiControl, lightcyclePos2,
            lightcycle.BodySceneNode.getRotAngle());
        });
      });
    });
  }
}
