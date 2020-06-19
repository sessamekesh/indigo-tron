import { LightSettingsComponent } from '@libgamerender/components/lightsettings.component';
import { mat4, vec2, vec3 } from 'gl-matrix';
import { Klass } from '@libecs/klass';
import { ArenaFloorShader2 } from '@librender/shader/arenafloorshader2';
import { ArenaFloor2RenderableGroup } from '@librender/renderable/arenafloor2renderableutil';

export class ArenaFloorRenderableUtil {
  static renderEntitiesMatchingTags2(
      gl: WebGL2RenderingContext,
      shader: ArenaFloorShader2,
      renderGroup: ArenaFloor2RenderableGroup,
      tags: Klass<any>[][],
      lightSettings: LightSettingsComponent,
      matView: mat4,
      matProj: mat4,
      viewportDimensions: vec2) {
    tags.forEach(tagSet => {
      const renderables = renderGroup.query(tagSet);
      if (renderables.length === 0) return;

      shader.activate(gl);
      for (let i = 0; i < renderables.length; i++) {
        const renderable = renderables[i];
        shader.render(gl, {
          albedoTexture: renderable.glResources.albedoTexture,
          geo: renderable.glResources.geo,
          lightColor: lightSettings.Color,
          lightDirection: lightSettings.Direction,
          ambientCoefficient: lightSettings.AmbientCoefficient,
          matProj: matProj,
          matView: matView,
          matWorld: renderable.perObjectData.matWorld.Value,
          normalTexture: renderable.glResources.normalTexture,
          reflectionTexture: renderable.glResources.reflectionTexture,
          roughnessTexture: renderable.glResources.roughnessTexture,
          viewportSize: viewportDimensions,
        });
      }
    });
  }
}
