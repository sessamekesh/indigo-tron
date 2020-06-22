import { ECSManager } from '@libecs/ecsmanager';
import { Klass } from '@libecs/klass';
import { GLContextComponent } from '@libgamerender/components/renderresourcecomponents';
import { ArenaFloor3ShaderSingleton } from '@libgamerender/renderresourcesingletons/shadercomponents';
import { ArenaFloor3RenderableGroupSingleton } from '@libgamerender/arena/arenafloor3renderablegroup.singleton';
import { mat4, vec2 } from 'gl-matrix';

export class ArenaFloor3RenderUtil {
  static renderEntitiesMatchingTags(
      ecs: ECSManager,
      tagSets: Klass<any>[][],
      matProj: mat4,
      matView: mat4,
      viewportSize: vec2) {
    const singletonQuery = {
      gl: GLContextComponent,
      shader: ArenaFloor3ShaderSingleton,
      renderGroup: ArenaFloor3RenderableGroupSingleton,
    };
    ecs.withSingletons(singletonQuery, (singletons) => {
      const gl = singletons.gl.gl;
      const shader = singletons.shader.ArenaFloor3Shader;
      const renderGroup = singletons.renderGroup.RenderableGroup;

      const renderableSets = tagSets.map(tagSet => renderGroup.query(tagSet));

      const skipRendering = renderableSets.every(set => set.length === 0);
      if (skipRendering) return;

      shader.activate(gl);
      renderableSets.forEach((renderableSet) => {
        renderableSet.forEach((renderable) => {
          shader.render(gl, {
            floorColor: renderable.perObjectData.floorColor.Value,
            geo: renderable.glResources.geo,
            matProj, matView,
            matWorld: renderable.perObjectData.matWorld.Value,
            reflectionFactor: renderable.perObjectData.reflectionFactor,
            reflectionTexture: renderable.glResources.reflectionTexture,
            viewportSize,
          });
        });
      });
    });
  }
}
