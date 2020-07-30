import { Renderable2 } from '@librender/renderable/renderable2';
import { MsdfGlyphGeo } from './msdfglyphgeo';
import { OwnedResource } from '@libutil/allocator';
import { vec4, vec2, mat4 } from 'gl-matrix';
import { ECSManager } from '@libecs/ecsmanager';
import { Klass } from '@libecs/klass';
import { GLContextComponent } from '@libgamerender/components/renderresourcecomponents';
import { SceneGraphComponent } from '@libgamemodel/components/commoncomponents';
import { MsdfGlyphShaderSingleton } from '@libgamerender/renderresourcesingletons/shadercomponents';
import { Renderable2SceneNodeAddon } from '@librender/renderable/renderable2.scenenodeaddon';
import { Renderable2SceneGraphModule } from '@librender/renderable/renderable2.scenegraphmodule';
import { BMFont } from './bmfont';
import { HudViewportSingleton } from '@libgamerender/hud/hudviewport.singleton';

type PerObjectData = {
  Geo: MsdfGlyphGeo,
  Font: BMFont,
  GlyphColor: OwnedResource<vec4>,
  AlphaThreshold: number,
  Scale: OwnedResource<vec2>,
  TopLeftOffset: OwnedResource<vec2>,
  Z: number,
};

export class MsdfStringRenderable2 extends Renderable2<PerObjectData> {
  static renderMatchingTag(
      ecs: ECSManager,
      tagSets: Klass<any>[][]) {
    const singletonQuery = {
      gl: GLContextComponent,
      shader: MsdfGlyphShaderSingleton,
      sceneGraph: SceneGraphComponent,
      hud: HudViewportSingleton,
    };

    ecs.withSingletons(singletonQuery, (s) => {
      const renderables = s.sceneGraph.SceneGraph
        .with(Renderable2SceneGraphModule)
        .queryRenderables(MsdfStringRenderable2, tagSets);

      if (renderables.length === 0) {
        return;
      }

      s.shader.MsdfGlyphShader.activate(s.gl.gl);
      for (let i = 0; i < renderables.length; i++) {
        const renderable = renderables[i];
        const objData = renderable.renderable.perObjectData;
        s.shader.MsdfGlyphShader.render(s.gl.gl, {
          AlphaThreshold: objData.AlphaThreshold,
          Geo: objData.Geo.geo,
          GlyphColor: objData.GlyphColor.Value,
          GlyphTexture: objData.Font.texture,
          scale: objData.Scale.Value,
          topLeftOffset: objData.TopLeftOffset.Value,
          viewportSize: s.hud.ViewportDimensionsVec,
          z: objData.Z,
        });
      }
    });
  }
}
