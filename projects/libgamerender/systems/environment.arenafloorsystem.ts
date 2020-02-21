import { ECSSystem } from '@libecs/ecssystem';
import { ECSManager } from '@libecs/ecsmanager';
import { Entity } from '@libecs/entity';
import { FloorComponent } from '@libgamemodel/components/floor.component';
import { ArenaFloorShaderComponent } from '@libgamerender/renderresourcesingletons/shadercomponents';
import { ArenaFloorReflectionTextureComponent, GLContextComponent } from '@libgamerender/components/renderresourcecomponents';
import { ArenaFloorRawVertexData, ArenaFloorGeo } from '@librender/geo/arenafloorgeo';
import { mat4, vec3, vec4 } from 'gl-matrix';
import { ArenaFloorRenderableComponent } from '@libgamerender/components/arenafloorrenderable.component';

// TODO (sessamekesh): Migrate this over!
// - After that, go ahead and add the render systems to the wall editor app as well!

export class EnvironmentArenaFloorSystem extends ECSSystem {
  start() { return true; }
  update(ecs: ECSManager) {
    const { gl } = ecs.getSingletonComponentOrThrow(GLContextComponent);
    ecs.iterateComponents([FloorComponent], (entity, floorComponent) => {
      this.getFloorRenderComponent(ecs, entity, gl, floorComponent);
    });
  }

  private getFloorRenderComponent(
      ecs: ECSManager,
      entity: Entity,
      gl: WebGL2RenderingContext,
      floorComponent: FloorComponent): ArenaFloorRenderableComponent {
    let component = entity.getComponent(ArenaFloorRenderableComponent);
    const { ArenaFloorShader } = ecs.getSingletonComponentOrThrow(ArenaFloorShaderComponent);
    const {
      Texture: floorTexture,
      BumpmapTexture: floorBumpmap,
    } = ecs.getSingletonComponentOrThrow(ArenaFloorReflectionTextureComponent);
    if (!component) {
      const lattribs = ArenaFloorShader.getAttribLocations();
      const w = floorComponent.Width / 2;
      const h = floorComponent.Height / 2;
      const vertexData: ArenaFloorRawVertexData = {
        PosAttribLocation: lattribs.Pos,
        UVAttribLocation: lattribs.UV,
        NormalAttribLocation: lattribs.Normal,
        TangentAttribLocation: lattribs.Tangent,
        BitangentAttribLocation: lattribs.Bitangent,

        PositionData: new Float32Array([-w, 0, -h, w, 0, -h, -w, 0, h, w, 0, h]),
        UVData: new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]),
        NormalData: new Float32Array([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0]),
        TangentData: new Float32Array([1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0]),
        BitangentData: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]),
      };
      const matWorld = mat4.create();
      mat4.identity(matWorld);
      mat4.translate(matWorld, matWorld, vec3.fromValues(0, -0.5, 0));
      const geo = ArenaFloorGeo.create(
        gl, vertexData, {BitWidth: 8, Data: new Uint8Array([0, 1, 2, 2, 1, 3])});
      component = entity.addComponent(
        ArenaFloorRenderableComponent, floorTexture, floorBumpmap, geo, matWorld,
        vec4.fromValues(0.3, 0.3, 1.0, 1.0));
    }

    return component;
  }
}
