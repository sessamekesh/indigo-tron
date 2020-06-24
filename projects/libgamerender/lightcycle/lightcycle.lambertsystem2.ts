import { ECSSystem } from '@libecs/ecssystem';
import { ECSManager } from '@libecs/ecsmanager';
import { LightcycleComponent2 } from '@libgamemodel/lightcycle/lightcycle.component';
import { SceneGraphComponent } from '@libgamemodel/components/commoncomponents';
import { LightcycleLambertRenderResourcesComponent } from '@libgamerender/components/renderresourcecomponents';
import { LightcycleRenderComponent2, LightcycleRenderableTag } from '@libgamerender/lightcycle/lightcycle2.rendercomponent';
import { Entity } from '@libecs/entity';
import { Z_UNIT_DIR, BlendSpaceModelRotation } from '@libutil/helpfulconstants';
import { glMatrix } from 'gl-matrix';
import { SceneGraph2 } from '@libscenegraph/scenegraph2';
import { Mat4TransformAddon } from '@libscenegraph/scenenodeaddons/mat4transformaddon';
import { LambertRenderable2 } from '@librender/renderable/lambert.renderable2';
import { Renderable2SceneNodeAddon } from '@librender/renderable/renderable2.scenenodeaddon';

export class LightcycleLambertSystem2 extends ECSSystem {
  start() { return true; }

  update(ecs: ECSManager) {
    const singletonQuery = {
      sceneGraph: SceneGraphComponent,
      lightcycleRenderResources: LightcycleLambertRenderResourcesComponent,
    };
    const componentQuery = {
      lightcycle: LightcycleComponent2,
    };

    ecs.iterateComponents2(singletonQuery, componentQuery, (entity, singletons, components) => {
      this.getRenderableComponent(
        entity,
        components.lightcycle,
        singletons.sceneGraph.SceneGraph,
        singletons.lightcycleRenderResources);
    });
  }

  private getRenderableComponent(
      e: Entity,
      lightcycleComponent: LightcycleComponent2,
      sceneGraph: SceneGraph2,
      renderResources: LightcycleLambertRenderResourcesComponent): LightcycleRenderComponent2 {
    let component = e.getComponent(LightcycleRenderComponent2);
    if (!component) {
      // Renderables:
      const bodyRenderable = new LambertRenderable2({
        geo: renderResources.Body,
        diffuseTexture: renderResources.BodyTexture,
      });
      bodyRenderable.addTag(LightcycleRenderableTag);
      const frontWheelRenderable = new LambertRenderable2({
        geo: renderResources.Wheel,
        diffuseTexture: renderResources.WheelTexture,
      });
      frontWheelRenderable.addTag(LightcycleRenderableTag);
      const rearWheelRenderable = new LambertRenderable2({
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
      bodyRenderSceneNode.getAddon(Renderable2SceneNodeAddon)
        .addRenderable(LambertRenderable2, bodyRenderable);
      frontWheelRenderSceneNode.setParent(frontWheelZRot);
      frontWheelRenderSceneNode.getAddon(Renderable2SceneNodeAddon)
        .addRenderable(LambertRenderable2, frontWheelRenderable);
      rearWheelRenderSceneNode.setParent(backWheelZRot);
      rearWheelRenderSceneNode.getAddon(Renderable2SceneNodeAddon)
        .addRenderable(LambertRenderable2, rearWheelRenderable);

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
      });
    }

    return component;
  }
}
