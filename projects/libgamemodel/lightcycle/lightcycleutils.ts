import { RandomNumberFn } from '@libutil/mathutils';
import { LineSegment2DCollision } from '@libutil/math/linesegment';
import { WallComponent, WallComponent2 } from '@libgamemodel/wall/wallcomponent';
import { LightcycleComponent2 } from './lightcycle.component';
import { glMatrix, vec3 } from 'gl-matrix';
import { Entity } from '@libecs/entity';
import { SceneNodeFactory } from '@libutil/scene/scenenodefactory';
import { CameraRigComponent } from '@libgamemodel/camera/camerarig.component';
import { BasicCamera } from '@libgamemodel/camera/basiccamera';

const FULL_COLLISION_DAMAGE = 75;

export interface CollisionAction {
  vitalityLost: number,
  bikeSteeringAdjustment: number,
  depth: [number, number],
};

export class LightcycleUtils {
  /**
   * Side collisions could be the bike hitting the wall at a glancing angle (<30deg), a hard
   *  angle (<60deg), or head on (>60deg). Each is treated slightly differently:
   * - Glancing angle: Apply between 0-0.05 damage, bounce bike off at an angle equivalent
   *   to the angle it ran into the wall (3deg, bounce bike steering by -6deg)
   * - Hard angle: Apply between 0.05-0.85 damage, send bike at an angle between -15deg and 45 deg
   *   (in the opposite direction of the collision)
   * - Head on collision: Apply between 0.85 and full damage, distort bike by small random angle
   * Implementation note: a collinear collision counts as glancing at 0.1deg
   */
  static getSideCollisionAction(
      collision: LineSegment2DCollision, angleCoefficient: 1|-1, randomFn: RandomNumberFn):
      CollisionAction {
    // Special case: colinear collision, treat as glancing (should be very rare)
    if (collision.isColinear) {
      return {
        vitalityLost: 0,
        bikeSteeringAdjustment: angleCoefficient * glMatrix.toRadian(1),
        depth: [0, 0],
      };
    }

    // Glancing collision
    if (collision.angle < glMatrix.toRadian(30)) {
      const damage = FULL_COLLISION_DAMAGE * 0.05 * (collision.angle / glMatrix.toRadian(30));
      const angle = collision.angle * angleCoefficient * 2;
      return {
        vitalityLost: damage,
        bikeSteeringAdjustment: angle,
        depth: collision.depth,
      };
    }
    // Hard collision
    if (collision.angle < glMatrix.toRadian(60)) {
      const damage =
          FULL_COLLISION_DAMAGE * 0.8
          * ((collision.angle - glMatrix.toRadian(30)) / glMatrix.toRadian(30))
          + FULL_COLLISION_DAMAGE * 0.05;
      return {
        vitalityLost: damage,
        bikeSteeringAdjustment:
            angleCoefficient * randomFn() * glMatrix.toRadian(60) - glMatrix.toRadian(15),
        depth: collision.depth,
      };
    }
    // Head-on collision
    return {
      vitalityLost: FULL_COLLISION_DAMAGE,
      bikeSteeringAdjustment: (randomFn() - 0.5) * glMatrix.toRadian(10),
      depth: collision.depth,
    };
  }

  /**
   * Frontal collisions represent some odd cases where a collision with a wall happened,
   *  but didn't happen to the left or right sides of the bike. Usually, this is hitting a
   *  wall end directly.
   * In this case, apply 1/4 damage to the bike, and full damage to the wall. Apply some
   *  random noise to the direction of the bike, but do not offset the position of the bike.
   */
  static getFrontalCollisionAction(randomFn: RandomNumberFn): CollisionAction {
    return {
      vitalityLost: FULL_COLLISION_DAMAGE,
      bikeSteeringAdjustment: (randomFn() - 0.5) * Math.PI / 8,
      depth: [0, 0],
    }
  }

  static getArenaWallCollisionAction(
    collision: LineSegment2DCollision, angleCoefficient: 1|-1): CollisionAction {
  if (collision.isColinear) {
    return {
      vitalityLost: 5,
      bikeSteeringAdjustment: angleCoefficient * glMatrix.toRadian(5),
      depth: [0.5, 0],
    };
  }
  return {
    vitalityLost: 25,
    bikeSteeringAdjustment: angleCoefficient * collision.angle * 2,
    depth: collision.depth,
  };
}

  static applyCollisionDamage(
      damage: number, wallComponent: WallComponent, lightcycleComponent: LightcycleComponent2) {
    const actualDamage = Math.min(damage, wallComponent.Vitality, lightcycleComponent.Vitality);
    wallComponent.Vitality -= actualDamage;
    lightcycleComponent.Vitality -= actualDamage;
  }

  static applyCollisionDamage2(
    damage: number, wallComponent: WallComponent2, lightcycleComponent: LightcycleComponent2) {
  const actualDamage = Math.min(damage, wallComponent.Vitality, lightcycleComponent.Vitality);
  wallComponent.Vitality -= actualDamage;
  lightcycleComponent.Vitality -= actualDamage;
}

  static attachCameraRigToLightcycle(
      entity: Entity,
      offset: vec3,
      camera: BasicCamera,
      sceneNodeFactory: SceneNodeFactory) {
    const lightcycleComponent = entity.getComponent(LightcycleComponent2);
    if (!lightcycleComponent) {
      throw new Error('Could not attach camera rig to non-lightcycle entity');
    }
    const riggingSceneNode = sceneNodeFactory.createSceneNode({ pos: offset });
    riggingSceneNode.attachToParent(lightcycleComponent.BodySceneNode);

    entity.addComponent(
      CameraRigComponent, camera, lightcycleComponent.BodySceneNode, riggingSceneNode);
    entity.addListener('destroy', (e) => {
      const rigComponent = e.getComponent(CameraRigComponent);
      if (rigComponent) {
        rigComponent.PositionSceneNode.detach();
      }
    });
  }
}
