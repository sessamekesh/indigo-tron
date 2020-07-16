import { ECSSystem } from "@libecs/ecssystem";
import { ECSManager } from "@libecs/ecsmanager";
import { Entity } from "@libecs/entity";
import { ArenaWallComponent } from "@libgamemodel/arena/arenawall.component";
import { ArenaWallCollisionComponent } from "@libgamemodel/arena/arenawallcollision.component";
import { TempGroupAllocator, LifecycleOwnedAllocator } from "@libutil/allocator";
import { vec2 } from "gl-matrix";
import { MathUtils } from "@libutil/mathutils";
import { CollisionPlane } from "@libgamemodel/physics4/collisionplane";
import { MathAllocatorsComponent, OwnedMathAllocatorsComponent } from "@libgamemodel/components/commoncomponents";
import { LightcycleCollisionsListSingleton, LightcycleCollisionRecord } from "@libgamemodel/components/lightcyclecollisionslist.singleton";
import { LightcycleComponent3 } from "./lightcycle3.component";
import { Lightcycle3CollisionComponent } from "./lightcycle3collision.component";
import { CollisionBox } from "@libgamemodel/physics4/collisionbox";
import { BACK_WHEEL_OFFSET } from "./lightcycle3spawner.util";
import { MovementUtils } from "@libgamemodel/utilities/movementutils";
import { getBoxPlaneCollision, getBoxLineCollision } from "@libgamemodel/physics4/collisiondetection";
import { SceneModeUtil } from "@libgamemodel/scenemode/scenemodeutil";
import { WallComponent2 } from "@libgamemodel/wall/wallcomponent";
import { WallCollisionComponent } from "@libgamemodel/wall/wallcollision.component";
import { CollisionLine } from "@libgamemodel/physics4/collisionline";

const SINGLETON_QUERY = {
  tempAllocators: MathAllocatorsComponent,
  allocators: OwnedMathAllocatorsComponent,
  collisionsList: LightcycleCollisionsListSingleton,
};
const ARENA_WALL_COMPONENT_QUERY = {
  arenaWall: ArenaWallComponent,
};
const LIGHTCYCLE_COMPONENT_QUERY = {
  lightcycle: LightcycleComponent3,
};
const LIGHTCYCLE_WALL_COMPONENT_QUERY = {
  lightcycleWall: WallComponent2,
};

export class Lightcycle3ArenaCollisionSystem extends ECSSystem {
  start(ecs: ECSManager) {
    return this.expectSingletons(ecs, SINGLETON_QUERY, 'Lightcycle3ArenaCollisionSystem');
  }

  update(ecs: ECSManager, msDt: number) {
    if (SceneModeUtil.isPaused(ecs)) return;

    ecs.iterateComponents2(
        SINGLETON_QUERY,
        LIGHTCYCLE_COMPONENT_QUERY,
        (lightcycleEntity, s, lightcycleComponents) => {
      const tempVec2 = s.tempAllocators.Vec2;
      const vec2Allocator = s.allocators.Vec2;
      const lightcycleCollisionBox =
        Lightcycle3ArenaCollisionSystem.getLightcycleCollisionObject(
          lightcycleEntity, lightcycleComponents.lightcycle, tempVec2, vec2Allocator);
      Lightcycle3ArenaCollisionSystem.updateCollisionBox(
        lightcycleComponents.lightcycle, lightcycleCollisionBox.CollisionBox, tempVec2);

      //
      // Generate arena wall collisions
      //
      ecs.iterateComponents2(
          {}, ARENA_WALL_COMPONENT_QUERY, (arenaWallEntity, _, arenaWallComponents) => {
        const arenaWallCollisionObject =
          Lightcycle3ArenaCollisionSystem.getArenaWallCollisionObject(
            arenaWallEntity, arenaWallComponents.arenaWall, tempVec2, vec2Allocator);

        const arenaWallCollisions =
          getBoxPlaneCollision(
            lightcycleCollisionBox.CollisionBox,
            arenaWallCollisionObject.CollisionPlane,
            tempVec2,
            vec2Allocator);

        arenaWallCollisions?.forEach((collision) => {
          s.collisionsList.Collisions.push({
            ArenaWallEntity: arenaWallEntity,
            LightcycleEntity: lightcycleEntity,
            ...collision
          });
        });
      });

      //
      // Generate lightcycle wall collisions
      //
      ecs.iterateComponents2(
          {},
          LIGHTCYCLE_WALL_COMPONENT_QUERY,
          (lightcycleWallEntity, _, lightcycleWallComponents) => {
        const lightcycleWallCollisionObject =
          Lightcycle3ArenaCollisionSystem.getLightcycleWallCollisionObject(
            lightcycleWallEntity, lightcycleWallComponents.lightcycleWall, vec2Allocator);
        lightcycleWallCollisionObject.TimeToActivation -= msDt / 1000;
        if (lightcycleWallCollisionObject.TimeToActivation > 0) return;

        const lightcycleWallCollisions =
          getBoxLineCollision(
            lightcycleCollisionBox.CollisionBox,
            lightcycleWallCollisionObject.CollisionLine,
            tempVec2,
            vec2Allocator);

        lightcycleWallCollisions?.forEach((collision) => {
          s.collisionsList.Collisions.push({
            CycleWallEntity: lightcycleWallEntity,
            LightcycleEntity: lightcycleEntity,
            ...collision
          });
        });
      });
    });

    // TODO (sessamekesh): At this point, all pending collisions should be loaded. Resolve them.
    // Resolve each collision on each lightcycle.
    ecs.withSingletons(SINGLETON_QUERY, (s) => {
      const byLightcycle = new Map<Entity, LightcycleCollisionRecord[]>();
      s.collisionsList.Collisions.forEach((collision) => {
        let records = byLightcycle.get(collision.LightcycleEntity);
        if (records) records.push(collision);
        else byLightcycle.set(collision.LightcycleEntity, [collision]);
      });

      // Each collision moves both the front and rear wheel by some distance, determined by where
      //  along the lightcycle body the collision occurs. If there are multiple collisions, then
      //  the values are calculated, and the amount applied is the average of all penetrations
      //
      //  zone 1            zone 2                   zone 3
      // -------|----------------------------------|-------
      //    Front Wheel                       Rear Wheel
      //
      // Impacts against zone 1 apply no rear wheel movement, only front wheel rotation about rear
      // Impacts against zone 3 apply no front wheel movement, only rear wheel rotation about front
      // Impacts against the middle apply rotation to both, as a lerp of where they were in middle
      //
      // Applying rotations:
      // - Same rotation is just flat movement
      // - Extra rotation moves along circle centered around rotation point away from thing
      s.tempAllocators.Vec2.get(3, (backToFront, pushVec, backToFrontNormal) => {
        byLightcycle.forEach((recordList, lightcycleEntity) => {
          const lightcycleComponent = lightcycleEntity.getComponent(LightcycleComponent3)!;
          vec2.sub(
            backToFront,
            lightcycleComponent.RearWheelPosition.Value,
            lightcycleComponent.FrontWheelPosition.Value);
          vec2.normalize(backToFrontNormal, backToFront);
          MathUtils.findPerpendicularVec2(pushVec, backToFrontNormal);
          let lateralMotion = 0;
          let frontRotation = 0;
          let rearRotation = 0;
          recordList.forEach((record) => {
            const {front, rear, lateral} =
              Lightcycle3ArenaCollisionSystem.getLightcycleCollisionImpactEffect(
                lightcycleComponent,
                backToFront,
                backToFrontNormal,
                pushVec,
                record.CollisionPoint.Value,
                record.CollisionNormal.Value,
                record.CollisionDepth,
                s.tempAllocators.Vec2);
            frontRotation += (front / recordList.length);
            rearRotation += (rear / recordList.length);
            lateralMotion += (lateral / recordList.length);
          });

          // Lateral motion is easy, because it's not split between tires.
          vec2.scaleAndAdd(
            lightcycleComponent.FrontWheelPosition.Value,
            lightcycleComponent.FrontWheelPosition.Value,
            backToFrontNormal,
            lateralMotion);
          vec2.scaleAndAdd(
            lightcycleComponent.RearWheelPosition.Value,
            lightcycleComponent.RearWheelPosition.Value,
            backToFrontNormal,
            lateralMotion);
          // For now, just apply motion to both the front and rear tires, and then adjust the rear
          //  tire to be the correct distance behind the front. There's probably a better way.
          vec2.scaleAndAdd(
            lightcycleComponent.FrontWheelPosition.Value,
            lightcycleComponent.FrontWheelPosition.Value,
            pushVec,
            frontRotation);
          vec2.scaleAndAdd(
            lightcycleComponent.RearWheelPosition.Value,
            lightcycleComponent.RearWheelPosition.Value,
            pushVec,
            rearRotation);

          // Pull rear wheel towards front wheel to be correct distance away
          MathUtils.nudgeToDistance2(
            lightcycleComponent.RearWheelPosition.Value,
            lightcycleComponent.FrontWheelPosition.Value,
            lightcycleComponent.RearWheelPosition.Value,
            BACK_WHEEL_OFFSET,
            s.tempAllocators.Vec2);

          // How much did the bike rotate? If more than 20 degrees / second, set rotation to forward
          //  plus 20 degrees in the same direction of rotation.
          const angle = MovementUtils.findOrientationBetweenPoints2(
            lightcycleComponent.RearWheelPosition.Value,
            lightcycleComponent.FrontWheelPosition.Value);
          lightcycleComponent.FrontWheelRotation = angle;
        });
      });
    });
  }

  private static getArenaWallCollisionObject(
      entity: Entity,
      arenaWall: ArenaWallComponent,
      tempVec2: TempGroupAllocator<vec2>,
      vec2Allocator: LifecycleOwnedAllocator<vec2>): ArenaWallCollisionComponent {
    let component = entity.getComponent(ArenaWallCollisionComponent);
    if (!component) {
      component = tempVec2.get(2, (tangent, pt1) => {
        const normal = vec2Allocator.get();
        vec2.set(
          tangent,
          (arenaWall.LineSegment.x1 - arenaWall.LineSegment.x0),
          (arenaWall.LineSegment.y1 - arenaWall.LineSegment.y0));

        MathUtils.findPerpendicularVec2(normal.Value, tangent);
        vec2.normalize(normal.Value, normal.Value);
        vec2.set(pt1, arenaWall.LineSegment.x0, arenaWall.LineSegment.y0);

        // This formula of finding a normal and distance based on a position works fine (distance
        //  equals a point on the plane dotted with the plane normal) if you don't care which
        //  direction the plane faces, but in this case we care that it points towards the origin.
        // So: (ZeroVec - pt) * n > 0
        // So: pt * n < 0
        // If that inequality is false (i.e., pt * n > 0), then the plane is pointing in the wrong
        //  direction.
        // To fix that, negate both the plane normal and the distance constant - this gives the same
        //  plane, but pointing in the opposite direction.
        // It took me a solid hour to figure that out because I was coding at 2:00 AM again :-(
        let d = vec2.dot(pt1, normal.Value);
        if (d > 0) {
          vec2.scale(normal.Value, normal.Value, -1);
          d *= -1;
        }
        const plane = new CollisionPlane(normal, d);

        entity.addListener('destroy', () => {
          normal.ReleaseFn();
        });

        return entity.addComponent(ArenaWallCollisionComponent, plane);
      });
    }
    return component;
  }

  private static getLightcycleWallCollisionObject(
      entity: Entity,
      lightcycleWall: WallComponent2,
      vec2Allocator: LifecycleOwnedAllocator<vec2>): WallCollisionComponent {
    let component = entity.getComponent(WallCollisionComponent);
    if (!component) {
      const pt1 = vec2Allocator.get();
      const pt2 = vec2Allocator.get();
      vec2.copy(pt1.Value, lightcycleWall.Corner1.Value);
      vec2.copy(pt2.Value, lightcycleWall.Corner2.Value);
      const line = new CollisionLine(pt1, pt2);
      entity.addListener('destroy', () => {
        pt1.ReleaseFn();
        pt2.ReleaseFn();
      });
      component = entity.addComponent(WallCollisionComponent, line, 0.55);
    }
    return component;
  }

  private static getLightcycleCollisionObject(
      entity: Entity,
      lightcycle: LightcycleComponent3,
      tempVec2: TempGroupAllocator<vec2>,
      vec2Allocator: LifecycleOwnedAllocator<vec2>): Lightcycle3CollisionComponent {
    let component = entity.getComponent(Lightcycle3CollisionComponent);
    if (!component) {
      const collisionBox = tempVec2.get(2, (origin, halfSize) => {
        vec2.lerp(
          origin, lightcycle.FrontWheelPosition.Value, lightcycle.RearWheelPosition.Value, 0.5);
        // TODO (sessamekesh): Adjust these bounds to be correct!
        vec2.set(halfSize, 1.15, (BACK_WHEEL_OFFSET + 0.5) / 2);
        // TODO (sessamekesh): I don't know if this is correct either?
        const rotation =
          MovementUtils.findOrientationBetweenPoints2(
            lightcycle.FrontWheelPosition.Value, lightcycle.RearWheelPosition.Value);
        return CollisionBox.create(origin, halfSize, rotation, tempVec2, vec2Allocator);
      });
      entity.addListener('destroy', () => collisionBox.destroy());
      component = entity.addComponent(Lightcycle3CollisionComponent, collisionBox);
    }
    return component;
  }

  private static updateCollisionBox(
      lightcycle: LightcycleComponent3,
      collisionBox: CollisionBox,
      tempVec2: TempGroupAllocator<vec2>) {
    tempVec2.get(1, (origin) => {
      vec2.lerp(
        origin, lightcycle.FrontWheelPosition.Value, lightcycle.RearWheelPosition.Value, 0.5);
      // TODO (sessamekesh): I don't know if this is correct either?
      const rotation =
        MovementUtils.findOrientationBetweenPoints2(
          lightcycle.FrontWheelPosition.Value, lightcycle.RearWheelPosition.Value);
      collisionBox.update({ newRotation: rotation, newOrigin: origin }, tempVec2);
    });
  }

  private static getLightcycleCollisionImpactEffect(
      lightcycle: LightcycleComponent3,
      backWheelToFrontWheel: vec2,
      backWheelToFrontWheelNormal: vec2,
      outVec: vec2,
      impactPoint: vec2,
      normal: vec2,
      depth: number,
      tempVec2: TempGroupAllocator<vec2>): {front: number, rear: number, lateral: number} {
    return tempVec2.get(1, (backWheelToCollisionPoint) => {
      const backWheelToFrontWheelLength = vec2.len(backWheelToFrontWheel);
      vec2.sub(backWheelToCollisionPoint, impactPoint, lightcycle.RearWheelPosition.Value);
      const projectionPointDistance =
        vec2.dot(backWheelToFrontWheelNormal, backWheelToCollisionPoint);
      // t: 0 for back wheel, 1 for front wheel, something in the middle for a mix
      const t = Math.max(0, Math.min(1, projectionPointDistance / backWheelToFrontWheelLength));

      // TODO (sessamekesh): Split up collision into lateral and rotational movement components
      const lateralComponent = vec2.dot(backWheelToFrontWheelNormal, normal);
      const outComponent = vec2.dot(outVec, normal);

      return {
        lateral: lateralComponent * depth,
        front: outComponent * (1 - t) * depth,
        rear: outComponent * t * depth,
      };
    });
  }
}
