import { ECSSystem } from '@libecs/ecssystem';
import { ECSManager } from '@libecs/ecsmanager';
import { FrameSettings } from '@libgamerender/framesettings';
import { Entity } from '@libecs/entity';
import { FloorComponent } from '@libgamemodel/components/floor.component';
import { FloorRenderComponent } from '@libgamerender/components/floor.rendercomponent';
import { Texture } from '@librender/texture/texture';
import { mat4, vec3, vec2 } from 'gl-matrix';
import { ArenaFloorShader } from '@librender/shader/arenafloorshader';
import { ArenaFloorRawVertexData, ArenaFloorGeo } from '@librender/geo/arenafloorgeo';

export class EnvironmentRenderSystem extends ECSSystem {
  constructor(
      private arenaFloorShader: ArenaFloorShader,
      private tilingFactor: number,
      private floorTexture: Texture) {
    super();
  }

  start(ecs: ECSManager) { return true; }

  update(ecs: ECSManager, msDt: number) {}

  private arenaFloorVec2_ = vec2.create();
  render(gl: WebGL2RenderingContext, ecs: ECSManager, frameSettings: FrameSettings) {
    this.arenaFloorShader.activate(gl);
    ecs.iterateComponents([FloorComponent], (entity, floorComponent) => {
      const floorRenderComponent = this.getFloorRenderComponent(entity, gl, floorComponent);
      this.arenaFloorShader.render(gl, {
        ReflectionTexture: floorRenderComponent.Texture,
        Geo: floorRenderComponent.Geo,
        LightColor: frameSettings.LightColor,
        MatProj: frameSettings.MatProj,
        MatView: frameSettings.MatView,
        MatWorld: floorRenderComponent.MatWorld,
        ViewportSize: vec2.set(this.arenaFloorVec2_, gl.canvas.width, gl.canvas.height),
      });
    });
  }

  private getFloorRenderComponent(
      entity: Entity,
      gl: WebGL2RenderingContext,
      floorComponent: FloorComponent): FloorRenderComponent {
    let component = entity.getComponent(FloorRenderComponent);

    if (!component) {
      const lattribs = this.arenaFloorShader.getAttribLocations();
      const w = floorComponent.Width / 2;
      const h = floorComponent.Height / 2;
      const uw = w * this.tilingFactor;
      const uh = h * this.tilingFactor;
      const vertexData: ArenaFloorRawVertexData = {
        PosAttribLocation: lattribs.Pos,
        NormalAttribLocation: lattribs.Normal,

        PositionData: new Float32Array([-w, 0, -h, w, 0, -h, -w, 0, h, w, 0, h]),
        NormalData: new Float32Array([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0]),
      };
      const matWorld = mat4.create();
      mat4.identity(matWorld);
      mat4.translate(matWorld, matWorld, vec3.fromValues(0, -0.5, 0));
      const geo = ArenaFloorGeo.create(
        gl, vertexData, {BitWidth: 8, Data: new Uint8Array([0, 1, 2, 2, 1, 3])});
      component = entity.addComponent(FloorRenderComponent, matWorld, geo, this.floorTexture);
    }

    return component;
  }
}
