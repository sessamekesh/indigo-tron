import { ECSSystem } from '@libecs/ecssystem';
import { BikeInputController } from '@io/bikeinput/bikeinputcontroller';
import { ECSManager } from '@libecs/ecsmanager';
import { Entity } from '@libecs/entity';
import { LightcycleComponent2 } from '@libgamemodel/lightcycle/lightcycle.component';
import { TempGroupAllocator } from '@libutil/allocator';
import { vec3 } from 'gl-matrix';
import { MathUtils } from '@libutil/mathutils';
import { SceneNode } from '@libutil/scene/scenenode';
import { BACK_WHEEL_OFFSET } from './lightcyclespawner.system';
import { VelocityComponent } from '@libgamemodel/components/velocitycomponent';
import { WallComponent } from '@libgamemodel/wall/wallcomponent';
import { LineSegment2D, LineSegmentUtils } from '@libutil/math/linesegment';
import { LightcycleCollisionBoundsComponent } from '@libgamemodel/lightcycle/lightcyclecollisionbounds.component';
import { SceneNodeFactory } from '@libutil/scene/scenenodefactory';
import { LightcycleUtils } from './lightcycleutils';
import { IEventManager, EventManager } from '@libutil/eventmanager';

const LIGHTCYCLE_ANGULAR_VELOCITY = -1.85;

type PlayerHealthEvent = {
  MaxHealth: number,
  CurrentHealth: number,
};

interface LightcycleUpdateEvents {
  'playerhealthchange': PlayerHealthEvent,
  'death': boolean,
};

export class LightcycleUpdateSystem
    extends ECSSystem
    implements IEventManager<LightcycleUpdateEvents> {

  private playerCycle_: Entity|null = null;
  private eventManager_ = new EventManager<LightcycleUpdateEvents>();
  private randomFunction = Math.random;

  constructor(
      private bikeInputController: BikeInputController,
      private vec3Allocator: TempGroupAllocator<vec3>,
      private sceneNodeFactory: SceneNodeFactory) {
    super();
  }

  setRandomFn(fn: (()=>number)|null) {
    if (fn) {
      this.randomFunction = fn;
    } else {
      this.randomFunction = Math.random;
    }
  }

  addListener<KeyType extends keyof LightcycleUpdateEvents>(
      key: KeyType, listener: (evt: LightcycleUpdateEvents[KeyType]) => void):
      (evt: LightcycleUpdateEvents[KeyType]) => void {
    return this.eventManager_.addListener(key, listener);
  }
  removeListener<KeyType extends keyof LightcycleUpdateEvents>(
      key: KeyType, listener: (evt: LightcycleUpdateEvents[KeyType]) => void): boolean {
    return this.eventManager_.removeListener(key, listener);
  }
  fireEvent<KeyType extends keyof LightcycleUpdateEvents>(
      key: KeyType, event: LightcycleUpdateEvents[KeyType]): void {
    return this.eventManager_.fireEvent(key, event);
  }
  destroy(): void {
    return this.eventManager_.destroy();
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
    ecs.iterateComponents(
        [LightcycleComponent2, VelocityComponent],
        (_, lightcycleComponent, velocityComponent) => {
      this.moveForwardBasedOnOrientation(
        lightcycleComponent.FrontWheelSceneNode, velocityComponent.Velocity * dt);
      this.moveForwardBasedOnOrientation(
        lightcycleComponent.BodySceneNode, velocityComponent.Velocity * dt);
      const oldVitality = lightcycleComponent.Vitality;
      lightcycleComponent.Vitality += dt * 0.5;
      lightcycleComponent.Vitality = MathUtils.clamp(lightcycleComponent.Vitality, 0, 100);
      if (lightcycleComponent === this.playerCycle_!.getComponent(LightcycleComponent2)) {
        if (Math.round(oldVitality) !== Math.round(lightcyclecomponent.Vitality)) {
          this.fireEvent(
            'playerhealthchange', {CurrentHealth: lightcycleComponent.Vitality, MaxHealth: 100});
        }
      }

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
      let playerDeath = false;
      ecs.iterateComponents([WallComponent], (wallEntity, wallComponent) => {
        if (playerDeath) return;
        const wallLine = {
          x0: wallComponent.Corner1[0], y0: wallComponent.Corner1[1],
          x1: wallComponent.Corner2[0], y1: wallComponent.Corner2[1],
        };
        const [bikeLeftLine, bikeRightLine, bikeFrontLine] =
            this.getLightcycleLines(lightcycleEntity, lightcycleComponent);
        const leftCollision = LineSegmentUtils.getCollision(bikeLeftLine, wallLine);
        const rightCollision = LineSegmentUtils.getCollision(bikeRightLine, wallLine);
        const frontCollision = LineSegmentUtils.getCollision(bikeFrontLine, wallLine);

        // TODO (sessamekesh): Write unit tests for this system
        // TODO (sessamekesh): Instead, queue up collisions, and handle them at the end of the frame
        //  in a whole new system (instead of handling them in lightcycle updates)
        // Lightcycle updates should really just be movement - and this really could just be a
        //  movement system instead (which takes in certain locomotion parameters)

        // For now, just kill the wall entirely.
        if (leftCollision) {
          const action = LightcycleUtils.getSideCollisionAction(
            leftCollision, -1, this.randomFunction);
          LightcycleUtils.applyCollisionDamage(
            action.vitalityLost, wallComponent, lightcycleComponent);
          const newOrientation =
            MathUtils.clampAngle(
              lightcyclecomponent.FrontWheelSceneNode.getRotAngle()
                  + action.bikeSteeringAdjustment);
          lightcyclecomponent.FrontWheelSceneNode.update({rot: { angle: newOrientation }});
        } else if (rightCollision) {
          const action = LightcycleUtils.getSideCollisionAction(
            rightCollision, 1, this.randomFunction);
          LightcycleUtils.applyCollisionDamage(
            action.vitalityLost, wallComponent, lightcycleComponent);
          const newOrientation =
            MathUtils.clampAngle(
              lightcyclecomponent.FrontWheelSceneNode.getRotAngle()
                  + action.bikeSteeringAdjustment);
          lightcyclecomponent.FrontWheelSceneNode.update({rot: { angle: newOrientation }});
        } else if (frontCollision) {
          const action = LightcycleUtils.getFrontalCollisionAction(this.randomFunction);
          LightcycleUtils.applyCollisionDamage(
            action.vitalityLost, wallComponent, lightcycleComponent);
          const newOrientation =
            MathUtils.clampAngle(
              lightcyclecomponent.FrontWheelSceneNode.getRotAngle()
                  + action.bikeSteeringAdjustment);
          lightcyclecomponent.FrontWheelSceneNode.update({rot: { angle: newOrientation }});
        }

        if (wallComponent.Vitality <= 0) {
          wallEntity.destroy();
        }
        if (lightcyclecomponent.Vitality <= 0) {
          lightcycleEntity.destroy();
          if (lightcycleEntity === this.playerCycle_) {
            this.fireEvent(
              'playerhealthchange', {CurrentHealth: lightcyclecomponent.Vitality, MaxHealth: 100});
            this.fireEvent('death', true);
            playerDeath = true;
          }
        }

        if (frontCollision || rightCollision || leftCollision) {
          this.fireEvent(
            'playerhealthchange', { CurrentHealth: lightcyclecomponent.Vitality, MaxHealth: 100, });
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
        flNode.update({ pos: vec3.set(tmp, 0.5, 0, 1.5) });
        frNode.update({ pos: vec3.set(tmp, -0.5, 0, 1.5) });
        blNode.update({ pos: vec3.set(tmp, 0.5, 0, -1.5) });
        brNode.update({ pos: vec3.set(tmp, -0.5, 0, -1.5) });
      });
      flNode.attachToParent(lightcycleComponent.FrontWheelSceneNode);
      frNode.attachToParent(lightcycleComponent.FrontWheelSceneNode);
      blNode.attachToParent(lightcycleComponent.RearWheelSceneNode);
      brNode.attachToParent(lightcycleComponent.RearWheelSceneNode);
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
        x0: fl[0], y0: fl[2],
        x1: fr[0], y1: fr[2],
      };
      return [leftLine, rightLine, frontLine];
    });
  }
}
