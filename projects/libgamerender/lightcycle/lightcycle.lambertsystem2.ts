import { ECSSystem } from '@libecs/ecssystem';
import { ECSManager } from '@libecs/ecsmanager';
import { LightcycleComponent2 } from '@libgamemodel/lightcycle/lightcycle.component';
import { SceneGraphComponent } from '@libgamemodel/components/commoncomponents';
import { LightcycleLambertRenderResourcesComponent } from '@libgamerender/components/renderresourcecomponents';
import { LambertRenderGroupSingleton } from '@libgamerender/components/lambertrendergroup.singleton';
import { LightcycleRenderComponent2, LightcycleRenderableTag } from '@libgamerender/lightcycle/lightcycle2.rendercomponent';
import { Entity } from '@libecs/entity';
import { LambertRenderableGroup } from '@librender/renderable/lambertrenderableutil';
import { Z_UNIT_DIR, BlendSpaceModelRotation } from '@libutil/helpfulconstants';
import { glMatrix } from 'gl-matrix';
import { SceneGraph2 } from '@libscenegraph/scenegraph2';
import { Mat4TransformAddon } from '@libscenegraph/scenenodeaddons/mat4transformaddon';

export class LightcycleLambertSystem2 extends ECSSystem {
  start() { return true; }

  update(ecs: ECSManager) {
    const singletonQuery = {
      sceneGraph: SceneGraphComponent,
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
        singletons.sceneGraph.SceneGraph,
        singletons.lightcycleRenderResources);
      renderableComponent.BodySceneNode.getAddon(Mat4TransformAddon).getMatWorld(
        renderableComponent.Body.perObjectData.matWorld.Value);
      renderableComponent.FrontWheelSceneNode.getAddon(Mat4TransformAddon).getMatWorld(
        renderableComponent.FrontWheel.perObjectData.matWorld.Value);
      renderableComponent.RearWheelSceneNode.getAddon(Mat4TransformAddon).getMatWorld(
        renderableComponent.RearWheel.perObjectData.matWorld.Value);
    });
  }

  private getRenderableComponent(
      e: Entity,
      lightcycleComponent: LightcycleComponent2,
      renderGroup: LambertRenderableGroup,
      sceneGraph: SceneGraph2,
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
      const frontWheelZRot = sceneGraph.createSceneNode();
      frontWheelZRot.getAddon(Mat4TransformAddon).update({
        rot: {
          axis: Z_UNIT_DIR,
          angle: glMatrix.toRadian(90),
        },
      });
      const backWheelZRot = sceneGraph.createSceneNode();
      backWheelZRot.getAddon(Mat4TransformAddon).update({
        rot: {
          axis: Z_UNIT_DIR,
          angle: glMatrix.toRadian(90),
        },
      });
      frontWheelZRot.setParent(lightcycleComponent.FrontWheelSceneNode);
      backWheelZRot.setParent(lightcycleComponent.RearWheelSceneNode);

      const bodyRenderSceneNode = sceneGraph.createSceneNode();
      bodyRenderSceneNode.getAddon(Mat4TransformAddon).update(BlendSpaceModelRotation);
      const frontWheelRenderSceneNode = sceneGraph.createSceneNode();
      frontWheelRenderSceneNode.getAddon(Mat4TransformAddon).update(BlendSpaceModelRotation);
      const rearWheelRenderSceneNode = sceneGraph.createSceneNode();
      rearWheelRenderSceneNode.getAddon(Mat4TransformAddon).update(BlendSpaceModelRotation);

      bodyRenderSceneNode.setParent(lightcycleComponent.BodySceneNode);
      frontWheelRenderSceneNode.setParent(frontWheelZRot);
      rearWheelRenderSceneNode.setParent(backWheelZRot);

      // Assemble component
      component = e.addComponent(
        LightcycleRenderComponent2,
        frontWheelRenderable, frontWheelRenderSceneNode,
        rearWheelRenderable, rearWheelRenderSceneNode,
        bodyRenderable, bodyRenderSceneNode);

      e.addListener('destroy', () => {
        bodyRenderSceneNode.destroy();
        frontWheelRenderSceneNode.destroy();
        rearWheelRenderSceneNode.destroy();
        frontWheelZRot.destroy();
        backWheelZRot.destroy();

        renderGroup.destroy(bodyRenderable);
        renderGroup.destroy(frontWheelRenderable);
        renderGroup.destroy(rearWheelRenderable);
      });
    }

    return component;
  }
}
