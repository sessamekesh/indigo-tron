import { ECSSystem } from "@libecs/ecssystem";
import { Entity } from "@libecs/entity";
import { ECSManager } from "@libecs/ecsmanager";
import { LightcycleComponent2 } from "./lightcycle.component";
import { BikeInputManagerComponent } from "@libgamemodel/components/gameappuicomponents";
import { MathUtils } from "@libutil/mathutils";
import { VelocityComponent } from "@libgamemodel/components/velocitycomponent";
import { SceneNodeFactory } from "@libutil/scene/scenenodefactory";
import { LightcycleCollisionBoundsComponent } from "./lightcyclecollisionbounds.component";
import { LineSegment2D, LineSegmentUtils } from "@libutil/math/linesegment";
import { TempGroupAllocator } from "@libutil/allocator";
import { vec3 } from "gl-matrix";
import { MovementUtils } from "@libgamemodel/utilities/movementutils";
import { MathAllocatorsComponent, SceneNodeFactoryComponent } from "@libgamemodel/components/commoncomponents";
import { UIEventEmitterComponent } from "@libgamemodel/components/gameui";
import { BACK_WHEEL_OFFSET } from "./lightcyclespawner.system";
import { WallComponent2 } from "@libgamemodel/wall/wallcomponent";
import { CollisionAction, LightcycleUtils } from "./lightcycleutils";

const LIGHTCYCLE_ANGULAR_VELOCITY = -1.85;

type PlayerHealthEvent = {
  MaxHealth: number,
  CurrentHealth: number,
};

interface LightcycleUpdateEvents {
  'playerhealthchange': PlayerHealthEvent,
  'death': boolean,
};

export class MainPlayerComponent {}

export class LightcycleUpdateRandomFnComponent {
  constructor(public Fn: ()=>number) {}
}

export class LightcycleUpdateSystem2 extends ECSSystem {

  static setMainPlayer(ecs: ECSManager, newMainPlayer: Entity) {
    ecs.iterateComponents([MainPlayerComponent], (entity) => {
      entity.removeComponent(MainPlayerComponent);
    });
    newMainPlayer.addComponent(MainPlayerComponent);
  }

  start(ecs: ECSManager) {
    const existingRandomFn = ecs.getSingletonComponent(LightcycleUpdateRandomFnComponent);
    if (!existingRandomFn) {
      const randomFnEntity = ecs.createEntity();
      randomFnEntity.addComponent(LightcycleUpdateRandomFnComponent, Math.random);
    }
    return true;
  }

  setRandomFn(ecs: ECSManager, fn: ()=>number) {
    ecs.iterateComponents([LightcycleUpdateRandomFnComponent], (entity, randomFnComponent) => {
      randomFnComponent.Fn = fn;
    });
  }

  update(ecs: ECSManager, msDt: number) {
    const dt = msDt / 1000;
    const {
      BikeInputManager: bikeInputManager
    } = ecs.getSingletonComponentOrThrow(BikeInputManagerComponent);
    const {
      EventEmitter: uiEventEmitter,
    } = ecs.getSingletonComponentOrThrow(UIEventEmitterComponent);
    const {
      Vec3: vec3Allocator,
    } = ecs.getSingletonComponentOrThrow(MathAllocatorsComponent);
    const {
      SceneNodeFactory: sceneNodeFactory,
    } = ecs.getSingletonComponentOrThrow(SceneNodeFactoryComponent);
    const {
      Fn: randomFn,
    } = ecs.getSingletonComponentOrThrow(LightcycleUpdateRandomFnComponent);

    // Update main player based on game input
    ecs.iterateComponents([MainPlayerComponent, LightcycleComponent2], (entity, _, lightcycle) => {
      const turnAmount = bikeInputManager.turnDirection() * LIGHTCYCLE_ANGULAR_VELOCITY * dt;
      const newOrientation =
        MathUtils.clampAngle(lightcycle.FrontWheelSceneNode.getRotAngle() + turnAmount);
      lightcycle.FrontWheelSceneNode.update({ rot: { angle: newOrientation }});
    });

    // Update the position of all lightcycles
    ecs.iterateComponents(
        [LightcycleComponent2, VelocityComponent],
        (entity, lightcycle, velocity) => {
      // TODO (kamaron): Write this
      const movementAmt = velocity.Velocity * dt;
      MovementUtils.moveForwardBasedOnOrientation(
        lightcycle.FrontWheelSceneNode, movementAmt, vec3Allocator);
      MovementUtils.moveForwardBasedOnOrientation(
        lightcycle.BodySceneNode, movementAmt, vec3Allocator);
      const oldVitality = lightcycle.Vitality;
      lightcycle.Vitality = MathUtils.clamp(lightcycle.Vitality + 0.5 * dt, 0, 100);
      if (entity.hasComponent(MainPlayerComponent)
          && Math.round(oldVitality) !== Math.round(lightcycle.Vitality)) {
        uiEventEmitter.fireEvent(
          'playerhealth', { CurrentHealth: lightcycle.Vitality, MaxHealth: 100  });
      }

      vec3Allocator.get(3, (frontWheelPos, rearWheelPos, newRearPos) => {
        lightcycle.FrontWheelSceneNode.getPos(frontWheelPos);
        lightcycle.RearWheelSceneNode.getPos(rearWheelPos);
        MathUtils.nudgeToDistance(
          newRearPos, frontWheelPos, rearWheelPos,
          BACK_WHEEL_OFFSET, vec3Allocator);

        const newBodyOrientation = MovementUtils.findOrientationBetweenPoints(
          frontWheelPos, newRearPos);
        lightcycle.BodySceneNode.update({
          pos: frontWheelPos,
          rot: {
            angle: MathUtils.clampAngle(newBodyOrientation),
          },
        });
      });
    });

    // Collision checking
    ecs.iterateComponents([LightcycleComponent2], (lightcycleEntity, lightcycle) => {
      let playerDeath = false;
      ecs.iterateComponents([WallComponent2], (wallEntity, wall) => {
        if (playerDeath) return;
        const wallLine = {
          x0: wall.Corner1.Value[0], y0: wall.Corner1.Value[1],
          x1: wall.Corner2.Value[0], y1: wall.Corner2.Value[1],
        };
        const [bikeLeftLine, bikeRightLine, bikeFrontLine] =
            this.getLightcycleLines(sceneNodeFactory, vec3Allocator, lightcycleEntity, lightcycle);
        const leftCollision = LineSegmentUtils.getCollision(bikeLeftLine, wallLine);
        const rightCollision = LineSegmentUtils.getCollision(bikeRightLine, wallLine);
        const frontCollision = LineSegmentUtils.getCollision(bikeFrontLine, wallLine);

        const actions: CollisionAction[] = [];
        if (leftCollision) {
          actions.push(LightcycleUtils.getSideCollisionAction(leftCollision, -1, randomFn));
        }
        if (rightCollision) {
          actions.push(LightcycleUtils.getSideCollisionAction(rightCollision, 1, randomFn));
        }
        if (frontCollision) {
          actions.push(LightcycleUtils.getFrontalCollisionAction(randomFn));
        }

        let angleAdjustment = 0;
        actions.forEach(action => angleAdjustment += action.bikeSteeringAdjustment);
        let vitalityLost = 0;
        actions.forEach(action => vitalityLost += action.vitalityLost);

        const newOrientation = MathUtils.clampAngle(
          lightcycle.FrontWheelSceneNode.getRotAngle() + angleAdjustment);
        lightcycle.FrontWheelSceneNode.update({rot: { angle: newOrientation }});
        LightcycleUtils.applyCollisionDamage2(vitalityLost, wall, lightcycle);

        if (wall.Vitality <= 0) {
          wallEntity.destroy();
        }

        if (vitalityLost > 0 && lightcycleEntity.hasComponent(MainPlayerComponent)) {
          uiEventEmitter.fireEvent(
            'playerhealth', { CurrentHealth: lightcycle.Vitality, MaxHealth: 100 });
        }

        if (lightcycle.Vitality <= 0) {
          lightcycleEntity.destroy();
          playerDeath = true;
          if (lightcycleEntity.hasComponent(MainPlayerComponent)) {
            uiEventEmitter.fireEvent('player-death', true);
          }
        }
      });
    });
  }

  private getLightcycleLines(
      sceneNodeFactory: SceneNodeFactory, vec3Allocator: TempGroupAllocator<vec3>,
      entity: Entity, lightcycleComponent: LightcycleComponent2): LineSegment2D[] {
    let collisionBoundsComponent = entity.getComponent(LightcycleCollisionBoundsComponent);
    if (!collisionBoundsComponent) {
      const flNode = sceneNodeFactory.createSceneNode();
      const frNode = sceneNodeFactory.createSceneNode();
      const blNode = sceneNodeFactory.createSceneNode();
      const brNode = sceneNodeFactory.createSceneNode();
      vec3Allocator.get(1, (tmp) => {
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
    return vec3Allocator.get(4, (fl, fr, bl, br) => {
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
