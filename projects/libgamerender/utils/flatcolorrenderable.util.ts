import { FlatColorLambertShader } from '@librender/shader/flatcolorlambertshader';
import { LightSettingsComponent } from '@libgamerender/components/lightsettings.component';
import { mat4 } from 'gl-matrix';
import { FlatColorLambertRenderableComponent } from '@libgamerender/components/flatcolorlambert.rendercomponent';
import { Klass } from '@libecs/klass';
import { ECSManager } from '@libecs/ecsmanager';

export class FlatColorRenderableUtil {
  static render(
      gl: WebGL2RenderingContext,
      shader: FlatColorLambertShader,
      renderable: FlatColorLambertRenderableComponent,
      lightSettings: LightSettingsComponent,
      matView: mat4,
      matProj: mat4) {
    shader.render(gl, {
      AmbientCoefficient: lightSettings.AmbientCoefficient,
      Geo: renderable.Geo,
      LightColor: lightSettings.Color,
      LightDirection: lightSettings.Direction,
      MatProj: matProj,
      MatView: matView,
      MatWorld: renderable.MatWorld,
    });
  }

  static renderEntitiesMatchingTags(
      gl: WebGL2RenderingContext,
      ecs: ECSManager,
      shader: FlatColorLambertShader,
      tags: Klass<any>[],
      lightSettings: LightSettingsComponent,
      matView: mat4,
      matProj: mat4) {
    shader.activate(gl);
    for (let i = 0; i < tags.length; i++) {
      const tag = tags[i];
      ecs.iterateComponents([FlatColorLambertRenderableComponent, tag], (entity, renderable) => {
        FlatColorRenderableUtil.render(
          gl, shader, renderable, lightSettings, matView, matProj);
      });
    }
  }
}
