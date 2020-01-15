import { ECSSystem } from '@libecs/ecssystem';
import { ECSManager } from '@libecs/ecsmanager';
import { LightcycleComponent2 } from '@libgamemodel/lightcycle/lightcycle.component';
import { Entity } from '@libecs/entity';
import { LightcycleRenderComponent } from '@libgamerender/components/lightcycle.rendercomponent';
import { SceneNodeFactory } from '@libutil/scene/scenenodefactory';
import { Z_UNIT_DIR } from '@libutil/helpfulconstants';
import { glMatrix, vec3, mat4 } from 'gl-matrix';
import { SceneNodeFactoryComponent, OwnedMathAllocatorsComponent } from '@libgamemodel/components/commoncomponents';
import { MainRenderPassComponent } from '@libgamerender/components/mainrenderpass.component';
import { LightcycleLambertRenderResourcesComponent } from '@libgamerender/components/renderresourcecomponents';

export class LightcycleRenderSystem2 extends ECSSystem {
  start(ecs: ECSManager) {
    return true;
  }

  update(ecs: ECSManager, msDt: number) {
    const {
      SceneNodeFactory: sceneNodeFactory,
    } = ecs.getSingletonComponentOrThrow(SceneNodeFactoryComponent);
    const mainRenderPass = ecs.getSingletonComponentOrThrow(MainRenderPassComponent);
    const {
      Vec3: vec3Allocator,
      Mat4: mat4Allocator,
    } = ecs.getSingletonComponentOrThrow(OwnedMathAllocatorsComponent);
    const lambertResources = ecs.getSingletonComponentOrThrow(
      LightcycleLambertRenderResourcesComponent);

    ecs.iterateComponents([LightcycleComponent2], (entity, lightcycleComponent) => {
      const lightcycleRenderComponent = this.getRenderComponent(
        sceneNodeFactory, entity, lightcycleComponent);

      const lightColor = vec3Allocator.get();
      const lightDirection = vec3Allocator.get();
      const matView = mat4Allocator.get();
      const matProj = mat4Allocator.get();
      vec3.copy(lightColor.Value, mainRenderPass.FrameSettings.LightColor);
      vec3.copy(lightDirection.Value, mainRenderPass.FrameSettings.LightDirection);
      mat4.copy(matView.Value, mainRenderPass.FrameSettings.MatView);
      mat4.copy(matProj.Value, mainRenderPass.FrameSettings.MatProj);

      const bodyMatWorld = mat4Allocator.get();
      lightcycleRenderComponent.BodySceneNode.getMatWorld(bodyMatWorld.Value);
      mainRenderPass.LambertCalls.push({
        AmbientCoefficient: mainRenderPass.FrameSettings.AmbientCoefficient,
        DiffuseTexture: lambertResources.BodyTexture,
        Geo: lambertResources.Body,
        LightColor: lightColor,
        LightDirection: lightDirection,
        MatProj: matProj,
        MatView: matView,
        MatWorld: bodyMatWorld,
      });

      const frontWheelMatWorld = mat4Allocator.get();
      lightcycleRenderComponent.FrontWheelSceneNode.getMatWorld(frontWheelMatWorld.Value);
      mainRenderPass.LambertCalls.push({
        AmbientCoefficient: mainRenderPass.FrameSettings.AmbientCoefficient,
        DiffuseTexture: lambertResources.WheelTexture,
        Geo: lambertResources.Wheel,
        LightColor: lightColor,
        LightDirection: lightDirection,
        MatProj: matProj,
        MatView: matView,
        MatWorld: frontWheelMatWorld,
      });

      const backWheelMatWorld = mat4Allocator.get();
      lightcycleRenderComponent.BackWheelSceneNode.getMatWorld(backWheelMatWorld.Value);
      mainRenderPass.LambertCalls.push({
        AmbientCoefficient: mainRenderPass.FrameSettings.AmbientCoefficient,
        DiffuseTexture: lambertResources.WheelTexture,
        Geo: lambertResources.Wheel,
        LightColor: lightColor,
        LightDirection: lightDirection,
        MatProj: matProj,
        MatView: matView,
        MatWorld: backWheelMatWorld,
      });

      const spawnStickMatWorld = mat4Allocator.get();
      lightcycleRenderComponent.SpawnStickSceneNode.getMatWorld(spawnStickMatWorld.Value);
      mainRenderPass.LambertCalls.push({
        AmbientCoefficient: mainRenderPass.FrameSettings.AmbientCoefficient,
        DiffuseTexture: lambertResources.StickTexture,
        Geo: lambertResources.Stick,
        LightColor: lightColor,
        LightDirection: lightDirection,
        MatProj: matProj,
        MatView: matView,
        MatWorld: spawnStickMatWorld,
      });
    });
  }

  private getRenderComponent(
      sceneNodeFactory: SceneNodeFactory,
      entity: Entity,
      lightcycleComponent: LightcycleComponent2): LightcycleRenderComponent {
    let component = entity.getComponent(LightcycleRenderComponent);
    if (!component) {
      const frontWheelZRot = sceneNodeFactory.createSceneNode({
        rot: {
          axis: Z_UNIT_DIR,
          angle: glMatrix.toRadian(90),
        },
      });
      const backWheelZRot = sceneNodeFactory.createSceneNode({
        rot: {
          axis: Z_UNIT_DIR,
          angle: glMatrix.toRadian(90),
        },
      });
      frontWheelZRot.attachToParent(lightcycleComponent.FrontWheelSceneNode);
      backWheelZRot.attachToParent(lightcycleComponent.RearWheelSceneNode);

      const bodyRenderSceneNode = sceneNodeFactory.createLoadedModelRotationSceneNode();
      const frontWheelRenderSceneNode = sceneNodeFactory.createLoadedModelRotationSceneNode();
      const rearWheelRenderSceneNode = sceneNodeFactory.createLoadedModelRotationSceneNode();
      const spawnStickRenderSceneNode = sceneNodeFactory.createLoadedModelRotationSceneNode();
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
