import { ECSSystem } from '@libecs/ecssystem';
import { LambertShader } from '@librender/shader/lambertshader';
import { LambertGeo } from '@librender/geo/lambertgeo';
import { ECSManager } from '@libecs/ecsmanager';
import { Entity } from '@libecs/entity';
import { LightcycleRenderComponent } from '@libgamerender/components/lightcycle.rendercomponent';
import { mat4, glMatrix } from 'gl-matrix';
import { LightcycleComponent2 } from '@libgamemodel/components/lightcycle.component';
import { Texture } from '@librender/texture/texture';
import { FrameSettings } from '@libgamerender/framesettings';
import { SceneNodeFactory } from '@libutil/scene/scenenodefactory';
import { TempGroupAllocator } from '@libutil/allocator';
import { Z_UNIT_DIR } from '@libutil/helpfulconstants';

export class LightcycleRenderSystem extends ECSSystem {
  constructor(
      private lambertShader: LambertShader,
      private bikeGeo: LambertGeo,
      private wheelGeo: LambertGeo,
      private stickGeo: LambertGeo,
      private bikeTexture: Texture,
      private wheelTexture: Texture,
      private stickTexture: Texture,
      private sceneNodeFactory: SceneNodeFactory,
      private mat4Allocator: TempGroupAllocator<mat4>) {
    super();
  }

  start(ecs: ECSManager) { return true; }

  update(ecs: ECSManager, msDt: number) {}

  render(gl: WebGL2RenderingContext, ecs: ECSManager, frameSettings: FrameSettings) {
    // Draw Lambert objects...
    this.lambertShader.activate(gl);
    ecs.iterateComponents([LightcycleComponent2], (entity, lightcycleComponent) => {
      this.mat4Allocator.get(1, (matWorld) => {
        const lightcycleRenderComponent = this.getRenderComponent(entity, lightcycleComponent);
        lightcycleRenderComponent.BodySceneNode.getMatWorld(matWorld);
        this.lambertShader.render(gl, {
          AmbientCoefficient: frameSettings.AmbientCoefficient,
          DiffuseTexture: this.bikeTexture,
          Geo: this.bikeGeo,
          LightColor: frameSettings.LightColor,
          LightDirection: frameSettings.LightDirection,
          MatProj: frameSettings.MatProj,
          MatView: frameSettings.MatView,
          MatWorld: matWorld,
        });

        lightcycleRenderComponent.FrontWheelSceneNode.getMatWorld(matWorld);
        this.lambertShader.render(gl, {
          AmbientCoefficient: frameSettings.AmbientCoefficient,
          DiffuseTexture: this.wheelTexture,
          Geo: this.wheelGeo,
          LightColor: frameSettings.LightColor,
          LightDirection: frameSettings.LightDirection,
          MatProj: frameSettings.MatProj,
          MatView: frameSettings.MatView,
          MatWorld: matWorld,
        });

        lightcycleRenderComponent.BackWheelSceneNode.getMatWorld(matWorld);
        this.lambertShader.render(gl, {
          AmbientCoefficient: frameSettings.AmbientCoefficient,
          DiffuseTexture: this.wheelTexture,
          Geo: this.wheelGeo,
          LightColor: frameSettings.LightColor,
          LightDirection: frameSettings.LightDirection,
          MatProj: frameSettings.MatProj,
          MatView: frameSettings.MatView,
          MatWorld: matWorld,
        });

        lightcycleRenderComponent.SpawnStickSceneNode.getMatWorld(matWorld);
        this.lambertShader.render(gl, {
          AmbientCoefficient: frameSettings.AmbientCoefficient,
          DiffuseTexture: this.stickTexture,
          Geo: this.stickGeo,
          LightColor: frameSettings.LightColor,
          LightDirection: frameSettings.LightDirection,
          MatProj: frameSettings.MatProj,
          MatView: frameSettings.MatView,
          MatWorld: matWorld,
        });
      });
    });
  }

  private getRenderComponent(entity: Entity, lightcycleComponent: LightcycleComponent2): LightcycleRenderComponent {
    let component = entity.getComponent(LightcycleRenderComponent);
    if (!component) {
      const frontWheelZRot = this.sceneNodeFactory.createSceneNode({
        rot: {
          axis: Z_UNIT_DIR,
          angle: glMatrix.toRadian(90),
        },
      });
      const backWheelZRot = this.sceneNodeFactory.createSceneNode({
        rot: {
          axis: Z_UNIT_DIR,
          angle: glMatrix.toRadian(90),
        },
      });
      frontWheelZRot.attachToParent(lightcycleComponent.FrontWheelSceneNode);
      backWheelZRot.attachToParent(lightcycleComponent.RearWheelSceneNode);

      const bodyRenderSceneNode = this.sceneNodeFactory.createLoadedModelRotationSceneNode();
      const frontWheelRenderSceneNode = this.sceneNodeFactory.createLoadedModelRotationSceneNode();
      const rearWheelRenderSceneNode = this.sceneNodeFactory.createLoadedModelRotationSceneNode();
      const spawnStickRenderSceneNode = this.sceneNodeFactory.createLoadedModelRotationSceneNode();
      bodyRenderSceneNode.attachToParent(lightcycleComponent.BodySceneNode);
      frontWheelRenderSceneNode.attachToParent(frontWheelZRot);
      rearWheelRenderSceneNode.attachToParent(backWheelZRot);
      spawnStickRenderSceneNode.attachToParent(lightcycleComponent.BodySceneNode);

      component = entity.addComponent(
        LightcycleRenderComponent,
        bodyRenderSceneNode,
        frontWheelRenderSceneNode,
        rearWheelRenderSceneNode,
        spawnStickRenderSceneNode);
    }

    return component;
  }
}
