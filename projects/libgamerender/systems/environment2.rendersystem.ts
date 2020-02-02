import { ECSSystem } from '@libecs/ecssystem';
import { ECSManager } from '@libecs/ecsmanager';
import { Entity } from '@libecs/entity';
import { FloorComponent } from '@libgamemodel/components/floor.component';
import { FloorRenderComponent } from '@libgamerender/components/floor.rendercomponent';
import { ArenaFloorShaderComponent } from '@libgamerender/renderresourcesingletons/shadercomponents';
import { mat4, vec3, vec2 } from 'gl-matrix';
import { ArenaFloorGeo, ArenaFloorRawVertexData } from '@librender/geo/arenafloorgeo';
import { ArenaFloorReflectionTextureComponent, GLContextComponent } from '@libgamerender/components/renderresourcecomponents';
import { MainRenderPassComponent } from '@libgamerender/components/mainrenderpass.component';
import { OwnedMathAllocatorsComponent } from '@libgamemodel/components/commoncomponents';

export class EnvironmentRenderSystem2 extends ECSSystem {
  start(ecs: ECSManager) {
    return true;
  }

  update(ecs: ECSManager, msDt: number) {
    const mainRenderPass = ecs.getSingletonComponentOrThrow(MainRenderPassComponent);
    const { gl } = ecs.getSingletonComponentOrThrow(GLContextComponent);
    const {
      Vec2: vec2Allocator,
      Mat4: mat4Allocator,
    } = ecs.getSingletonComponentOrThrow(OwnedMathAllocatorsComponent);
    const {
      Texture: floorTexture,
      BumpmapTexture: bumpMapTexture,
    } = ecs.getSingletonComponentOrThrow(ArenaFloorReflectionTextureComponent);
    ecs.iterateComponents([FloorComponent], (entity, floorComponent) => {
      const floorRenderComponent = this.getFloorRenderComponent(ecs, entity, gl, floorComponent);
      const viewportSize = vec2Allocator.get();
      vec2.set(viewportSize.Value, gl.canvas.width, gl.canvas.height);
      const matWorld = mat4Allocator.get();
      mat4.copy(matWorld.Value, floorRenderComponent.MatWorld);
      mainRenderPass.FloorReflectionCalls.push({
        Geo: floorRenderComponent.Geo,
        MatWorld: matWorld,
        ReflectionTexture: floorTexture,
        ViewportSize: viewportSize,
        BumpMapTexture: bumpMapTexture,
      });
    });
  }

  private getFloorRenderComponent(
      ecs: ECSManager,
      entity: Entity,
      gl: WebGL2RenderingContext,
      floorComponent: FloorComponent): FloorRenderComponent {
    let component = entity.getComponent(FloorRenderComponent);
    const { ArenaFloorShader } = ecs.getSingletonComponentOrThrow(ArenaFloorShaderComponent);
    const {
      Texture: floorTexture,
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
      component = entity.addComponent(FloorRenderComponent, matWorld, geo, floorTexture);
    }

    return component;
  }
}
