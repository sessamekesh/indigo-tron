import { RandomNumberFn, MathUtils } from '@libutil/mathutils';
import { LineSegment2DCollision } from '@libutil/math/linesegment';
import { WallComponent, WallComponent2 } from '@libgamemodel/wall/wallcomponent';
import { LightcycleComponent2 } from './lightcycle.component';
import { glMatrix, vec3, vec2, vec4 } from 'gl-matrix';
import { Entity } from '@libecs/entity';
import { TempGroupAllocator } from '@libutil/allocator';
import { Circle3 } from '@libutil/math/circle3';
import { LightcycleSteeringStateComponent } from './lightcyclesteeringstate.component';
import { ECSManager } from '@libecs/ecsmanager';
import { MathAllocatorsComponent } from '@libgamemodel/components/commoncomponents';
import { LightcycleColorComponent } from './lightcyclecolor.component';
import { assert } from '@libutil/loadutils';
import { Mat4TransformAddon } from '@libgamemodel/../libscenegraph/scenenodeaddons/mat4transformaddon';

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

  static currentPosition2(o: vec2, entity: Entity, ecs: ECSManager): boolean {
    const vec3Allocator = ecs.getSingletonComponent(MathAllocatorsComponent)!.Vec3;
    const lightcycle = entity.getComponent(LightcycleComponent2);
    if (!vec3Allocator || !lightcycle) return false;

    vec3Allocator.get(1, (pos3) => {
      lightcycle.BodySceneNode.getAddon(Mat4TransformAddon).getPos(pos3);
      vec2.set(o, pos3[0], pos3[2]);
    });

    return true;
  }

  /** Find the approximate position of the lightcycle at some time in the future (maybe negative) */
  static approximateLightcyclePositionAt(
      o: vec3,
      lightcycle: LightcycleComponent2,
      dt: number,
      vec3Allocator: TempGroupAllocator<vec3>) {
    vec3Allocator.get(2, (lightcyclePos, lightcycleFwd) => {
      lightcycle.BodySceneNode.getAddon(Mat4TransformAddon).getPos(lightcyclePos);
      const orientation = lightcycle.BodySceneNode.getAddon(Mat4TransformAddon).getSelfRotAngle();
      const wheelOrientation = lightcycle.FrontWheelSceneNode.getAddon(Mat4TransformAddon).getSelfRotAngle();
      // TODO (sessamekesh): You need the actual angular velocity here, to find the radius
      if (wheelOrientation - orientation > 0.01) {
      }
    });
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

  static getApproximatePositionInFuture(
      o: vec3,
      lightcycle: LightcycleComponent2,
      steering: LightcycleSteeringStateComponent,
      dt: number,
      vec3Allocator: TempGroupAllocator<vec3>,
      circle3Allocator: TempGroupAllocator<Circle3>): void {
    const angle = LightcycleUtils.getGlobalLightcycleCircleAngleToBike(lightcycle, steering);
    if (!angle) {
      // Get straight line, use that
      LightcycleUtils.getStraightLinePositionInFuture(o, lightcycle, dt, vec3Allocator);
      return;
    }
    circle3Allocator.get(1, (travelCircle) => {
      if (!LightcycleUtils.getLightcycleTravelCircle3(
          travelCircle, lightcycle, steering, vec3Allocator)) {
        // Get straight line, use that
        LightcycleUtils.getStraightLinePositionInFuture(o, lightcycle, dt, vec3Allocator);
        return;
      }

      vec3Allocator.get(1, (toNewPos) => {
        const actualDistance = lightcycle.Velocity * dt;
        const actualCircumference = 2 * Math.PI * travelCircle.Radius;
        const actualAngleDifference = 2 * Math.PI * actualDistance / actualCircumference;
        const sign = (steering.SteeringStrength < 0) ? -1 : 1;
        const futureAngle = angle - glMatrix.toRadian(180) + actualAngleDifference * sign;
        vec3.set(toNewPos, Math.sin(futureAngle), 0, Math.cos(futureAngle));
        vec3.scaleAndAdd(o, travelCircle.Origin, toNewPos, travelCircle.Radius);
      });
    });
  }

  static getStraightLinePositionInFuture(
      o: vec3,
      lightcycle: LightcycleComponent2,
      dt: number,
      vec3Allocator: TempGroupAllocator<vec3>) {
    // TODO (sessamekesh): Fill this in
    vec3Allocator.get(2, (pos, fwd) => {
      const currentAngle = lightcycle.BodySceneNode.getAddon(Mat4TransformAddon).getSelfRotAngle();
      vec3.set(fwd, Math.sin(currentAngle), 0, Math.cos(currentAngle));
      lightcycle.BodySceneNode.getAddon(Mat4TransformAddon).getPos(pos);
      vec3.scaleAndAdd(o, pos, fwd, dt * lightcycle.Velocity);
    });
  }

  static getLightcycleTravelCircle3(
      o: Circle3,
      lightcycle: LightcycleComponent2,
      steering: LightcycleSteeringStateComponent,
      vec3Allocator: TempGroupAllocator<vec3>): boolean {
    // Time to complete a circle: T = 2*PI/AngularVelocity (rad/sec)
    // Distance travelled (circumference): C = T * velocity (m)
    // Radius: r = C / (2 * PI) = (T * Velocity) / (2 * PI) = Velocity / AngularVelocity
    const actualAngularVelocity = LightcycleUtils.getActualAngularVelocity(lightcycle, steering);
    const circleToBikeGlobalAngle =
        LightcycleUtils.getGlobalLightcycleCircleAngleToBike(lightcycle, steering);
    if (Math.abs(actualAngularVelocity) < 0.0001 || circleToBikeGlobalAngle == null) {
      // No circle can be evaluated
      return false;
    }

    o.Radius = Math.abs(lightcycle.Velocity / actualAngularVelocity);

    // Origin of circle: LightcyclePosition + radius * toOriginNormal
    // toOriginNormal = [Math.sin(Orientation + 90), 0, Math.cos(Orientation + 90)]
    //                  (+90 if steering is positive, -90 if steering is negative)
    vec3Allocator.get(3, (lightcyclePos, toOriginNormal) => {
      vec3.set(
        toOriginNormal,
        Math.sin(circleToBikeGlobalAngle),
        0,
        Math.cos(circleToBikeGlobalAngle));

      lightcycle.BodySceneNode.getAddon(Mat4TransformAddon).getPos(lightcyclePos);
      vec3.scaleAndAdd(o.Origin, lightcyclePos, toOriginNormal, o.Radius);
      vec3.set(o.Up, 0, 1, 0);
    });
    return true;
  }

  static getActualAngularVelocity(
      lightcycle: LightcycleComponent2, steering: LightcycleSteeringStateComponent): number {
    return steering.SteeringStrength * lightcycle.AngularVelocity;
  }

  static getGlobalLightcycleCircleAngleToBike(
      lightcycle: LightcycleComponent2, steering: LightcycleSteeringStateComponent): number|null {
    const actualAngularVelocity = LightcycleUtils.getActualAngularVelocity(lightcycle, steering);
    if (Math.abs(actualAngularVelocity) < 0.0001) {
      // No circle can be evaluated
      return null;
    }

    if (actualAngularVelocity > 0) {
      return MathUtils.clampAngle(
        lightcycle.BodySceneNode.getAddon(Mat4TransformAddon).getSelfRotAngle()
        + glMatrix.toRadian(90));
    } else {
      return MathUtils.clampAngle(
        lightcycle.BodySceneNode.getAddon(Mat4TransformAddon).getSelfRotAngle()
        - glMatrix.toRadian(90));
    }
  }

  static getMinimapColor(entity: Entity) {
    const lightcycleColor =
      assert('LightcycleColorComponent', entity.getComponent(LightcycleColorComponent));
    switch (lightcycleColor.Color) {
      case 'blue':
        return vec4.fromValues(0, 0, 1, 1);
      case 'green':
        return vec4.fromValues(0, 1, 0, 1);
      case 'red':
        return vec4.fromValues(1, 0, 0, 1);
      default:
        return vec4.fromValues(0.5, 0.5, 0.5, 1);
    }
  }
}
