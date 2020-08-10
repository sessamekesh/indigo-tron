import { ECSSystem } from '@libecs/ecssystem';
import { ECSManager, MappedKlassObjType } from '@libecs/ecsmanager';
import { HealthComponent } from '@libgamemodel/components/healthcomponent';
import { MainPlayerComponent, SceneGraphComponent, OwnedMathAllocatorsComponent } from '@libgamemodel/components/commoncomponents';
import { PlayerHealthUiComponent } from './playerhealthui.component';
import { GLContextComponent } from '@libgamerender/components/renderresourcecomponents';
import { MsdfGlyphShaderSingleton, SolidColorUiShaderSingleton } from '@libgamerender/renderresourcesingletons/shadercomponents';
import { MsdfGlyphGeo } from '@librender/text/msdfglyphgeo';
import { OpenSansFontSingleton } from '@libgamerender/components/opensansfont.singleton';
import { LineGeoOriginPos } from '@librender/text/fontgeoutil';
import { Renderable2SceneNodeAddon } from '@librender/renderable/renderable2.scenenodeaddon';
import { MsdfStringRenderable2 } from '@librender/text/msdfstring.renderable2';
import { HudViewportSingleton } from '../hudviewport.singleton';
import { vec2, vec4 } from 'gl-matrix';
import { UiTextRenderTag, UiHealthBarRenderTag } from './rendertags';
import { HalfCircleGeoGenerator } from '@librender/ui/halfcircle.geogenerator';
import { SolidColorUiRenderable2 } from '@librender/ui/solidcolorui.renderable2';
import { RectangleGeoGenerator } from '@librender/ui/rectangle.geogenerator';

const SINGLETON_QUERY = {
  glc: GLContextComponent,
  shader: MsdfGlyphShaderSingleton,
  solidShader: SolidColorUiShaderSingleton,
  font: OpenSansFontSingleton,
  sceneGraph: SceneGraphComponent,
  allocators: OwnedMathAllocatorsComponent,
  hud: HudViewportSingleton,
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
      playerHealthComponent.TextRenderable.perObjectData.Geo.updateText(
        s.glc.gl, s.shader.MsdfGlyphShader,
        `${Math.min(playerHealth!.MaxHealth, Math.max(0, playerHealth!.Health)).toFixed(0)} / ${playerHealth!.MaxHealth.toFixed(0)}`,
        s.font.OpenSans);
      const textScale = s.hud.ViewportHeightPx / 1080;
      vec2.set(
        playerHealthComponent.TextRenderable.perObjectData.TopLeftOffset.Value,
        s.hud.ViewportWidthPx / 2,
        95);
      vec2.set(
        playerHealthComponent.OutlineLeftHalfCircle.perObjectData.TopLeftOffset.Value,
        s.hud.ViewportWidthPx * 0.25,
        85 + textScale * 18);
      vec2.set(
        playerHealthComponent.OutlineRightHalfCircle.perObjectData.TopLeftOffset.Value,
        s.hud.ViewportWidthPx * 0.75,
        85 + textScale * 18);
      vec2.set(
        playerHealthComponent.OutlineRect.perObjectData.TopLeftOffset.Value,
        s.hud.ViewportWidthPx * 0.5,
        85 + textScale * 18);
      const healthPercent = Math.max(0, Math.min(1, playerHealth!.Health / playerHealth!.MaxHealth));
      vec2.set(
        playerHealthComponent.RedRect.perObjectData.TopLeftOffset.Value,
        s.hud.ViewportWidthPx * 0.5, 87 + textScale * 16);
      vec2.set(
        playerHealthComponent.GreenRect.perObjectData.TopLeftOffset.Value,
        // Right position is 0.7 * viewport width
        // Width is 0.4 * viewport width * health percentage
        (s.hud.ViewportWidthPx * 0.75 - 0.25 * s.hud.ViewportWidthPx * healthPercent),
        87 + textScale * 16);


      vec2.set(playerHealthComponent.TextRenderable.perObjectData.Scale.Value, textScale, -textScale);
      vec2.set(
        playerHealthComponent.OutlineLeftHalfCircle.perObjectData.Scale.Value,
        textScale * 28, textScale * 28);
      vec2.set(
        playerHealthComponent.OutlineRightHalfCircle.perObjectData.Scale.Value,
        -textScale * 28, textScale * 28);
      vec2.set(
        playerHealthComponent.OutlineRect.perObjectData.Scale.Value,
        s.hud.ViewportWidthPx * 0.25, textScale * 28);
      vec2.set(
        playerHealthComponent.RedRect.perObjectData.Scale.Value,
        0.25 * s.hud.ViewportWidthPx,
        textScale * 28 * 0.75);
      vec2.set(
        playerHealthComponent.GreenRect.perObjectData.Scale.Value,
        0.25 * s.hud.ViewportWidthPx * healthPercent,
        textScale * 28 * 0.75);
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
      const sceneNode = s.sceneGraph.SceneGraph.createSceneNode();
      const { Vec2, Vec4 } = s.allocators;
      const geo = MsdfGlyphGeo.create(
        s.glc.gl, s.shader.MsdfGlyphShader, '100 / 100', s.font.OpenSans,
        LineGeoOriginPos.BOTTOM_CENTER, 28, false, true);
      if (!geo) throw new Error('Failed to generate text geometry');

      const textRenderable = new MsdfStringRenderable2({
        AlphaThreshold: 0.05,
        Font: s.font.OpenSans,
        Geo: geo,
        GlyphColor: Vec4.get(),
        Scale: Vec2.get(),
        TopLeftOffset: Vec2.get(),
        Z: 0.2,
      });
      textRenderable.addTag(UiTextRenderTag);
      vec4.set(textRenderable.perObjectData.GlyphColor.Value, 1, 1, 1, 1);

      const outlineLeftHalfCircleGeo = HalfCircleGeoGenerator.generate(
        s.glc.gl, s.solidShader.Shader, 1, Math.PI, 10);
      const outlineRectGeo = RectangleGeoGenerator.createRectangle(
        s.glc.gl, s.solidShader.Shader, vec2.fromValues(1, 1));
      if (!outlineLeftHalfCircleGeo || !outlineRectGeo) {
        throw new Error('Failed to generate health bar geometry');
      }
      const outlineLeftHalfCircleRenderable = new SolidColorUiRenderable2({
        Color: Vec4.get(),
        Geo: outlineLeftHalfCircleGeo,
        Scale: Vec2.get(),
        TopLeftOffset: Vec2.get(),
        Z: 0.95,
      });
      const outlineRightHalfCircleRenderable = new SolidColorUiRenderable2({
        Color: Vec4.get(),
        Geo: outlineLeftHalfCircleGeo,
        Scale: Vec2.get(),
        TopLeftOffset: Vec2.get(),
        Z: 0.95,
      });
      const outlineRectRenderable = new SolidColorUiRenderable2({
        Color: Vec4.get(),
        Geo: outlineRectGeo,
        Scale: Vec2.get(),
        TopLeftOffset: Vec2.get(),
        Z: 0.95,
      });
      const greenRectRenderable = new SolidColorUiRenderable2({
        Color: Vec4.get(),
        Geo: outlineRectGeo,
        Scale: Vec2.get(),
        TopLeftOffset: Vec2.get(),
        Z: 0.5,
      });
      const redRectRenderable = new SolidColorUiRenderable2({
        Color: Vec4.get(),
        Geo: outlineRectGeo,
        Scale: Vec2.get(),
        TopLeftOffset: Vec2.get(),
        Z: 0.9,
      });
      vec4.set(outlineLeftHalfCircleRenderable.perObjectData.Color.Value, 0.35, 0.35, 0.35, 1.0);
      outlineLeftHalfCircleRenderable.addTag(UiHealthBarRenderTag);
      vec4.set(outlineRightHalfCircleRenderable.perObjectData.Color.Value, 0.35, 0.35, 0.35, 1.0);
      outlineRightHalfCircleRenderable.addTag(UiHealthBarRenderTag);
      vec4.set(outlineRectRenderable.perObjectData.Color.Value, 0.35, 0.35, 0.35, 1.0);
      outlineRectRenderable.addTag(UiHealthBarRenderTag);
      vec4.set(greenRectRenderable.perObjectData.Color.Value, 0.2, 0.65, 0.3, 1.0);
      greenRectRenderable.addTag(UiHealthBarRenderTag);
      vec4.set(redRectRenderable.perObjectData.Color.Value, 0.65, 0.3, 0.2, 1.0);
      redRectRenderable.addTag(UiHealthBarRenderTag);

      // TODO (sessamekesh): Add in the health bar stuff here too! Use the solid color 2D shader,
      //  or perhaps write a new one if the existing implementation isn't up to snuff.

      sceneNode.getAddon(Renderable2SceneNodeAddon)
        .addRenderable(MsdfStringRenderable2, textRenderable)
        .addRenderable(SolidColorUiRenderable2, outlineLeftHalfCircleRenderable)
        .addRenderable(SolidColorUiRenderable2, outlineRightHalfCircleRenderable)
        .addRenderable(SolidColorUiRenderable2, outlineRectRenderable)
        .addRenderable(SolidColorUiRenderable2, greenRectRenderable)
        .addRenderable(SolidColorUiRenderable2, redRectRenderable);
      e.addListener('destroy', () => sceneNode.destroy());
      component = e.addComponent(
        PlayerHealthUiComponent,
        textRenderable,
        outlineLeftHalfCircleRenderable, outlineRightHalfCircleRenderable, outlineRectRenderable,
        greenRectRenderable, redRectRenderable);
    }

    return component;
  }
}
