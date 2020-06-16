import { ECSSystem } from '@libecs/ecssystem';
import { ECSManager } from '@libecs/ecsmanager';
import { MinimapComponent } from './minimap.component';
import { Entity } from '@libecs/entity';
import { Solid2DRenderableComponent } from '@libgamerender/components/solid2drenderable.component';
import { LifecycleOwnedAllocator, TempGroupAllocator } from '@libutil/allocator';
import { vec2, vec4 } from 'gl-matrix';
import { FlatCircleGenerator } from '@librender/geo/generators/flatcirclegenerator';
import { Solid2DShader } from '@librender/shader/solid2dshader';
import { GLContextComponent } from '@libgamerender/components/renderresourcecomponents';
import { Solid2DShaderComponent } from '@libgamerender/renderresourcesingletons/shadercomponents';
import { OwnedMathAllocatorsComponent } from '@libgamemodel/components/commoncomponents';
import { HudViewportSingleton } from './hudviewport.singleton';
import { LightcycleMinimapGeoSingleton } from './lightcycleminimapgeo.singleton';
import { LightcycleComponent2 } from '@libgamemodel/lightcycle/lightcycle.component';

export class MinimapRenderSystem extends ECSSystem {
  start() { return true; }

  update(ecs: ECSManager, msDt: number) {
    const singletonQuery = {
      gl: GLContextComponent,
      solid2DShader: Solid2DShaderComponent,
      allocators: OwnedMathAllocatorsComponent,
      hudConfig: HudViewportSingleton,
    };
    ecs.iterateComponents2(singletonQuery, {MinimapComponent}, (entity, singletons, components) => {
      const {Vec2: vec2Allocator, Vec4: vec4Allocator} = singletons.allocators;
      const {Solid2DShader: solid2DShader} = singletons.solid2DShader;
      const {gl} = singletons.gl;
      const hudConfig = singletons.hudConfig;

      const minimapBaseRenderComponent = this.getOrAttachMinimapBase2DRenderable(
        entity, vec2Allocator, vec4Allocator, solid2DShader, gl);
      this.updateMinimapBase2DRenderable(
        hudConfig, components.MinimapComponent, minimapBaseRenderComponent);
    });

    // TODO (sessamekesh): Continue here. You should iterate over all lightcycles, and attach a
    //  render component to them. You should determine the on-screen position of that renderable
    //  by using the minimap bounds - you'll have to persist those somehow (a hack will do?)
    // ACTUALLY what you should do is render one for each minimap - if there are multiple minimaps,
    //  then you'll want to render lightcycles to each, no? But in order to do that, you'll need to
    //  have renderable components be attached as children, instead of as single components.
    // TODO (sessamekesh): You actually need to consider that part of the design. Right now, you
    //  arbitrarily attach renderable components to entities, which doesn't exactly make sense. An
    //  entity may reasonably contain many renderables, and components serve more as the presence
    //  or non-presence of an attribute - it does not do well with 0..many relationships.
    // It may be worth encapsulating a renderable in some extension of a scene node - or perhaps
    //  a tuple that contains both geometry and the scene node. This would also be beneficial in
    //  cases like this - you want the lightcycle to be at some position relative to the center of
    //  the minimap. That also gives you the ability to toggle rendering / casting shadows /
    //  whatever on and off.
    // Those renderables can then be added to collection components containing a list of renderables
    //  of a certain type. The entity itself would be considered to "own" the renderable, and by
    //  removing the component, the renderables would implicitly be cleaned up.
    // You'd need a way to reference individual renderable nodes though - perhaps a key of some sort
    //  that you could reference into an object's renderable collection? This is in case multiple
    //  components of an object want to attach a renderable (which should be rare).
  }

  private getOrAttachMinimapBase2DRenderable(
      entity: Entity,
      vec2Allocator: LifecycleOwnedAllocator<vec2>,
      vec4Allocator: LifecycleOwnedAllocator<vec4>,
      shader: Solid2DShader,
      gl: WebGL2RenderingContext): Solid2DRenderableComponent {
    let component = entity.getComponent(Solid2DRenderableComponent);
    if (!component) {
      const geo = FlatCircleGenerator.generateUnitSolid2DCircle(gl, shader, 1, 1, 48);
      const rotation = 0;
      const scale = vec2Allocator.get();
      vec2.set(scale.Value, 1, 1);
      const offset = vec2Allocator.get();
      vec2.set(offset.Value, 0, 0);
      const color = vec4Allocator.get();
      vec4.set(color.Value, 0.54, 0.5, 0.4, 1.0);
      component = entity.addComponent(
        Solid2DRenderableComponent, geo, rotation, scale, offset, color);
    }

    return component;
  }

  private updateMinimapBase2DRenderable(
      hud: HudViewportSingleton,
      minimapComponent: MinimapComponent,
      renderable: Solid2DRenderableComponent) {
    const maxSizePx = Math.min(
      minimapComponent.MaxViewportWidth * hud.ViewportWidthPx,
      minimapComponent.MaxViewportHeight * hud.ViewportHeightPx);
    const centerLeftPx = hud.ViewportWidthPx - minimapComponent.RightPx - maxSizePx / 2;
    const centerTopPx = hud.ViewportHeightPx - minimapComponent.TopPx - maxSizePx / 2;
    vec2.set(
      renderable.Offset.Value,
      (centerLeftPx / hud.ViewportWidthPx) * 2 - 1,
      (centerTopPx / hud.ViewportHeightPx) * 2 - 1);
    vec2.set(
      renderable.Scale.Value,
      maxSizePx / hud.ViewportWidthPx,
      maxSizePx / hud.ViewportHeightPx);
  }

  private getLightcycleMinimapRenderable(
      ecs: ECSManager,
      vec2Allocator: LifecycleOwnedAllocator<vec2>,
      vec4Allocator: LifecycleOwnedAllocator<vec4>,
      entity: Entity,
      shader: Solid2DShader,
      gl: WebGL2RenderingContext): Solid2DRenderableComponent {
    const existing = entity.getComponent(Solid2DRenderableComponent);
    if (existing) return existing;

    let geoComponent = ecs.getSingletonComponent(LightcycleMinimapGeoSingleton);
    if (!geoComponent) {
      // TODO (sessamekesh): Replace this with a box instead
      const geo = FlatCircleGenerator.generateUnitSolid2DCircle(gl, shader, 1, 0.5, 12);
      const e = ecs.createEntity();
      geoComponent = e.addComponent(LightcycleMinimapGeoSingleton, geo);
    }

    const rotation = 0;
    const offset = vec2Allocator.get();
    vec2.set(offset.Value, 1, 1);
    const scale = vec2Allocator.get();
    vec2.set(scale.Value, 1, 1);
    const color = vec4Allocator.get();
    vec4.set(color.Value, 1, 0, 0, 1);

    return entity.addComponent(
      Solid2DRenderableComponent, geoComponent.Geo, rotation, scale, offset, color);
  }

  private updateLightcycleMinimapRenderable(
      minimapOffset: vec2,
      minimapSize: vec2,
      lightcycleComponent: LightcycleComponent2,
      playerPosition2: vec2,
      renderable: Solid2DRenderableComponent,
      vec2Allocator: TempGroupAllocator<vec2>) {

  }
}
