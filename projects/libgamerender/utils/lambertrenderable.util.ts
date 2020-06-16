import { LambertShader } from '@librender/shader/lambertshader';
import { LambertRenderableComponent } from '@libgamerender/components/lambertrenderable.component';
import { LightSettingsComponent, OverrideAmbientCoefficientComponent } from '@libgamerender/components/lightsettings.component';
import { mat4 } from 'gl-matrix';
import { ECSManager } from '@libecs/ecsmanager';
import { Klass } from '@libecs/klass';
import { LambertRenderableGroup } from '@librender/renderable/lambertrenderableutil';

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
      gl: WebGL2RenderingContext,
      lambertGroup: LambertRenderableGroup,
      lambertShader: LambertShader,
      tags: RenderTag[][],
      lightSettings: LightSettingsComponent,
      matView: mat4,
      matProj: mat4) {
    tags.forEach(tagSet => {
      const renderables = lambertGroup.query(tagSet);
      if (renderables.length === 0) return;

      lambertShader.activate(gl);
      for (let i = 0; i < renderables.length; i++) {
        const renderable = renderables[i];
        lambertShader.render(gl, {
          AmbientCoefficient: lightSettings.AmbientCoefficient,
          DiffuseTexture: renderable.glResources.diffuseTexture,
          Geo: renderable.glResources.geo,
          LightColor: lightSettings.Color,
          LightDirection: lightSettings.Direction,
          MatProj: matProj,
          MatView: matView,
          MatWorld: renderable.perObjectData.matWorld.Value,
        });
      }
    });
  }
}
