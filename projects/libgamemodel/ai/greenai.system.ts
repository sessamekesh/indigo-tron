import { ECSSystem } from "@libecs/ecssystem";
import { ECSManager } from "@libecs/ecsmanager";
import { GreenAiComponent } from "./greenai.component";
import { GreenAiUtil } from "./greenai.util";
import { AiControlComponent } from "./aicontrol.component";

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
    const dt = msDt / 1000;
    ecs.iterateComponents([GreenAiComponent, AiControlComponent], (entity, greenAi, aiControl) => {
      if (greenAi.NextStrategy) {
        greenAi.NextStrategy.reactionTimeRemaining -= dt;

        if (greenAi.NextStrategy.reactionTimeRemaining <= 0) {
          greenAi.CurrentAction = greenAi.NextStrategy.nextStrategy;
          greenAi.NextStrategy = undefined;
        }
      }

      const action = GreenAiUtil.getStrategyRecommendation(ecs, greenAi);
      if (!GreenAiUtil.strategyIsEqual(action, greenAi.CurrentAction)) {
        if (!greenAi.NextStrategy ||
            !GreenAiUtil.strategyIsEqual(action, greenAi.NextStrategy.nextStrategy)) {
          greenAi.NextStrategy = {
            nextStrategy: action,
            reactionTimeRemaining: greenAi.ReactionTimeDelay,
          };
        }
      }

      GreenAiUtil.applyStrategyRecommendation(greenAi.CurrentAction, aiControl);
    });
  }
}
