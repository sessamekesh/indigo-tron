import { ECSSystem } from '@libecs/ecssystem';
import { ECSManager, MappedKlassObjType } from '@libecs/ecsmanager';
import { HealthComponent } from '@libgamemodel/components/healthcomponent';
import { MainPlayerComponent } from '@libgamemodel/components/commoncomponents';
import { PlayerHealthUiComponent } from './playerhealthui.component';
import { GLContextComponent } from '@libgamerender/components/renderresourcecomponents';
import { MsdfGlyphShaderSingleton } from '@libgamerender/renderresourcesingletons/shadercomponents';
import { MsdfGlyphGeo } from '@librender/text/msdfglyphgeo';
import { OpenSansFontSingleton } from '@libgamerender/components/opensansfont.singleton';
import { LineGeoOriginPos } from '@librender/text/fontgeoutil';

const SINGLETON_QUERY = {
  glc: GLContextComponent,
  shader: MsdfGlyphShaderSingleton,
  font: OpenSansFontSingleton,
};

const MAIN_PLAYER_HEALTH_COMPONENT_QUERY = {
  player: MainPlayerComponent,
  health: HealthComponent,
};

const UI_QUERY = {
  playerHealthUi: PlayerHealthUiComponent,
};

export class PlayerHealthUiSystem extends ECSSystem {
  start(ecs: ECSManager) {
    return this.expectSingletons(ecs, SINGLETON_QUERY, 'PlayerHealthUiSystem');
  }

  update(ecs: ECSManager) {
    let playerHealth: HealthComponent|null = null;
    ecs.iterateComponents2({}, MAIN_PLAYER_HEALTH_COMPONENT_QUERY, (e, s, c) => {
      playerHealth = c.health;
    });

    if (!playerHealth) playerHealth = new HealthComponent(0, 100);

    ecs.withSingletons(SINGLETON_QUERY, (s) => {
      const playerHealthComponent = PlayerHealthUiSystem.getPlayerHealthUiComponent(ecs, s);
      playerHealthComponent.Geo.updateText(
        s.glc.gl, s.shader.MsdfGlyphShader,
        `${playerHealth!.Health.toFixed(0)} / ${playerHealth!.MaxHealth.toFixed(0)}`,
        s.font.OpenSans);
    });
  }

  private static getPlayerHealthUiComponent(
      ecs: ECSManager,
      s: MappedKlassObjType<typeof SINGLETON_QUERY>): PlayerHealthUiComponent {
    let component: PlayerHealthUiComponent|null = null;
    ecs.iterateComponents2({}, UI_QUERY, (e, s, c) => {
      component = c.playerHealthUi;
    });

    if (!component) {
      const e = ecs.createEntity();
      component = e.addComponent(
        PlayerHealthUiComponent,
        MsdfGlyphGeo.create(
          s.glc.gl, s.shader.MsdfGlyphShader, '100 / 100', s.font.OpenSans,
          LineGeoOriginPos.BOTTOM_CENTER, 50, false, true));
    }

    return component;
  }
}
