import { EventManager } from "@libutil/eventmanager";
import { ECSManager } from "@libecs/ecsmanager";

interface SceneEvents {
  'switch-scene': SceneBase,
};

/**
 * I don't want to over-design this, but I do want to propose one implementation that may be useful.
 * Honestly, I haven't played much with this, and I'm not convinced that a strong, strict definition
 *  of a scene like this is particularly useful. It serves our purposes well, but I suspect it makes
 *  assumptions that are not general enough to use in all games.
 * For example: it would be hard under this model to have a smooth transition from the directly into
 *  the game, e.g., something smooth like moving the camera gradually to be in the correct position.
 * Another issue: With this approach, the previous scene is completely responsible for instantiating
 *  the next scene, and passing singleton resources over has to be done in a bit of a hack-y way.
 */
export abstract class SceneBase extends EventManager<SceneEvents> {
  // Protected constructor - ECS state is expected to be ready for scene start at this point.
  protected constructor(protected ecs: ECSManager) {
    super();
  }

  protected switchScenes(newScene: SceneBase) {
    this.fireEvent('switch-scene', newScene);
  }

  update(msDt: number) {
    this.ecs.update(msDt);
  }

  abstract start(): void;
}
