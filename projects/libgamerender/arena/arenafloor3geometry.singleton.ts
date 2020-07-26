import { GeoBase, AttribBuffersType } from '@librender/geo/geobase';
import { ECSManager } from '@libecs/ecsmanager';
import { GLContextComponent } from '@libgamerender/components/renderresourcecomponents';
import { ArenaFloor3ShaderSingleton } from '@libgamerender/renderresourcesingletons/shadercomponents';
import { ArenaFloorShader3AttribType } from '@librender/shader/arenafloorshader3';

export class ArenaFloor3GeometrySingleton {
  constructor(public Geo: GeoBase<ArenaFloorShader3AttribType>) {}

  static generate(ecs: ECSManager) {
    const singletonQuery = {GLContextComponent, ArenaFloor3ShaderSingleton};
    const missing = ecs.withSingletons(singletonQuery, (singletons) => {
      const gl = singletons.GLContextComponent.gl;
      const shader = singletons.ArenaFloor3ShaderSingleton.ArenaFloor3Shader;

      const attribs = shader.getAttribLocations();
      const buffers: AttribBuffersType<typeof attribs> = {
        pos: {
          data: new Float32Array([-0.508, 0, -0.508,  0.508, 0, -0.508,  -0.508, 0, 0.508,  0.508, 0, 0.508]),
          dataType: 'float',
          sizePerElement: 3,
        },
      };
      const geo = GeoBase.create(
        gl, attribs, buffers, {BitWidth: 8, Data: new Uint8Array([0, 1, 2, 2, 1, 3])});
      if (!geo) {
        // TODO (sessamekesh): Better error handling
        throw new Error('Failed to generate arena floor geo singleton: gl error');
      }
      const e = ecs.createEntity();
      e.addComponent(ArenaFloor3GeometrySingleton, geo);
    });

    if (missing.length > 0) {
      // TODO (sessamekesh): Handle error around missing singletons
      throw new Error('Failed to generate arena floor geo singleton: missing singletons ('
          + missing.join(',') + ')');
    }
  }
}
