import { ECSSystem } from '@libecs/ecssystem';
import { LambertShader } from '@librender/shader/lambertshader';
import { LambertGeo } from '@librender/geo/lambertgeo';
import { ECSManager } from '@libecs/ecsmanager';
import { Entity } from '@libecs/entity';
import { LightcycleRenderComponent } from '@libgamerender/components/lightcycle.rendercomponent';
import { mat4, glMatrix, vec3 } from 'gl-matrix';
import { LightcycleComponent } from '@libgamemodel/components/lightcycle.component';
import { PositionComponent } from '@libgamemodel/components/position.component';
import { Texture } from '@librender/geo/texture';
import { FrameSettings } from '@libgamerender/framesettings';
import { SceneNodeFactory } from '@libutil/scene/scenenodefactory';
import { TempGroupAllocator } from '@libutil/allocator';
import { Y_UNIT_DIR, Z_UNIT_DIR } from '@libutil/helpfulconstants';

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

  update(ecs: ECSManager, msDt: number) {
    // Refresh all render components to match
    ecs.iterateComponents(
        [LightcycleComponent, PositionComponent],
        (entity, lightcycleComponent, positionComponent) => {
          lightcycleComponent.SceneNode.update({
            rot: {
              angle: glMatrix.toRadian(lightcycleComponent.Orientation),
              axis: Y_UNIT_DIR,
            },
            pos: positionComponent.Position,
          });
          const renderNode = this.getRenderComponent(entity, lightcycleComponent);
          // TODO (sessamekesh): Update the wheels turning!
        });
  }

  render(gl: WebGL2RenderingContext, ecs: ECSManager, frameSettings: FrameSettings) {
    // Draw Lambert objects...
    this.lambertShader.activate(gl);
    ecs.iterateComponents([LightcycleComponent], (entity, lightcycleComponent) => {
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

  private getRenderComponent(entity: Entity, lightcycleComponent: LightcycleComponent): LightcycleRenderComponent {
    let component = entity.getComponent(LightcycleRenderComponent);
    if (!component) {
      const bodySceneNode = this.sceneNodeFactory.createSceneNode();
      const frontWheelSceneNode = this.sceneNodeFactory.createSceneNode({
        rot: {
          axis: Z_UNIT_DIR,
          angle: glMatrix.toRadian(90),
        },
      });
      const backWheelSceneNode = this.sceneNodeFactory.createSceneNode({
        rot: {
          axis: Z_UNIT_DIR,
          angle: glMatrix.toRadian(90),
        },
      });
      const spawnStickSceneNode = this.sceneNodeFactory.createSceneNode();
      bodySceneNode.attachToParent(lightcycleComponent.SceneNode);
      frontWheelSceneNode.attachToParent(lightcycleComponent.SceneNode);
      backWheelSceneNode.attachToParent(lightcycleComponent.SceneNode);
      spawnStickSceneNode.attachToParent(lightcycleComponent.SceneNode);

      const backWheelOffsetSceneNode = this.sceneNodeFactory.createSceneNode({
        pos: vec3.fromValues(0, 0, -3.385),
      });
      backWheelOffsetSceneNode.attachToParent(backWheelSceneNode);

      const bodyRenderSceneNode = this.sceneNodeFactory.createLoadedModelRotationSceneNode();
      const frontWheelRenderSceneNode = this.sceneNodeFactory.createLoadedModelRotationSceneNode();
      const backWheelRenderSceneNode = this.sceneNodeFactory.createLoadedModelRotationSceneNode();
      const spawnStickRenderSceneNode = this.sceneNodeFactory.createLoadedModelRotationSceneNode();
      bodyRenderSceneNode.attachToParent(bodySceneNode);
      frontWheelRenderSceneNode.attachToParent(frontWheelSceneNode);
      backWheelRenderSceneNode.attachToParent(backWheelOffsetSceneNode);
      spawnStickRenderSceneNode.attachToParent(spawnStickSceneNode);

      component = entity.addComponent(
        LightcycleRenderComponent,
        bodyRenderSceneNode,
        frontWheelRenderSceneNode,
        backWheelRenderSceneNode,
        spawnStickRenderSceneNode);
    }

    return component;
  }
}
