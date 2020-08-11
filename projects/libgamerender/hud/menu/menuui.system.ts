import { ECSSystem } from '@libecs/ecssystem';
import { ECSManager, MappedKlassObjType } from '@libecs/ecsmanager';
import { MsdfGlyphShaderSingleton, SolidColorUiShaderSingleton } from '@libgamerender/renderresourcesingletons/shadercomponents';
import { OpenSansFontSingleton } from '@libgamerender/components/opensansfont.singleton';
import { SceneGraphComponent, OwnedMathAllocatorsComponent } from '@libgamemodel/components/commoncomponents';
import { HudViewportSingleton } from '../hudviewport.singleton';
import { MouseStateSingleton } from './mousestate.singleton';
import { StandardButtonComponent, StandardButtonListenersComponent, StandardButtonRenderComponent, MenuButtonRenderTag } from './btnstartgame.component';
import { Entity } from '@libecs/entity';
import { MouseStateManager } from '@io/mousestatemanager';
import { GLContextComponent } from '@libgamerender/components/renderresourcecomponents';
import { MsdfGlyphGeo } from '@librender/text/msdfglyphgeo';
import { LineGeoOriginPos } from '@librender/text/fontgeoutil';
import { MsdfStringRenderable2 } from '@librender/text/msdfstring.renderable2';
import { vec4, vec2 } from 'gl-matrix';
import { SolidColorUiRenderable2 } from '@librender/ui/solidcolorui.renderable2';
import { RectangleGeoGenerator } from '@librender/ui/rectangle.geogenerator';
import { Renderable2SceneNodeAddon } from '@librender/renderable/renderable2.scenenodeaddon';
import { UiTextRenderTag } from '../playerhealth/rendertags';

// TODO (sessamekesh): Integrate instead with a PlayerInputSystem facade model so that mouse clicks
//  aren't necessary.

const SINGLETON_QUERY = {
  glc: GLContextComponent,
  fontShader: MsdfGlyphShaderSingleton,
  solidShader: SolidColorUiShaderSingleton,
  font: OpenSansFontSingleton,
  sceneGraph: SceneGraphComponent,
  hud: HudViewportSingleton,
  allocators: OwnedMathAllocatorsComponent,
  mouseStateSingleton: MouseStateSingleton,
};

const BUTTON_COMPONENT_QUERY = {
  button: StandardButtonComponent,
}

export class MenuUiSystem extends ECSSystem {
  start(ecs: ECSManager) {
    return this.expectSingletons(ecs, SINGLETON_QUERY, 'MenuUiSystem');
  }

  update(ecs: ECSManager, msDt: number) {
    ecs.iterateComponents2(SINGLETON_QUERY, BUTTON_COMPONENT_QUERY, (e, s, c) => {
      const listenersComponent =
        this.getMouseListenersComponent(e, s.mouseStateSingleton.MouseStateManager);
      const renderableComponent = this.getMouseRenderComponent(e, s, c.button);

      if (listenersComponent.MouseDownInside && listenersComponent.MouseHoveredInside) {
        vec4.copy(
          renderableComponent.Background.perObjectData.Color.Value, c.button.PressedColor.Value);
      } else if (listenersComponent.MouseHoveredInside) {
        vec4.copy(
          renderableComponent.Background.perObjectData.Color.Value, c.button.HoverColor.Value);
      } else {
        vec4.copy(
          renderableComponent.Background.perObjectData.Color.Value, c.button.BtnColor.Value);
      }

      const textScale = 1.5 * s.hud.ViewportHeightPx / 1080;
      vec2.set(renderableComponent.TextRenderable.perObjectData.Scale.Value,
        textScale, -textScale);
      vec2.set(renderableComponent.Background.perObjectData.Scale.Value,
        c.button.Width * s.hud.ViewportWidthPx,
        c.button.Height * s.hud.ViewportHeightPx);

      vec2.set(renderableComponent.TextRenderable.perObjectData.TopLeftOffset.Value,
        c.button.Origin.Value[0] * s.hud.ViewportWidthPx,
        c.button.Origin.Value[1] * s.hud.ViewportHeightPx - 8);
      vec2.mul(renderableComponent.Background.perObjectData.TopLeftOffset.Value,
        c.button.Origin.Value, s.hud.ViewportDimensionsVec);
    });
  }

  private getMouseListenersComponent(entity: Entity, mouseStateManager: MouseStateManager) {
    let component = entity.getComponent(StandardButtonListenersComponent);
    if (!component) {
      const onMoveListener = mouseStateManager.addListener('mousemove', (evt) => {
        const btn = entity.getComponent(StandardButtonComponent);
        const lstn = entity.getComponent(StandardButtonListenersComponent);
        if (!btn || !lstn) return;

        const minX = (btn.Origin.Value[0] - btn.Width);
        const maxX = (btn.Origin.Value[0] + btn.Width);
        const minY = (btn.Origin.Value[1] - btn.Height);
        const maxY = (btn.Origin.Value[1] + btn.Height);
        const x = evt.x / evt.areaWidth;
        const y = 1.0 - evt.y / evt.areaHeight;

        lstn.MouseHoveredInside = (x <= maxX && x >= minX && y <= maxY && y >= minY);
      });
      const onDownListener = mouseStateManager.addListener('mousedown', (evt) => {
        const btn = entity.getComponent(StandardButtonComponent);
        const lstn = entity.getComponent(StandardButtonListenersComponent);
        if (!btn || !lstn) return;

        const minX = (btn.Origin.Value[0] - btn.Width);
        const maxX = (btn.Origin.Value[0] + btn.Width);
        const minY = (btn.Origin.Value[1] - btn.Height);
        const maxY = (btn.Origin.Value[1] + btn.Height);
        const x = evt.x / evt.areaWidth;
        const y = 1.0 - evt.y / evt.areaHeight;

        lstn.MouseDownInside = (x <= maxX && x >= minX && y <= maxY && y >= minY);
      });
      const onUpListener = mouseStateManager.addListener('mouseup', (evt) => {
        const btn = entity.getComponent(StandardButtonComponent);
        const lstn = entity.getComponent(StandardButtonListenersComponent);
        if (!btn || !lstn || !lstn.MouseDownInside) return;

        const minX = (btn.Origin.Value[0] - btn.Width);
        const maxX = (btn.Origin.Value[0] + btn.Width);
        const minY = (btn.Origin.Value[1] - btn.Height);
        const maxY = (btn.Origin.Value[1] + btn.Height);
        const x = evt.x / evt.areaWidth;
        const y = 1.0 - evt.y / evt.areaHeight;

        const pressedInside = (x <= maxX && x >= minX && y <= maxY && y >= minY);
        if (pressedInside && lstn.MouseDownInside) {
          btn.OnPress();
        }

        lstn.MouseDownInside = false;
      });

      entity.addListener('destroy', () => {
        mouseStateManager.removeListener('mousemove', onMoveListener);
        mouseStateManager.removeListener('mousedown', onDownListener);
        mouseStateManager.removeListener('mouseup', onUpListener);
      });

      component = entity.addComponent(
        StandardButtonListenersComponent,
        false, false, onMoveListener, onDownListener, onUpListener);
    }
    return component;
  }

  private getMouseRenderComponent(
      entity: Entity, s: MappedKlassObjType<typeof SINGLETON_QUERY>, btn: StandardButtonComponent) {
    let component = entity.getComponent(StandardButtonRenderComponent);
    if (!component) {
      const sceneNode = s.sceneGraph.SceneGraph.createSceneNode();
      const { Vec2, Vec4 } = s.allocators;
      const geo = MsdfGlyphGeo.create(
        s.glc.gl, s.fontShader.MsdfGlyphShader, btn.Text, s.font.OpenSans,
        LineGeoOriginPos.BOTTOM_CENTER, 28, false, true);
      const rectGeo = RectangleGeoGenerator.createRectangle(
        s.glc.gl, s.solidShader.Shader, vec2.fromValues(1, 1));
      if (!geo || !rectGeo) throw new Error('Failed to generate button geometry');

      const textRenderable = new MsdfStringRenderable2({
        AlphaThreshold: 0.05,
        Font: s.font.OpenSans,
        Geo: geo,
        GlyphColor: Vec4.get(),
        Scale: Vec2.get(),
        TopLeftOffset: Vec2.get(),
        Z: 0.95,
      });
      textRenderable.addTag(UiTextRenderTag);
      vec4.set(textRenderable.perObjectData.GlyphColor.Value, 1, 1, 1, 1);

      const outlineRectRenderable = new SolidColorUiRenderable2({
        Color: Vec4.get(),
        Geo: rectGeo,
        Scale: Vec2.get(),
        TopLeftOffset: Vec2.get(),
        Z: 0.2,
      });
      outlineRectRenderable.addTag(MenuButtonRenderTag);
      vec4.copy(outlineRectRenderable.perObjectData.Color.Value, btn.BtnColor.Value);

      sceneNode.getAddon(Renderable2SceneNodeAddon)
        .addRenderable(MsdfStringRenderable2, textRenderable)
        .addRenderable(SolidColorUiRenderable2, outlineRectRenderable);
      entity.addListener('destroy', () => sceneNode.destroy());
      component = entity.addComponent(
        StandardButtonRenderComponent,
        textRenderable,
        outlineRectRenderable);
    }
    return component;
  }
}
