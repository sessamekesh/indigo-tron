import { Solid2DShader } from '@librender/shader/solid2dshader';
import { Solid2DRenderableComponent } from '@libgamerender/components/solid2drenderable.component';
import { ECSManager } from '@libecs/ecsmanager';
import { Klass } from '@libecs/klass';
import { GLContextComponent } from '@libgamerender/components/renderresourcecomponents';
import { Solid2DShaderComponent } from '@libgamerender/renderresourcesingletons/shadercomponents';

export class Solid2DRenderableUtil {
  static render(
      gl: WebGL2RenderingContext,
      shader: Solid2DShader,
      renderable: Solid2DRenderableComponent) {
    shader.render(gl, {
      Color: renderable.Color.Value,
      Geo: renderable.Geo,
      Offset: renderable.Offset.Value,
      Rotation: renderable.Rotation,
      Scale: renderable.Scale.Value,
    });
  }

  static renderEntitiesMatchingTags(
      ecs: ECSManager,
      tags: Klass<any>[]) {
    const gl = ecs.getSingletonComponent(GLContextComponent)?.gl;
    const shader = ecs.getSingletonComponent(Solid2DShaderComponent)?.Solid2DShader;
    if (!gl || !shader) return; // Error case: log?

    shader.activate(gl);
    for (let i = 0; i < tags.length; i++) {
      const tag = tags[i];
      ecs.iterateComponents2(
        {}, {tag, Solid2DRenderableComponent}, (entity, singletons, components) => {
        Solid2DRenderableUtil.render(gl, shader, components.Solid2DRenderableComponent);
      });
    }
  }
}
