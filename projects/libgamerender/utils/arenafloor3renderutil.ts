import { ECSManager } from '@libecs/ecsmanager';
import { Klass } from '@libecs/klass';
import { GLContextComponent } from '@libgamerender/components/renderresourcecomponents';
import { ArenaFloor3ShaderSingleton } from '@libgamerender/renderresourcesingletons/shadercomponents';
import { mat4, vec2 } from 'gl-matrix';
import { SceneGraphComponent } from '@libgamemodel/components/commoncomponents';
import { Renderable2SceneGraphModule } from '@librender/renderable/renderable2.scenegraphmodule';
import { ArenaFloor3Renderable2 } from '@librender/renderable/arenafloor3.renderable2';
import { TempGroupAllocator } from '@libutil/allocator';

export class ArenaFloor3RenderUtil {
  static renderEntitiesMatchingTags(
      ecs: ECSManager,
      tagSets: Klass<any>[][],
      matProj: mat4,
      matView: mat4,
      viewportSize: vec2,
      mat4Allocator: TempGroupAllocator<mat4>) {
    const singletonQuery = {
      gl: GLContextComponent,
      shader: ArenaFloor3ShaderSingleton,
      sceneGraph: SceneGraphComponent,
    };
    ecs.withSingletons(singletonQuery, (singletons) => {
      const gl = singletons.gl.gl;
      const shader = singletons.shader.ArenaFloor3Shader;

      const renderableModule = singletons.sceneGraph.SceneGraph.with(Renderable2SceneGraphModule);
      const renderables = renderableModule.queryRenderables(ArenaFloor3Renderable2, tagSets);

      const skipRendering = renderables.length === 0;
      if (skipRendering) return;

      shader.activate(gl);

      mat4Allocator.get(1, matWorld => {
        for (let i = 0; i < renderables.length; i++) {
          const renderable = renderables[i];
          renderable.getMat4(matWorld);
          shader.render(gl, {
            floorColor: renderable.renderable.perObjectData.floorColor.Value,
            geo: renderable.renderable.perObjectData.geo,
            matProj, matView,
            matWorld,
            reflectionFactor: renderable.renderable.perObjectData.reflectionFactor,
            reflectionTexture: renderable.renderable.perObjectData.reflectionTexture,
            viewportSize,
          });
        }
      });
    });
  }
}
