import { LambertShader } from '@librender/shader/lambertshader';
import { LambertRenderableComponent } from '@libgamerender/components/lambertrenderable.component';
import { LightSettingsComponent, OverrideAmbientCoefficientComponent } from '@libgamerender/components/lightsettings.component';
import { mat4 } from 'gl-matrix';
import { ECSManager } from '@libecs/ecsmanager';
import { Klass } from '@libecs/klass';
import { TempGroupAllocator } from '@libutil/allocator';
import { GLContextComponent } from '@libgamerender/components/renderresourcecomponents';
import { LambertShaderComponent } from '@libgamerender/renderresourcesingletons/shadercomponents';
import { SceneGraphComponent } from '@libgamemodel/components/commoncomponents';
import { Renderable2SceneGraphModule } from '@librender/renderable/renderable2.scenegraphmodule';
import { LambertRenderable2 } from '@librender/renderable/lambert.renderable2';

// May want to support complex tags in the future - e.g., [MainPlayerTag, LightcycleRenderable] etc
type RenderTag = Klass<any>;

export class LambertRenderableUtil {
  static render(
      gl: WebGL2RenderingContext,
      lambertShader: LambertShader,
      renderable: LambertRenderableComponent,
      lightSettings: LightSettingsComponent,
      matView: mat4,
      matProj: mat4) {
    lambertShader.render(gl, {
      AmbientCoefficient: lightSettings.AmbientCoefficient,
      LightColor: lightSettings.Color,
      LightDirection: lightSettings.Direction,

      DiffuseTexture: renderable.DiffuseTexture,
      Geo: renderable.Geometry,
      MatWorld: renderable.MatWorld,

      MatProj: matProj,
      MatView: matView,
    });
  }

  private static renderEntitiesMatchingTagsInternal(
      gl: WebGL2RenderingContext,
      lambertShader: LambertShader,
      ecs: ECSManager,
      tag: Klass<any>,
      lightSettings: LightSettingsComponent,
      matView: mat4,
      matProj: mat4) {
    ecs.iterateComponents([tag, LambertRenderableComponent], (entity, _, renderable) => {
      const overriddenSettings = {...lightSettings};
      const ambientOverride = entity.getComponent(OverrideAmbientCoefficientComponent);
      if (ambientOverride) {
        overriddenSettings.AmbientCoefficient = ambientOverride.AmbientCoefficient;
      }
      LambertRenderableUtil.render(
        gl, lambertShader, renderable, overriddenSettings, matView, matProj);
    });
  }

  static renderEntitiesMatchingTags(
      gl: WebGL2RenderingContext,
      ecs: ECSManager,
      lambertShader: LambertShader,
      tags: RenderTag[],
      lightSettings: LightSettingsComponent,
      matView: mat4,
      matProj: mat4) {
    lambertShader.activate(gl);
    for (let i = 0; i < tags.length; i++) {
      const tag = tags[i];
      LambertRenderableUtil.renderEntitiesMatchingTagsInternal(
        gl, lambertShader, ecs, tag, lightSettings, matView, matProj);
    }
  }

  static renderEntitiesMatchingTags2(
      ecs: ECSManager,
      tagSets: RenderTag[][],
      lightSettings: LightSettingsComponent,
      matView: mat4,
      matProj: mat4,
      mat4Allocator: TempGroupAllocator<mat4>) {
    const singletonQuery = {
      gl: GLContextComponent,
      shader: LambertShaderComponent,
      sceneGraph: SceneGraphComponent,
    };
    ecs.withSingletons(singletonQuery, (singletons) => {
      const gl = singletons.gl.gl;
      const shader = singletons.shader.LambertShader;

      const renderableModule = singletons.sceneGraph.SceneGraph.with(Renderable2SceneGraphModule);
      const renderables = renderableModule.queryRenderables(LambertRenderable2, tagSets);

      const skipRendering = renderables.length === 0;
      if (skipRendering) return;

      shader.activate(gl);

      mat4Allocator.get(1, (matWorld) => {
        for (let i = 0; i < renderables.length; i++) {
          const renderable = renderables[i];
          renderable.getMat4(matWorld);
          const r = renderable.renderable.perObjectData;
          shader.render(gl, {
            AmbientCoefficient: r.ambientOverride || lightSettings.AmbientCoefficient,
            DiffuseTexture: r.diffuseTexture,
            Geo: r.geo,
            LightColor: lightSettings.Color,
            LightDirection: lightSettings.Direction,
            MatProj: matProj,
            MatView: matView,
            MatWorld: matWorld,
          });
        }
      });
    });
  }
}
