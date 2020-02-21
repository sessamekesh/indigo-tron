import { ECSSystem } from '@libecs/ecssystem';
import { ECSManager } from '@libecs/ecsmanager';
import { Entity } from '@libecs/entity';
import { LightcycleComponent2 } from '@libgamemodel/lightcycle/lightcycle.component';
import { LambertRenderableComponent } from '@libgamerender/components/lambertrenderable.component';
import { mat4, glMatrix } from 'gl-matrix';
import { LightcycleLambertRenderResourcesComponent } from '@libgamerender/components/renderresourcecomponents';
import { SceneNodeFactory } from '@libutil/scene/scenenodefactory';
import { LightcycleRenderComponent } from '@libgamerender/components/lightcycle.rendercomponent';
import { Z_UNIT_DIR } from '@libutil/helpfulconstants';
import { SceneNodeFactoryComponent } from '@libgamemodel/components/commoncomponents';
import { SceneNode } from '@libutil/scene/scenenode';

export class LightcycleRenderableTag {}

class LightcycleChildLambertEntitiesComponent {
  constructor(
    public FrontWheelRenderableEntity: Entity,
    public RearWheelRenderableEntity: Entity,
    public BodyRenderableEntity: Entity,
    public SpawnStickRenderableEntity: Entity) {}
}

export class LightcycleLambertSystem extends ECSSystem {
  start(ecs: ECSManager) {
    return true;
  }

  update(ecs: ECSManager) {
    const {
      SceneNodeFactory: sceneNodeFactory,
    } = ecs.getSingletonComponentOrThrow(SceneNodeFactoryComponent);
    const lambertResources = ecs.getSingletonComponentOrThrow(
      LightcycleLambertRenderResourcesComponent);

    ecs.iterateComponents([LightcycleComponent2], (entity, lightcycleComponent) => {
      const renderComponent = this.getRenderComponent(
        sceneNodeFactory, entity, lightcycleComponent);
      const lambertChildEntities = this.getLambertRenderableChildrenComponent(
        ecs, entity, lambertResources);

      this.updateMatWorld(
        lambertChildEntities.FrontWheelRenderableEntity, renderComponent.FrontWheelSceneNode);
      this.updateMatWorld(
        lambertChildEntities.RearWheelRenderableEntity, renderComponent.BackWheelSceneNode);
      this.updateMatWorld(
        lambertChildEntities.BodyRenderableEntity, renderComponent.BodySceneNode);
      this.updateMatWorld(
        lambertChildEntities.SpawnStickRenderableEntity, renderComponent.SpawnStickSceneNode);
    });
  }

  private updateMatWorld(renderEntity: Entity, sceneNode: SceneNode) {
    const lambertComponent = renderEntity.getComponent(LambertRenderableComponent);
    if (lambertComponent) {
      sceneNode.getMatWorld(lambertComponent.MatWorld);
    }
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

  private getLambertRenderableChildrenComponent(
      ecs: ECSManager,
      entity: Entity,
      lightcycleRenderResources: LightcycleLambertRenderResourcesComponent) {
    let component = entity.getComponent(LightcycleChildLambertEntitiesComponent);
    if (!component) {
      const frontWheelEntity = ecs.createEntity();
      frontWheelEntity.addComponent(
        LambertRenderableComponent,
        mat4.create(),
        lightcycleRenderResources.Wheel,
        lightcycleRenderResources.WheelTexture);
      frontWheelEntity.addComponent(LightcycleRenderableTag);

      const rearWheelEntity = ecs.createEntity();
      rearWheelEntity.addComponent(
        LambertRenderableComponent,
        mat4.create(),
        lightcycleRenderResources.Wheel,
        lightcycleRenderResources.WheelTexture);
      rearWheelEntity.addComponent(LightcycleRenderableTag);

      const bodyEntity = ecs.createEntity();
      bodyEntity.addComponent(
        LambertRenderableComponent,
        mat4.create(),
        lightcycleRenderResources.Body,
        lightcycleRenderResources.BodyTexture);
      bodyEntity.addComponent(LightcycleRenderableTag);

      const spawnStickEntity = ecs.createEntity();
      spawnStickEntity.addComponent(
        LambertRenderableComponent,
        mat4.create(),
        lightcycleRenderResources.Stick,
        lightcycleRenderResources.StickTexture);
      spawnStickEntity.addComponent(LightcycleRenderableTag);

      component = entity.addComponent(
        LightcycleChildLambertEntitiesComponent,
        frontWheelEntity,
        rearWheelEntity,
        bodyEntity,
        spawnStickEntity);

      entity.addListener('destroy', (e) => {
        const childLambertEntities = e.getComponent(LightcycleChildLambertEntitiesComponent);
        if (childLambertEntities) {
          childLambertEntities.FrontWheelRenderableEntity.destroy();
          childLambertEntities.RearWheelRenderableEntity.destroy();
          childLambertEntities.BodyRenderableEntity.destroy();
          childLambertEntities.SpawnStickRenderableEntity.destroy();
        }
      });
    }
    return component;
  }
}
