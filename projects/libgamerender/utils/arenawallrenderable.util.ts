import { ArenaWallGeo } from '@librender/geo/arenawallgeo';
import { mat4, vec3 } from 'gl-matrix';
import { ArenaWallRenderableComponent, ArenaWallTexturePackComponent } from '@libgamerender/components/arenawallrenderable.component';
import { ArenaWallShader } from '@librender/shader/arenawallshader';
import { Klass } from '@libecs/klass';
import { ECSManager } from '@libecs/ecsmanager';

const dummy_color = vec3.fromValues(0.2, 0.2, 1);

export class ArenaWallRenderableUtil {
  static render(
      gl: WebGL2RenderingContext,
      shader: ArenaWallShader,
      geo: ArenaWallGeo,
      renderable: ArenaWallRenderableComponent,
      textures: ArenaWallTexturePackComponent,
      matView: mat4,
      matProj: mat4) {
    shader.render(gl, {
      BaseColorDistortionTexture: textures.Distortion,
      BaseColorTexture: textures.BaseColor,
      BaseColorTilingScale: renderable.BaseColorTilingScale,
      DistortionOffset: renderable.DistortionOffset,
      ForceFieldColor: dummy_color,
      ForceFieldIntensityDisplacement: renderable.IntensityDisplacement,
      ForceFieldIntensityTexture: textures.Intensity,
      ForceFieldPatternTexture: textures.ForceField,
      ForceFieldTilingScale: renderable.ForceFieldTilingScale,
      Geo: geo,
      IntensityTilingScale: renderable.IntensityTilingScale,
      MatProj: matProj,
      MatView: matView,
      MatWorld: renderable.MatWorld,
    });
  }

  static renderEntitiesMatchingTags(
      gl: WebGL2RenderingContext,
      ecs: ECSManager,
      shader: ArenaWallShader,
      tags: Klass<any>[],
      geo: ArenaWallGeo,
      textures: ArenaWallTexturePackComponent,
      matView: mat4,
      matProj: mat4) {
    shader.activate(gl);
    for (let i = 0; i < tags.length; i++) {
      const tag = tags[i];
      ecs.iterateComponents([ArenaWallRenderableComponent, tag], (entity, renderable) => {
        ArenaWallRenderableUtil.render(
          gl, shader, geo, renderable, textures, matView, matProj);
      });
    }
  }
}
