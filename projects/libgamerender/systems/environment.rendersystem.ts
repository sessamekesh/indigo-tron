import { ECSSystem } from '@libecs/ecssystem';
import { LambertShader } from '@librender/shader/lambertshader';
import { ECSManager } from '@libecs/ecsmanager';
import { FrameSettings } from '@libgamerender/framesettings';
import { Entity } from '@libecs/entity';
import { FloorComponent } from '@libgamemodel/components/floor.component';
import { FloorRenderComponent } from '@libgamerender/components/floor.rendercomponent';
import { LambertGeoRawVertexData, LambertGeo } from '@librender/geo/lambertgeo';
import { Texture } from '@librender/texture/texture';
import { mat4, vec3 } from 'gl-matrix';

export class EnvironmentRenderSystem extends ECSSystem {
  constructor(
      private lambertShader: LambertShader,
      private tilingFactor: number,
      private floorTexture: Texture) {
    super();
  }

  start(ecs: ECSManager) { return true; }

  update(ecs: ECSManager, msDt: number) {}

  render(gl: WebGL2RenderingContext, ecs: ECSManager, frameSettings: FrameSettings) {
    this.lambertShader.activate(gl);
    ecs.iterateComponents([FloorComponent], (entity, floorComponent) => {
      const floorRenderComponent = this.getFloorRenderComponent(entity, gl, floorComponent);
      this.lambertShader.render(gl, {
        AmbientCoefficient: frameSettings.AmbientCoefficient,
        DiffuseTexture: floorRenderComponent.Texture,
        Geo: floorRenderComponent.Geo,
        LightColor: frameSettings.LightColor,
        LightDirection: frameSettings.LightDirection,
        MatProj: frameSettings.MatProj,
        MatView: frameSettings.MatView,
        MatWorld: floorRenderComponent.MatWorld,
      });
    });
  }

  private getFloorRenderComponent(
      entity: Entity,
      gl: WebGL2RenderingContext,
      floorComponent: FloorComponent): FloorRenderComponent {
    let component = entity.getComponent(FloorRenderComponent);

    if (!component) {
      const lattribs = this.lambertShader.getAttribLocations();
      const w = floorComponent.Width / 2;
      const h = floorComponent.Height / 2;
      const uw = w * this.tilingFactor;
      const uh = h * this.tilingFactor;
      const vertexData: LambertGeoRawVertexData = {
        PosAttribLocation: lattribs.Pos,
        NormalAttribLocation: lattribs.Normal,
        UVAttribLocation: lattribs.UV,

        PositionData: new Float32Array([-w, 0, -h, w, 0, -h, -w, 0, h, w, 0, h]),
        NormalData: new Float32Array([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0]),
        UVData: new Float32Array([-uw, -uh, uw, -uh, -uw, uh, uw, uh]),
      };
      const matWorld = mat4.create();
      mat4.identity(matWorld);
      mat4.translate(matWorld, matWorld, vec3.fromValues(0, -1, 0));
      const geo = LambertGeo.create(gl, vertexData, {BitWidth: 8, Data: new Uint8Array([0, 1, 2, 2, 1, 3])});
      component = entity.addComponent(FloorRenderComponent, matWorld, geo, this.floorTexture);
    }

    return component;
  }
}
