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
import { LineSegment2D, LineSegmentUtils } from '@libutil/math/linesegment';
import { LightcycleCollisionBoundsComponent } from '@libgamemodel/components/lightcyclecollisionbounds.component';
import { SceneNodeFactory } from '@libutil/scene/scenenodefactory';

const LIGHTCYCLE_ANGULAR_VELOCITY = -1.85;

export class LightcycleUpdateSystem extends ECSSystem {
  private playerCycle_: Entity|null = null;

  constructor(
      private bikeInputController: BikeInputController,
      private vec3Allocator: TempGroupAllocator<vec3>,
      private sceneNodeFactory: SceneNodeFactory) {
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
    ecs.iterateComponents([LightcycleComponent2], (lightcycleEntity, lightcycleComponent) => {
      ecs.iterateComponents([WallComponent], (wallEntity, wallComponent) => {
        const wallLine = {
          x0: wallComponent.Corner1[0], y0: wallComponent.Corner1[1],
          x1: wallComponent.Corner2[0], y1: wallComponent.Corner2[1],
        };
        const [bikeLeftLine, bikeRightLine, bikeFrontLine] =
            this.getLightcycleLines(lightcycleEntity, lightcycleComponent);
        const leftCollision = LineSegmentUtils.getCollision(bikeLeftLine, wallLine);
        const rightCollision = LineSegmentUtils.getCollision(bikeRightLine, wallLine);
        const frontCollision = LineSegmentUtils.getCollision(bikeFrontLine, wallLine);

        // TODO (sessamekesh): Check if lightcycle bounding box is colliding with the wall
        // If so, remove vitality both from cycle and wall, breaking whichever reaches 0 first
        // If wall, destroy the wall.
        // If lightcycle, destroy the lightcycle (possibly ending the game)
        // If less than 30deg collision, lightcycle just glances off of the wall
        // If less than 60deg collision, lightcycle slams into and goes parallel with wall
        // Otherwise, lightcycle collides head on with wall - it dies or wall dies

        // TODO (sessamekesh): Write unit tests for this system
        // TODO (sessamekesh): Collisions aren't working

        // For now, just kill the wall entirely.
        if (leftCollision || rightCollision || frontCollision) {
          wallEntity.destroy();
        }
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

  private getLightcycleLines(
      entity: Entity, lightcycleComponent: LightcycleComponent2): LineSegment2D[] {
    let collisionBoundsComponent = entity.getComponent(LightcycleCollisionBoundsComponent);
    if (!collisionBoundsComponent) {
      const flNode = this.sceneNodeFactory.createSceneNode();
      const frNode = this.sceneNodeFactory.createSceneNode();
      const blNode = this.sceneNodeFactory.createSceneNode();
      const brNode = this.sceneNodeFactory.createSceneNode();
      this.vec3Allocator.get(1, (tmp) => {
        flNode.update({ pos: vec3.set(tmp, 0.5, 0, 0.5) });
        frNode.update({ pos: vec3.set(tmp, -0.5, 0, 0.5) });
        blNode.update({ pos: vec3.set(tmp, 0.5, 0, -0.5) });
        brNode.update({ pos: vec3.set(tmp, -0.5, 0, -0.5) });
      });
      flNode.attachToParent(lightcycleComponent.FrontWheelSceneNode);
      frNode.attachToParent(lightcycleComponent.FrontWheelSceneNode);
      blNode.attachToParent(lightcycleComponent.RearWheelSceneNode);
      blNode.attachToParent(lightcycleComponent.RearWheelSceneNode);
      entity.addListener('destroy', () => {
        flNode.detach(); frNode.detach(); blNode.detach(); brNode.detach();
      });
      collisionBoundsComponent =
        entity.addComponent(LightcycleCollisionBoundsComponent, flNode, frNode, blNode, brNode);
    }
    return this.vec3Allocator.get(4, (fl, fr, bl, br) => {
      collisionBoundsComponent!.FrontLeftPoint.getPos(fl);
      collisionBoundsComponent!.FrontRightPoint.getPos(fr);
      collisionBoundsComponent!.BackLeftPoint.getPos(bl);
      collisionBoundsComponent!.BackRightPoint.getPos(br);
      const leftLine = {
        x0: bl[0], y0: bl[2],
        x1: fl[0], y1: fl[2],
      };
      const rightLine = {
        x0: br[0], y0: br[2],
        x1: fr[0], y1: fr[2],
      };
      const frontLine = {
        x0: fl[0], y0: fl[1],
        x1: fr[0], y1: fr[1],
      };
      return [leftLine, rightLine, frontLine];
    });
  }
}
