import { ECSManager } from '@libecs/ecsmanager';
import { Klass } from '@libecs/klass';
import { mat4 } from 'gl-matrix';
import { TempGroupAllocator } from '@libutil/allocator';
import { GLContextComponent } from '@libgamerender/components/renderresourcecomponents';
import { ArenaWallShader2Singleton } from '@libgamerender/renderresourcesingletons/shadercomponents';
import { SceneGraphComponent, MathAllocatorsComponent } from '@libgamemodel/components/commoncomponents';
import { Renderable2SceneGraphModule } from '@librender/renderable/renderable2.scenegraphmodule';
import { ArenaWallShader2Renderable2 } from '@libgamerender/shaders/arenawallshader2.renderable';

export class ArenaWall2RenderableUtil {
  static renderEntitiesMatchingTags(
      ecs: ECSManager,
      tagSets: Klass<any>[][],
      matProj: mat4,
      matView: mat4) {
    const singletonQuery = {
      gl: GLContextComponent,
      shader: ArenaWallShader2Singleton,
      sceneGraph: SceneGraphComponent,
      tempAllocators: MathAllocatorsComponent,
    };

    ecs.withSingletons(singletonQuery, (singletons) => {
      const gl = singletons.gl.gl;
      const shader = singletons.shader.ArenaWallShader2;
      const mat4Allocator = singletons.tempAllocators.Mat4;
      const sceneGraph = singletons.sceneGraph.SceneGraph;

      const renderableModule = sceneGraph.with(Renderable2SceneGraphModule);
      const renderables =
        sceneGraph
          .with(Renderable2SceneGraphModule)
          .queryRenderables(ArenaWallShader2Renderable2, tagSets);

      if (renderables.length === 0) {
        return;
      }

      shader.activate(gl);
      mat4Allocator.get(1, (matWorld) => {
        for (let i = 0; i < renderables.length; i++) {
          const renderable = renderables[i];
          const objData = renderable.renderable.perObjectData;
          renderable.getMat4(matWorld);
          shader.render(gl, {
            baseColor: objData.baseColor.Value,
            cloudWispTexture1: objData.cloudWispTexture1,
            cloudWispTexture2: objData.cloudWispTexture2,
            geo: objData.geo,
            matProj, matView, matWorld,
            wispColor: objData.wispColor.Value,
            wispMaxIntensity: objData.wispMaxIntensity,
            wispMovement1: objData.wispMovement1.Value,
            wispMovement2: objData.wispMovement2.Value,
            wispScale1: objData.wispTexture1Scale.Value,
            wispScale2: objData.wispTexture2Scale.Value,
          });
        }
      });
    });
  }
}
