import { ECSSystem } from '@libecs/ecssystem';
import { LambertShader } from '@librender/shader/lambertshader';
import { LambertGeo, LambertGeoRawVertexData } from '@librender/geo/lambertgeo';
import { ECSManager } from '@libecs/ecsmanager';
import { FrameSettings } from '@libgamerender/framesettings';
import { Entity } from '@libecs/entity';
import { WallComponent } from '@libgamemodel/wall/wallcomponent';
import { WallRenderComponent } from '@libgamerender/components/wall.rendercomponent';
import { SceneNodeFactory } from '@libutil/scene/scenenodefactory';
import { TempGroupAllocator } from '@libutil/allocator';
import { vec3, mat4 } from 'gl-matrix';
import { Y_UNIT_DIR } from '@libutil/helpfulconstants';
import { Texture } from '@librender/texture/texture';
import { IBData } from '@librender/geo/ibdesc';

export class WallRenderSystem extends ECSSystem {
  constructor(
      private lambertShader: LambertShader,
      private wallGeo: LambertGeo,
      private sceneNodeFactory: SceneNodeFactory,
      private vec3Allocator: TempGroupAllocator<vec3>,
      private mat4Allocator: TempGroupAllocator<mat4>,
      private wallTexture: Texture) {
    super();
  }

  start(ecs: ECSManager) { return true; }
  update(ecs: ECSManager, msDt: number) {}

  render(gl: WebGL2RenderingContext, ecs: ECSManager, frameSettings: FrameSettings) {
    // Draw Lambert objects...
    this.lambertShader.activate(gl);
    this.mat4Allocator.get(1, (matWorld) => {
      ecs.iterateComponents([WallComponent], (entity, wallComponent) => {
        const renderComponent = this.getRenderComponent(entity, wallComponent);
        renderComponent.SceneNode.getMatWorld(matWorld);
        this.lambertShader.render(gl, {
          AmbientCoefficient: 0.9,
          DiffuseTexture: renderComponent.Texture,
          Geo: this.wallGeo,
          LightColor: frameSettings.LightColor,
          LightDirection: frameSettings.LightDirection,
          MatProj: frameSettings.MatProj,
          MatView: frameSettings.MatView,
          MatWorld: matWorld,
        });
      });
    });
  }

  private getRenderComponent(entity: Entity, wallComponent: WallComponent): WallRenderComponent {
    let component = entity.getComponent(WallRenderComponent);
    if (!component) {
      const sceneNode = this.sceneNodeFactory.createSceneNode();
      this.vec3Allocator.get(3, (midpoint, start, end) => {
        vec3.set(start, wallComponent.Corner1[0], 0, wallComponent.Corner1[1]);
        vec3.set(end, wallComponent.Corner2[0], 0, wallComponent.Corner2[1]);
        vec3.lerp(midpoint, start, end, 0.5);

        const angle = Math.atan2(
          -wallComponent.Corner2[1] + wallComponent.Corner1[1],
          wallComponent.Corner2[0] - wallComponent.Corner1[0]);
        sceneNode.update({
          pos: midpoint,
          rot: {
            axis: Y_UNIT_DIR,
            angle,
          },
        });
      });
      component = entity.addComponent(WallRenderComponent, sceneNode, this.wallTexture);
    }
    return component;
  }

  static generateWallGeo(
      gl: WebGL2RenderingContext, lambertShader: LambertShader, length: number, height: number) {
    const attribs = lambertShader.getAttribLocations();
    const lambertRawData: LambertGeoRawVertexData = {
      PosAttribLocation: attribs.Pos,
      NormalAttribLocation: attribs.Normal,
      UVAttribLocation: attribs.UV,

      PositionData: new Float32Array([
        -length, -0.5, 0.035, length, -0.5, 0.035, -length, height-0.5, 0.035, length, height-0.5, 0.035,
        -length, -0.5, -0.035, length, -0.5, -0.035, -length, height-0.5, -0.035, length, height-0.5, -0.035,
        -length, height-0.5, 0.035, length, height-0.5, 0.035, -length, height-0.5, -0.035, length, height-0.5, -0.035,
      ]),
      NormalData: new Float32Array([
        0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
        0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
        0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
      ]),
      UVData: new Float32Array([
        0, 0, 1, 0, 0, 1, 1, 1,
        0, 0, 1, 0, 0, 1, 1, 1,
        0, 0, 1, 0, 0, 1, 1, 1,
      ]),
    };
    const indexData: IBData = {
      BitWidth: 8,
      Data: new Uint8Array([
        0, 1, 2, 2, 1, 3,
        4, 6, 5, 6, 5, 7,
        8, 9, 10, 9, 10, 11
      ]),
    };
    const geo = LambertGeo.create(gl, lambertRawData, indexData);
    if (!geo) {
      throw new Error('Failed to generate geometry');
    }
    return geo;
  }
}
