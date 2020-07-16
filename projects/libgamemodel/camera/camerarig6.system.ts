import { ECSSystem } from "@libecs/ecssystem";
import { ECSManager } from "@libecs/ecsmanager";
import { MathAllocatorsComponent } from "@libgamemodel/components/commoncomponents";
import { CameraRig5Component } from "./camerarig5.component";
import { LightcycleComponent3 } from "@libgamemodel/lightcycle3/lightcycle3.component";
import { LightcycleSteeringStateComponent } from "@libgamemodel/lightcycle3/lightcyclesteeringstate.component";
import { LightcycleUtils } from "@libgamemodel/lightcycle/lightcycleutils";
import { LightcycleDrivingStatsComponent } from "@libgamemodel/lightcycle3/lightcycledrivingstats.component";
import { vec3 } from "gl-matrix";
import { MathUtils } from "@libutil/mathutils";
import { PlaneAbsoluteConstraintComponent } from "@libgamemodel/physics/planeabsoluteconstraint.component";
import { TempGroupAllocator } from "@libutil/allocator";

const SINGLETON_QUERY = {
  tempAllocator: MathAllocatorsComponent,
};

const COMPONENT_QUERY = {
  cameraRig: CameraRig5Component,
};

export class CameraRig6System extends ECSSystem {
  start(ecs: ECSManager) {
    return this.expectSingletons(ecs, SINGLETON_QUERY, 'CameraRig6System');
  }

  update(ecs: ECSManager, msDt: number) {
    ecs.iterateComponents2(SINGLETON_QUERY, COMPONENT_QUERY, (e, s, c) => {
      const tempVec3 = s.tempAllocator.Vec3;
      const tempCircle3 = s.tempAllocator.Circle3;

      const lightcycleEntity = c.cameraRig.CarEntity;
      const lightcycleComponent = lightcycleEntity.getComponent(LightcycleComponent3);
      const driveStatsComponent = lightcycleEntity.getComponent(LightcycleDrivingStatsComponent);
      const steeringComponent = lightcycleEntity.getComponent(LightcycleSteeringStateComponent);

      if (!lightcycleComponent || !steeringComponent || !driveStatsComponent) {
        // TODO (sessamekesh): Error handling here
        return;
      }

      tempVec3.get(
        11,
        (leadPosition, followPosition, lightcyclePos, toLead, toFollow, goalPos, goalLookAt,
            actualPos, actualLookAt, newPos, newLookAt) => {

          LightcycleUtils.getApproximatePositionInFuture2(
            leadPosition, lightcycleComponent, steeringComponent, driveStatsComponent,
            msDt / 1000, tempVec3, tempCircle3);

            // This is a bit of a hack - find the mirror follow position, or a position as if the
          //  bike had been steering in the opposite direction.
          const adjustedSteering: LightcycleSteeringStateComponent = {
            ...steeringComponent,
            SteeringStrength: -steeringComponent.SteeringStrength,
          };
          LightcycleUtils.getApproximatePositionInFuture2(
            followPosition, lightcycleComponent, adjustedSteering, driveStatsComponent,
            -c.cameraRig.FollowCurveTime, tempVec3, tempCircle3);

          MathUtils.vec2ToVec3(lightcyclePos, lightcycleComponent.FrontWheelPosition.Value, 0);
          vec3.sub(toLead, leadPosition, lightcyclePos);
          vec3.normalize(toLead, toLead);
          vec3.sub(toFollow, followPosition, lightcyclePos);
          vec3.normalize(toFollow, toFollow);

          vec3.scaleAndAdd(goalLookAt, lightcyclePos, toLead, c.cameraRig.LeadDistance);
          vec3.scaleAndAdd(goalPos, lightcyclePos, toFollow, c.cameraRig.FollowDistance);

          goalPos[1] = c.cameraRig.CameraHeight;
          goalLookAt[1] = c.cameraRig.LookAtHeight;

          this.adjustPosForWalls(ecs, goalPos, tempVec3, c.cameraRig.WallCollisionRadius);

          c.cameraRig.Camera.lookAt(actualLookAt);
          c.cameraRig.Camera.pos(actualPos);

          this.findActualValue(
            newPos, goalPos, actualPos, c.cameraRig.GoalApproachMinVelocity,
            c.cameraRig.GoalApproachMaxVelocity, c.cameraRig.GoalApproachMaxDistance,
            msDt / 1000, tempVec3);
          this.findActualValue(
            newLookAt, goalLookAt, actualLookAt, c.cameraRig.GoalApproachMinVelocity,
            c.cameraRig.GoalApproachMaxVelocity, c.cameraRig.GoalApproachMaxDistance,
            msDt / 1000, tempVec3);

          c.cameraRig.Camera.setPos(newPos);
          c.cameraRig.Camera.setLookAt(newLookAt);
        });
    });
  }

  private adjustPosForWalls(
      ecs: ECSManager, goalPos: vec3, tempVec3: TempGroupAllocator<vec3>,
      wallCollisionRadius: number) {
    ecs.iterateComponents([PlaneAbsoluteConstraintComponent], (entity, planeConstraint) => {
      tempVec3.get(3, (closestPlanePoint, toClosestPlanePoint, planeNormal) => {
        planeConstraint.Plane.Value.getClosestPointOnPlane(closestPlanePoint, goalPos);
        vec3.sub(toClosestPlanePoint, closestPlanePoint, goalPos);
        planeConstraint.Plane.Value.getNormal(planeNormal);

        const distAlongNormal = vec3.dot(toClosestPlanePoint, planeNormal);
        if (distAlongNormal > wallCollisionRadius) {
          vec3.scaleAndAdd(
            /* o */ goalPos, goalPos, planeNormal, (distAlongNormal + wallCollisionRadius));
        }
      });
    });
  }

  private findActualValue(
      o: vec3, expected: vec3, actual: vec3, minVelocity: number, maxVelocity: number,
      maxDistance: number, dt: number, tempVec3: TempGroupAllocator<vec3>) {
    vec3.copy(o, actual);
    const distance = vec3.distance(expected, actual);
    if (distance < 1e-5) return;
    const velocity = MathUtils.lerp(minVelocity, maxVelocity, distance / maxDistance);
    const distAdjust = MathUtils.clamp(velocity * dt, 0, distance);

    tempVec3.get(1, (toExpected) => {
      vec3.sub(toExpected, expected, actual);
      vec3.normalize(toExpected, toExpected);
      vec3.scaleAndAdd(o, actual, toExpected, distAdjust);
    });
  }
}
