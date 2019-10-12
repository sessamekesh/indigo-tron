import { ECSSystem } from '@libecs/ecssystem';
import { BikeInputController } from '@io/bikeinput/bikeinputcontroller';
import { ECSManager } from '@libecs/ecsmanager';
import { Entity } from '@libecs/entity';
import { LightcycleComponent2 } from '@libgamemodel/components/lightcycle.component';
import { TempGroupAllocator } from '@libutil/allocator';
import { vec3 } from 'gl-matrix';
import { MathUtils } from '@libutil/mathutils';
import { SceneNode } from '@libutil/scene/scenenode';
import { BACK_WHEEL_OFFSET } from './lightcyclespawner.system';

const LIGHTCYCLE_SPEED = 38.5;
const LIGHTCYCLE_ANGULAR_VELOCITY = -1.85;

export class LightcycleUpdateSystem extends ECSSystem {
  private playerCycle_: Entity|null = null;

  constructor(
      private bikeInputController: BikeInputController,
      private vec3Allocator: TempGroupAllocator<vec3>) {
    super();
  }

  start(ecs: ECSManager) { return true; }

  setPlayerCycle(cycle: Entity|null) {
    this.playerCycle_ = cycle;
  }

  update(ecs: ECSManager, msDt: number) {
    const dt = msDt / 1000;

    if (!this.playerCycle_) return;

    const lightcyclecomponent = this.playerCycle_.getComponent(LightcycleComponent2);
    if (!lightcyclecomponent) return;

    const turnAmount = this.bikeInputController.turnDirection() * LIGHTCYCLE_ANGULAR_VELOCITY * dt;
    const newOrientation =
        MathUtils.clampAngle(lightcyclecomponent.FrontWheelSceneNode.getRotAngle() + turnAmount);
    lightcyclecomponent.FrontWheelSceneNode.update({rot: { angle: newOrientation }});
    ecs.iterateComponents([LightcycleComponent2], (_, lightcycleComponent) => {
      this.moveForwardBasedOnOrientation(
        lightcycleComponent.FrontWheelSceneNode, LIGHTCYCLE_SPEED * dt);
      this.moveForwardBasedOnOrientation(
        lightcycleComponent.BodySceneNode, LIGHTCYCLE_SPEED * dt);

      this.vec3Allocator.get(3, (frontWheelPos, rearWheelPos, newRearPos) => {
        lightcycleComponent.FrontWheelSceneNode.getPos(frontWheelPos);
        lightcycleComponent.RearWheelSceneNode.getPos(rearWheelPos);
        MathUtils.nudgeToDistance(
          newRearPos, frontWheelPos, rearWheelPos,
          BACK_WHEEL_OFFSET, this.vec3Allocator);

        const newBodyOrientation = this.findOrientationBetweenWheels(
          frontWheelPos, newRearPos);
        lightcycleComponent.BodySceneNode.update({
          pos: frontWheelPos,
          rot: {
            angle: MathUtils.clampAngle(newBodyOrientation),
          },
        });
      });
    });
  }

  private moveForwardBasedOnOrientation(
      sceneNode: SceneNode, distanceTravelled: number) {
    const orientation = sceneNode.getRotAngle();
    this.vec3Allocator.get(3, (pos, dir, newPos) => {
      sceneNode.getPos(pos);
      vec3.set(
        dir,
        Math.sin(orientation),
        0,
        Math.cos(orientation));
      vec3.scaleAndAdd(newPos, pos, dir, distanceTravelled);
      sceneNode.update({pos: newPos, rot: {angle: orientation}});
    });
  }

  private findOrientationBetweenWheels(
      frontWheelPos: vec3,
      rearWheelPos: vec3) {
    const x = rearWheelPos[0] - frontWheelPos[0];
    const z = rearWheelPos[2] - frontWheelPos[2];
    return Math.atan2(x, z);
  }
}
