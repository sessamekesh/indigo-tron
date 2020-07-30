import { OwnedResource } from "@libutil/allocator";
import { vec4, vec2 } from 'gl-matrix';
import { Renderable2 } from '@librender/renderable/renderable2';
import { ECSManager } from '@libecs/ecsmanager';
import { Klass } from '@libecs/klass';
import { GLContextComponent } from '@libgamerender/components/renderresourcecomponents';
import { SolidColorUiShaderSingleton } from '@libgamerender/renderresourcesingletons/shadercomponents';
import { SceneGraphComponent } from '@libgamemodel/components/commoncomponents';
import { HudViewportSingleton } from '@libgamerender/hud/hudviewport.singleton';
import { Renderable2SceneGraphModule } from '@librender/renderable/renderable2.scenegraphmodule';
import { GeoBase } from '@librender/geo/geobase';
import { SolidColorUiShaderAttribType } from './solidcolorui.shader';

type PerObjectData = {
  Geo: GeoBase<SolidColorUiShaderAttribType>,
  Color: OwnedResource<vec4>,
  Z: number,
  Scale: OwnedResource<vec2>,
  TopLeftOffset: OwnedResource<vec2>,
};

export class SolidColorUiRenderable2 extends Renderable2<PerObjectData> {
  static renderMatchingTag(ecs: ECSManager, tagSets: Klass<any>[][]) {
    const singletonQuery = {
      gl: GLContextComponent,
      shader: SolidColorUiShaderSingleton,
      sceneGraph: SceneGraphComponent,
      hud: HudViewportSingleton,
    };

    ecs.withSingletons(singletonQuery, (s) => {
      const renderables = s.sceneGraph.SceneGraph
        .with(Renderable2SceneGraphModule)
        .queryRenderables(SolidColorUiRenderable2, tagSets);
      if (renderables.length === 0) {
        return;
      }

      s.shader.Shader.activate(s.gl.gl);
      for (let i = 0; i < renderables.length; i++) {
        const objData = renderables[i].renderable.perObjectData;
        s.shader.Shader.render(s.gl.gl, {
          Geo: objData.Geo,
          color: objData.Color.Value,
          scale: objData.Scale.Value,
          topLeftOffset: objData.TopLeftOffset.Value,
          viewportSize: s.hud.ViewportDimensionsVec,
          z: objData.Z,
        });
      }
    });
  }
}
