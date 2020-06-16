import { ECSSystem } from '@libecs/ecssystem';
import { ECSManager } from '@libecs/ecsmanager';
import { LightcycleComponent2 } from '@libgamemodel/lightcycle/lightcycle.component';
import { SceneNodeFactoryComponent } from '@libgamemodel/components/commoncomponents';
import { LightcycleLambertRenderResourcesComponent } from '@libgamerender/components/renderresourcecomponents';
import { LambertRenderGroupSingleton } from '@libgamerender/components/lambertrendergroup.singleton';
import { LightcycleRenderComponent2 } from '@libgamerender/components/lightcycle2.rendercomponent';
import { Entity } from '@libecs/entity';
import { LambertRenderableGroup } from '@librender/renderable/lambertrenderableutil';
import { SceneNodeFactory } from '@libutil/scene/scenenodefactory';
import { Z_UNIT_DIR } from '@libutil/helpfulconstants';
import { glMatrix } from 'gl-matrix';
import { LightcycleRenderableTag } from './lightcycle.lambertsystem';

export class LightcycleLambertSystem2 extends ECSSystem {
  start() { return true; }

  update(ecs: ECSManager) {
    const singletonQuery = {
      sceneNodeFactory: SceneNodeFactoryComponent,
      lightcycleRenderResources: LightcycleLambertRenderResourcesComponent,
      renderGroup: LambertRenderGroupSingleton,
    };
    const componentQuery = {
      lightcycle: LightcycleComponent2,
    };

    ecs.iterateComponents2(singletonQuery, componentQuery, (entity, singletons, components) => {
      const renderableComponent = this.getRenderableComponent(
        entity,
        components.lightcycle,
        singletons.renderGroup.LambertRenderGroup,
        singletons.sceneNodeFactory.SceneNodeFactory,
        singletons.lightcycleRenderResources);
      renderableComponent.BodySceneNode.getMatWorld(
        renderableComponent.Body.perObjectData.matWorld.Value);
      renderableComponent.FrontWheelSceneNode.getMatWorld(
        renderableComponent.FrontWheel.perObjectData.matWorld.Value);
      renderableComponent.RearWheelSceneNode.getMatWorld(
        renderableComponent.RearWheel.perObjectData.matWorld.Value);
    });
  }

  private getRenderableComponent(
      e: Entity,
      lightcycleComponent: LightcycleComponent2,
      renderGroup: LambertRenderableGroup,
      sceneNodeFactory: SceneNodeFactory,
      renderResources: LightcycleLambertRenderResourcesComponent): LightcycleRenderComponent2 {
    let component = e.getComponent(LightcycleRenderComponent2);
    if (!component) {
      // Renderables:
      const bodyRenderable = renderGroup.createRenderable({
        geo: renderResources.Body,
        diffuseTexture: renderResources.BodyTexture,
      });
      bodyRenderable.addTag(LightcycleRenderableTag);
      const frontWheelRenderable = renderGroup.createRenderable({
        geo: renderResources.Wheel,
        diffuseTexture: renderResources.WheelTexture,
      });
      frontWheelRenderable.addTag(LightcycleRenderableTag);
      const rearWheelRenderable = renderGroup.createRenderable({
        geo: renderResources.Wheel,
        diffuseTexture: renderResources.WheelTexture,
      });
      rearWheelRenderable.addTag(LightcycleRenderableTag);

      // Scene nodes:
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

      bodyRenderSceneNode.attachToParent(lightcycleComponent.BodySceneNode);
      frontWheelRenderSceneNode.attachToParent(frontWheelZRot);
      rearWheelRenderSceneNode.attachToParent(backWheelZRot);

      // Assemble component
      component = e.addComponent(
        LightcycleRenderComponent2,
        frontWheelRenderable, frontWheelRenderSceneNode,
        rearWheelRenderable, rearWheelRenderSceneNode,
        bodyRenderable, bodyRenderSceneNode);

      e.addListener('destroy', () => {
        bodyRenderSceneNode.detach();
        frontWheelRenderSceneNode.detach();
        rearWheelRenderSceneNode.detach();
        frontWheelZRot.detach();
        backWheelZRot.detach();

        renderGroup.destroy(bodyRenderable);
        renderGroup.destroy(frontWheelRenderable);
        renderGroup.destroy(rearWheelRenderable);
      });
    }

    return component;
  }
}
