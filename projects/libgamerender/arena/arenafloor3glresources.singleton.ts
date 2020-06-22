import { Texture } from '@librender/texture/texture';
import { ECSManager } from '@libecs/ecsmanager';

export class ArenaFloor3GlResourcesSingleton {
  constructor(public readonly ReflecitonTexture: Texture) {}

  static attach(ecs: ECSManager, reflectionTexture: Texture) {
    ecs.iterateComponents2({}, {ArenaFloor3GlResourcesSingleton}, e => e.destroy());
    const e = ecs.createEntity();
    e.addComponent(ArenaFloor3GlResourcesSingleton, reflectionTexture);
  }
}
