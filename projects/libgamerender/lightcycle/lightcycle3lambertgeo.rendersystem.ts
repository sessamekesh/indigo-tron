import { ECSSystem } from '@libecs/ecssystem';
import { ECSManager } from '@libecs/ecsmanager';
import { SceneGraphComponent, MathAllocatorsComponent } from '@libgamemodel/components/commoncomponents';
import { LightcycleLambertRenderResourcesComponent } from '@libgamerender/components/renderresourcecomponents';
import { LightcycleComponent3 } from '@libgamemodel/lightcycle3/lightcycle3.component';
import { SceneGraph2 } from '@libscenegraph/scenegraph2';
import { LightcycleRenderableTag } from './lightcycle2.rendercomponent';
import { Entity } from '@libecs/entity';
import { LambertRenderable2 } from '@librender/renderable/lambert.renderable2';
import { Mat4TransformAddon } from '@libscenegraph/scenenodeaddons/mat4transformaddon';
import { Y_UNIT_DIR, BlendSpaceModelRotation, Z_UNIT_DIR } from '@libutil/helpfulconstants';
import { glMatrix, vec3 } from 'gl-matrix';
import { Lightcycle3LambertRenderComponent } from './lightcycle3lambertrender.component';
import { MovementUtils } from '@libgamemodel/utilities/movementutils';
import { Renderable2SceneNodeAddon } from '@librender/renderable/renderable2.scenenodeaddon';
import { BACK_WHEEL_OFFSET } from '@libgamemodel/lightcycle3/lightcycle3spawner.util';

const SINGLETON_QUERY = {
  sceneGraph: SceneGraphComponent,
  lightcycleRenderResources: LightcycleLambertRenderResourcesComponent,
  tempAllocators: MathAllocatorsComponent,
};
const COMPONENT_QUERY = {
  lightcycle: LightcycleComponent3,
};

/**
 * Find lightcycle components, and attach/update scene nodes for the geometry associated with a
 *  lightcycle entity:
 * - Front wheel
 * - Rear wheel
 * - Bike body
 */
export class Lightcycle3LambertGeoRenderSystem extends ECSSystem {
  start(ecs: ECSManager) {
    return this.expectSingletons(ecs, SINGLETON_QUERY, 'Lightcycle3LambertGeoRenderSystem');
  }

  update(ecs: ECSManager) {
    ecs.iterateComponents2(SINGLETON_QUERY, COMPONENT_QUERY, (e, s, c) => {
      const renderableComponent = this.getRenderableComponent(
        e, s.sceneGraph.SceneGraph, s.lightcycleRenderResources);

      s.tempAllocators.Vec3.get(1, newPos => {
        vec3.set(
          newPos,
          c.lightcycle.FrontWheelPosition.Value[0],
          0.12,
          c.lightcycle.FrontWheelPosition.Value[1]);
        renderableComponent.FrontWheelLogicalSceneNode.getAddon(Mat4TransformAddon).update({
          pos: newPos,
          rot: {
            angle: c.lightcycle.FrontWheelRotation,
          },
        });

        const rot = MovementUtils.findOrientationBetweenPoints2(
          c.lightcycle.FrontWheelPosition.Value, c.lightcycle.RearWheelPosition.Value);
        renderableComponent.BodyLogicalSceneNode.getAddon(Mat4TransformAddon).update({
          pos: newPos,
          rot: {
            angle: rot,
          },
        });
      });
    });
  }

  private getRenderableComponent(
      e: Entity,
      sceneGraph: SceneGraph2,
      renderResources: LightcycleLambertRenderResourcesComponent): Lightcycle3LambertRenderComponent {
    let component = e.getComponent(Lightcycle3LambertRenderComponent);
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

      // Scene node structure. TODO (sessamekesh): come up with why these work?
      // - front wheel update node
      //   - front wheel zrot node
      //     - front wheel render node
      // - body update node
      //   - body move_back node
      //     - body flip_axis node
      //       - body render node
      //   - rear wheel zrot node
      //     - rear wheel moveback node
      //       - rear wheel render node
      const frontWheelUpdateNode = sceneGraph.createSceneNode();
      const frontWheelZRotNode = sceneGraph.createSceneNode();
      const frontWheelRenderNode = sceneGraph.createSceneNode();
      const bodyUpdateNode = sceneGraph.createSceneNode();
      const bodyFlipAxisNode = sceneGraph.createSceneNode();
      const bodyRenderNode = sceneGraph.createSceneNode();
      const rearWheelRenderNode = sceneGraph.createSceneNode();
      const rearWheelZRotNode = sceneGraph.createSceneNode();
      const rearWheelMoveBackNode = sceneGraph.createSceneNode();

      // Lifecycle management (keep next to allocation to avoid accidental errors)
      e.addListener('destroy', () => {
        frontWheelUpdateNode.destroy();
        frontWheelRenderNode.destroy();
        bodyUpdateNode.destroy();
        bodyFlipAxisNode.destroy();
        bodyRenderNode.destroy();
        rearWheelRenderNode.destroy();
        rearWheelZRotNode.destroy();
        rearWheelMoveBackNode.destroy();
      });

      // Front wheel setup
      frontWheelZRotNode.setParent(frontWheelUpdateNode);
      frontWheelRenderNode.setParent(frontWheelZRotNode);

      frontWheelUpdateNode.getAddon(Mat4TransformAddon).update({ rot: { axis: Y_UNIT_DIR } });
      frontWheelZRotNode.getAddon(Mat4TransformAddon).update({
        rot: { axis: Z_UNIT_DIR, angle: glMatrix.toRadian(90) }
      });
      frontWheelRenderNode.getAddon(Mat4TransformAddon).update(BlendSpaceModelRotation);
      frontWheelRenderNode.getAddon(Renderable2SceneNodeAddon)
        .addRenderable(LambertRenderable2, frontWheelRenderable);

      // Body setup
      bodyFlipAxisNode.setParent(bodyUpdateNode);
      bodyRenderNode.setParent(bodyFlipAxisNode);

      bodyUpdateNode.getAddon(Mat4TransformAddon).update({ rot: { axis: Y_UNIT_DIR } });
      bodyFlipAxisNode.getAddon(Mat4TransformAddon)
        .update({ rot: { axis: Y_UNIT_DIR, angle: glMatrix.toRadian(180) }});
      bodyRenderNode.getAddon(Mat4TransformAddon).update(BlendSpaceModelRotation);
      bodyRenderNode.getAddon(Renderable2SceneNodeAddon)
        .addRenderable(LambertRenderable2, bodyRenderable);

      // Rear wheel setup
      rearWheelZRotNode.setParent(bodyUpdateNode);
      rearWheelMoveBackNode.setParent(rearWheelZRotNode);
      rearWheelRenderNode.setParent(rearWheelMoveBackNode);

      rearWheelZRotNode.getAddon(Mat4TransformAddon)
        .update({ rot: { axis: Z_UNIT_DIR, angle: glMatrix.toRadian(90) } });
      rearWheelMoveBackNode.getAddon(Mat4TransformAddon)
        .update({ pos: vec3.fromValues(0, 0, BACK_WHEEL_OFFSET) });
      rearWheelRenderNode.getAddon(Mat4TransformAddon).update(BlendSpaceModelRotation);

      rearWheelRenderNode.getAddon(Renderable2SceneNodeAddon)
        .addRenderable(LambertRenderable2, rearWheelRenderable);

      component = e.addComponent(
        Lightcycle3LambertRenderComponent, frontWheelUpdateNode, bodyUpdateNode);
    }
    return component;
  }
}
