import { ArenaFloorShader } from '@librender/shader/arenafloorshader';
import { ArenaFloorRenderableComponent } from '@libgamerender/components/arenafloorrenderable.component';
import { LightSettingsComponent } from '@libgamerender/components/lightsettings.component';
import { mat4, vec2 } from 'gl-matrix';
import { ECSManager } from '@libecs/ecsmanager';
import { Klass } from '@libecs/klass';

export class ArenaFloorRenderableUtil {
  static render(
      gl: WebGL2RenderingContext,
      arenaFloorShader: ArenaFloorShader,
      renderable: ArenaFloorRenderableComponent,
      lightSettings: LightSettingsComponent,
      matView: mat4,
      matProj: mat4,
      viewportDimensions: vec2) {
    arenaFloorShader.render(gl, {
      BumpMapTexture: renderable.BumpMapTexture,
      Geo: renderable.Geo,
      LightColor: lightSettings.Color,
      MatProj: matProj,
      MatView: matView,
      MatWorld: renderable.MatWorld,
      ReflectionTexture: renderable.ReflectionTexture,
      ViewportSize: viewportDimensions,
      FloorGlowColor: renderable.GlowColor,
      LightDirection: lightSettings.Direction,
    });
  }

  static renderEntitiesMatchingTags(
      gl: WebGL2RenderingContext,
      ecs: ECSManager,
      shader: ArenaFloorShader,
      tags: Klass<any>[],
      lightSettings: LightSettingsComponent,
      matView: mat4,
      matProj: mat4,
      viewportDimensions: vec2) {
    shader.activate(gl);
    for (let i = 0; i < tags.length; i++) {
      const tag = tags[i];
      ecs.iterateComponents([ArenaFloorRenderableComponent, tag], (entity, renderable) => {
        ArenaFloorRenderableUtil.render(
          gl, shader, renderable, lightSettings, matView, matProj, viewportDimensions);
      });
    }
  }
}
