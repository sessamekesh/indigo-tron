import { ECSSystem } from "@libecs/ecssystem";
import { ECSManager } from "@libecs/ecsmanager";
import { LightcycleComponent2 } from "./lightcycle.component";
import { VelocityComponent } from "@libgamemodel/components/velocitycomponent";
import { UIEventEmitterComponent } from "@libgamemodel/components/gameui";
import { MainPlayerComponent } from "./lightcyclesteeringsystem";
import { MathUtils } from "@libutil/mathutils";

export class LightcycleHealthSystem extends ECSSystem {
  start() {
    return true;
  }

  update(ecs: ECSManager, msDt: number) {
    const {
      EventEmitter: uiEventEmitter,
    } = ecs.getSingletonComponentOrThrow(UIEventEmitterComponent);

    const dt = msDt / 1000;

    ecs.iterateComponents(
      [LightcycleComponent2, VelocityComponent],
      (entity, lightcycle, velocity) => {
        const oldVitality = lightcycle.Vitality;
        lightcycle.Vitality = MathUtils.clamp(lightcycle.Vitality + 0.5 * dt, 0, 100);
        if (entity.hasComponent(MainPlayerComponent)
            && Math.round(oldVitality) !== Math.round(lightcycle.Vitality)) {
          uiEventEmitter.fireEvent(
            'playerhealth', { CurrentHealth: lightcycle.Vitality, MaxHealth: 100  });
        }
      });
  }
}
