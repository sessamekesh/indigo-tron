import { ECSSystem } from '@libecs/ecssystem'
import { ECSManager } from '@libecs/ecsmanager';
import { CameraRigComponent } from './camerarig.component';
import { TempGroupAllocator } from '@libutil/allocator';
import { vec3 } from 'gl-matrix';
import { MathUtils } from '@libutil/mathutils';
import { Entity } from '@libecs/entity';
import { LightcycleComponent2 } from '@libgamemodel/components/lightcycle.component';
import { SceneNodeFactory } from '@libutil/scene/scenenodefactory';
import { BasicCamera } from './basiccamera';

export class CameraRigSystem extends ECSSystem {
  constructor(
      private vec3Allocator: TempGroupAllocator<vec3>,
      private sceneNodeFactory: SceneNodeFactory,
      private maxSpeed: number,
      private minSpeed: number,
      private closeRatio: number) {
    super();
  }

  start(ecs: ECSManager): boolean {
    return true;
  }
  update(ecs: ECSManager, msDt: number): void {
    ecs.iterateComponents([CameraRigComponent], (entity, rigComponent) => {
      this.vec3Allocator.get(5, (cameraPos, targetPos, targetLookAt, dPos, newPos) => {
        rigComponent.Camera.pos(cameraPos);
        rigComponent.PositionSceneNode.getPos(targetPos);
        vec3.sub(dPos, targetPos, cameraPos);
        const posDistance = vec3.length(dPos);
        const targetPosAdjust = posDistance * this.closeRatio;
        const posAdjust = MathUtils.clamp(targetPosAdjust, this.minSpeed, this.maxSpeed) * (msDt / 1000);
        vec3.scaleAndAdd(newPos, cameraPos, dPos, MathUtils.clamp(posAdjust / posDistance, -1, 1));

        rigComponent.Camera.setPos(newPos);
        rigComponent.Camera.setLookAt(targetLookAt);
      });
    });
  }

  attachToLightcycle(entity: Entity, offset: vec3, camera: BasicCamera) {
    const lightcycleComponent = entity.getComponent(LightcycleComponent2);
    if (!lightcycleComponent) {
      throw new Error('Could not attach camera rigging - target entity is not a lightcycle');
    }

    const riggingSceneNode = this.sceneNodeFactory.createSceneNode({ pos: offset });
    riggingSceneNode.attachToParent(lightcycleComponent.BodySceneNode);

    entity.addComponent(CameraRigComponent, camera, lightcycleComponent.BodySceneNode, riggingSceneNode);
    entity.addListener('destroy', (e) => {
      const rigComponent = e.getComponent(CameraRigComponent);
      if (rigComponent) {
        rigComponent.PositionSceneNode.detach();
      }
    });
  }
}
