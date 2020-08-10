import { MouseStateManager } from '@io/mousestatemanager';
import { ECSManager } from '@libecs/ecsmanager';

export class MouseStateSingleton {
  constructor(public MouseStateManager: MouseStateManager) {}

  static upsert(ecs: ECSManager, mouseStateManager: MouseStateManager) {
    let existing = ecs.getSingletonComponent(MouseStateSingleton);
    if (existing) {
      existing.MouseStateManager = mouseStateManager;
    } else {
      const e = ecs.createEntity();
      e.addComponent(MouseStateSingleton, mouseStateManager);
    }
  }
}
