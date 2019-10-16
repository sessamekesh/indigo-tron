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
import { VelocityComponent } from '@libgamemodel/components/velocitycomponent';
import { WallComponent } from '@libgamemodel/wall/wallcomponent';

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

    // Update the main player based on game input
    const lightcyclecomponent = this.playerCycle_.getComponent(LightcycleComponent2);
    if (!lightcyclecomponent) return;
    const turnAmount = this.bikeInputController.turnDirection() * LIGHTCYCLE_ANGULAR_VELOCITY * dt;
    const newOrientation =
        MathUtils.clampAngle(lightcyclecomponent.FrontWheelSceneNode.getRotAngle() + turnAmount);
    lightcyclecomponent.FrontWheelSceneNode.update({rot: { angle: newOrientation }});

    // Update all lightcycles
    ecs.iterateComponents([LightcycleComponent2, VelocityComponent], (_, lightcycleComponent, velocityComponent) => {
      this.moveForwardBasedOnOrientation(
        lightcycleComponent.FrontWheelSceneNode, velocityComponent.Velocity * dt);
      this.moveForwardBasedOnOrientation(
        lightcycleComponent.BodySceneNode, velocityComponent.Velocity * dt);

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

    // Collision checking
    ecs.iterateComponents([LightcycleComponent2], (_, lightcycleComponent) => {
      ecs.iterateComponents([WallComponent], (_2, wallComponent) => {
        // TODO (sessamekesh): Check if lightcycle bounding box is colliding with the wall
        // If so, remove vitality both from cycle and wall, breaking whichever reaches 0 first
        // If wall, destroy the wall.
        // If lightcycle, destroy the lightcycle (possibly ending the game)
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

  private getLightcycleLines() {

  }

  private getCollision() {

  }
}
