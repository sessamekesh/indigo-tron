import { ECSSystem } from "@libecs/ecssystem";
import { ECSManager } from "@libecs/ecsmanager";
import { LightcycleComponent2 } from "./lightcycle.component";
import { UIEventEmitterComponent } from "@libgamemodel/components/gameui";
import { MathUtils } from "@libutil/mathutils";
import { SceneModeUtil } from "@libgamemodel/scenemode/scenemodeutil";
import { MainPlayerComponent } from "@libgamemodel/components/commoncomponents";

export class LightcycleHealthSystem extends ECSSystem {
  start() {
    return true;
  }

  update(ecs: ECSManager, msDt: number) {
    const {
      EventEmitter: uiEventEmitter,
    } = ecs.getSingletonComponentOrThrow(UIEventEmitterComponent);
    if (!SceneModeUtil.isPlaying(ecs)) return;

    const dt = msDt / 1000;

    ecs.iterateComponents(
      [LightcycleComponent2],
      (entity, lightcycle) => {
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
