import { ECSSystem } from '@libecs/ecssystem';
import { ECSManager } from '@libecs/ecsmanager';
import { LightcycleComponent2 } from '@libgamemodel/lightcycle/lightcycle.component';
import { Entity } from '@libecs/entity';
import { LightcycleRenderComponent } from '@libgamerender/components/lightcycle.rendercomponent';
import { SceneNodeFactory } from '@libutil/scene/scenenodefactory';
import { Z_UNIT_DIR } from '@libutil/helpfulconstants';
import { glMatrix, vec3, mat4 } from 'gl-matrix';
import { SceneNodeFactoryComponent, OwnedMathAllocatorsComponent } from '@libgamemodel/components/commoncomponents';
import { MainRenderPassComponent, FloorReflectionRenderPassComponent } from '@libgamerender/components/mainrenderpass.component';
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
    const floorReflectionPass = ecs.getSingletonComponentOrThrow(FloorReflectionRenderPassComponent);
    const {
      Vec3: vec3Allocator,
      Mat4: mat4Allocator,
    } = ecs.getSingletonComponentOrThrow(OwnedMathAllocatorsComponent);
    const lambertResources = ecs.getSingletonComponentOrThrow(
      LightcycleLambertRenderResourcesComponent);

    ecs.iterateComponents([LightcycleComponent2], (entity, lightcycleComponent) => {
      const lightcycleRenderComponent = this.getRenderComponent(
        sceneNodeFactory, entity, lightcycleComponent);

      const bodyMatWorld = mat4Allocator.get();
      lightcycleRenderComponent.BodySceneNode.getMatWorld(bodyMatWorld.Value);
      const bodyCall = {
        DiffuseTexture: lambertResources.BodyTexture,
        Geo: lambertResources.Body,
        MatWorld: bodyMatWorld,
      };
      mainRenderPass.LambertCalls.push(bodyCall);
      floorReflectionPass.LambertCalls.push(bodyCall);

      const frontWheelMatWorld = mat4Allocator.get();
      lightcycleRenderComponent.FrontWheelSceneNode.getMatWorld(frontWheelMatWorld.Value);
      const frontWheelCall = {
        DiffuseTexture: lambertResources.WheelTexture,
        Geo: lambertResources.Wheel,
        MatWorld: frontWheelMatWorld,
      };
      mainRenderPass.LambertCalls.push(frontWheelCall);
      floorReflectionPass.LambertCalls.push(frontWheelCall);

      const backWheelMatWorld = mat4Allocator.get();
      lightcycleRenderComponent.BackWheelSceneNode.getMatWorld(backWheelMatWorld.Value);
      const backWheelCall = {
        DiffuseTexture: lambertResources.WheelTexture,
        Geo: lambertResources.Wheel,
        MatWorld: backWheelMatWorld,
      };
      mainRenderPass.LambertCalls.push(backWheelCall);
      floorReflectionPass.LambertCalls.push(backWheelCall);

      const spawnStickMatWorld = mat4Allocator.get();
      lightcycleRenderComponent.SpawnStickSceneNode.getMatWorld(spawnStickMatWorld.Value);
      mainRenderPass.LambertCalls.push({
        DiffuseTexture: lambertResources.StickTexture,
        Geo: lambertResources.Stick,
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
