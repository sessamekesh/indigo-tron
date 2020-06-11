import { ECSSystem } from '@libecs/ecssystem';
import { ECSManager } from '@libecs/ecsmanager';
import { MinimapComponent } from './minimap.component';
import { Entity } from '@libecs/entity';
import { Solid2DRenderableComponent } from '@libgamerender/components/solid2drenderable.component';
import { LifecycleOwnedAllocator } from '@libutil/allocator';
import { vec2, vec4 } from 'gl-matrix';
import { FlatCircleGenerator } from '@librender/geo/generators/flatcirclegenerator';
import { Solid2DShader } from '@librender/shader/solid2dshader';
import { GLContextComponent } from '@libgamerender/components/renderresourcecomponents';
import { Solid2DShaderComponent } from '@libgamerender/renderresourcesingletons/shadercomponents';
import { OwnedMathAllocatorsComponent } from '@libgamemodel/components/commoncomponents';
import { HudViewportSingleton } from './hudviewport.singleton';

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
      const renderComponent = this.getOrAttachSolid2DRenderable(
        entity, vec2Allocator, vec4Allocator, solid2DShader, gl);

      // TODO (sessamekesh): Update the minimap rendering values based on the current viewport
      const maxSizePx = Math.min(
        components.MinimapComponent.MaxViewportWidth * hudConfig.ViewportWidthPx,
        components.MinimapComponent.MaxViewportHeight * hudConfig.ViewportHeightPx);
      const centerLeftPx = hudConfig.ViewportWidthPx - components.MinimapComponent.RightPx - maxSizePx / 2;
      const centerTopPx = hudConfig.ViewportHeightPx - components.MinimapComponent.TopPx - maxSizePx / 2;
      vec2.set(
        renderComponent.Offset.Value,
        (centerLeftPx / hudConfig.ViewportWidthPx) * 2 - 1,
        (centerTopPx / hudConfig.ViewportHeightPx) * 2 - 1);
      vec2.set(
        renderComponent.Scale.Value,
        maxSizePx / hudConfig.ViewportWidthPx,
        maxSizePx / hudConfig.ViewportHeightPx);
    });
  }

  private getOrAttachSolid2DRenderable(
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
}
