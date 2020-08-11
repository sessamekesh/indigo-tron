import { ECSSystem } from '@libecs/ecssystem';
import { ECSManager, MappedKlassObjType } from '@libecs/ecsmanager';
import { SceneModeUtil } from '@libgamemodel/scenemode/scenemodeutil';
import { GameOverUiSettingsSingleton } from './gameoverui.component';
import { StandardButtonComponent } from '../menu/btnstartgame.component';

const SINGLETON_QUERY = {
  settings: GameOverUiSettingsSingleton,
};

export class GameOverUiSystem extends ECSSystem {
  start(ecs: ECSManager) {
    return this.expectSingletons(ecs, SINGLETON_QUERY, 'GameOverUiSystem');
  }

  update(ecs: ECSManager) {
    if (SceneModeUtil.isPlayerAlive(ecs)) return;

    ecs.withSingletons(SINGLETON_QUERY, (s) => {
      this.setupButton(ecs, s);
    });
  }

  private setupButton(ecs: ECSManager, s: MappedKlassObjType<typeof SINGLETON_QUERY>) {
    if (!s.settings.StartOverButtonInstace) {
      const e = ecs.createEntity();
      // TODO (sessamekesh): Move UI into something that is rendered more modularly instead of
      //  hacking together a system to do this garbage.
      e.addComponentRef(StandardButtonComponent, s.settings.StartOverButton);
      s.settings.StartOverButtonInstace = e;
    }
  }
}
