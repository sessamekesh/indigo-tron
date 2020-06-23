import { ECSSystem } from "@libecs/ecssystem";
import { ECSManager } from "@libecs/ecsmanager";
import { CameraRig5Component } from "./camerarig5.component";
import { LightcycleComponent2 } from "@libgamemodel/lightcycle/lightcycle.component";
import { LightcycleUtils } from "@libgamemodel/lightcycle/lightcycleutils";
import { LightcycleSteeringStateComponent } from "@libgamemodel/lightcycle/lightcyclesteeringstate.component";
import { MathAllocatorsComponent } from "@libgamemodel/components/commoncomponents";
import { vec3 } from "gl-matrix";
import { PlaneAbsoluteConstraintComponent } from "@libgamemodel/physics/planeabsoluteconstraint.component";
import { TempGroupAllocator } from "@libutil/allocator";
import { MathUtils } from "@libutil/mathutils";
import { SceneModeUtil } from "@libgamemodel/scenemode/scenemodeutil";
import { Mat4TransformAddon } from "@libgamemodel/../libscenegraph/scenenodeaddons/mat4transformaddon";

export class CameraRig5System extends ECSSystem {
  start() { return true; }

  update(ecs: ECSManager, msDt: number) {
    if (SceneModeUtil.isPaused(ecs)) return;

    const {
      Circle3: tempCircle3Allocator,
      Vec3: tempVec3Allocator,
    } = ecs.getSingletonComponentOrThrow(MathAllocatorsComponent);

    ecs.iterateComponents([CameraRig5Component], (cameraRigEntity, cameraRigComponent) => {
      const lightcycleEntity = cameraRigComponent.CarEntity;
      const lightcycleComponent = lightcycleEntity.getComponent(LightcycleComponent2);
      const steeringComponent = lightcycleEntity.getComponent(LightcycleSteeringStateComponent);

      if (!lightcycleComponent || !steeringComponent) {
        // TODO (sessamekesh): Log the error here against some sort of telemetry
        return;
      }

      tempVec3Allocator.get(
        11,
        (leadPosition, followPosition, lightcyclePos, toLead, toFollow, goalPos, goalLookAt,
            actualPos, actualLookAt, newPos, newLookAt) => {
          LightcycleUtils.getApproximatePositionInFuture(
            leadPosition, lightcycleComponent, steeringComponent, cameraRigComponent.LeadCurveTime,
            tempVec3Allocator, tempCircle3Allocator);

          // This is a bit of a hack - find the mirror follow position, or a position as if the
          //  bike had been steering in the opposite direction.
          const adjustedSteering: LightcycleSteeringStateComponent = {
            ...steeringComponent,
            SteeringStrength: -steeringComponent.SteeringStrength,
          };
          LightcycleUtils.getApproximatePositionInFuture(
            followPosition, lightcycleComponent, adjustedSteering,
            -cameraRigComponent.FollowCurveTime, tempVec3Allocator, tempCircle3Allocator);

          lightcycleComponent.BodySceneNode.getAddon(Mat4TransformAddon).getPos(lightcyclePos);
          vec3.sub(toLead, leadPosition, lightcyclePos);
          vec3.normalize(toLead, toLead);
          vec3.sub(toFollow, followPosition, lightcyclePos);
          vec3.normalize(toFollow, toFollow);

          vec3.scaleAndAdd(goalLookAt, lightcyclePos, toLead, cameraRigComponent.LeadDistance);
          vec3.scaleAndAdd(goalPos, lightcyclePos, toFollow, cameraRigComponent.FollowDistance);

          goalPos[1] = cameraRigComponent.CameraHeight;
          goalLookAt[1] = cameraRigComponent.LookAtHeight;

          this.adjustPosForWalls(
            ecs, goalPos, tempVec3Allocator, cameraRigComponent.WallCollisionRadius);

          cameraRigComponent.Camera.lookAt(actualLookAt);
          cameraRigComponent.Camera.pos(actualPos);

          this.findActualValue(
            newPos, goalPos, actualPos, cameraRigComponent.GoalApproachMinVelocity,
            cameraRigComponent.GoalApproachMaxVelocity, cameraRigComponent.GoalApproachMaxDistance,
            msDt / 1000, tempVec3Allocator);
          this.findActualValue(
            newLookAt, goalLookAt, actualLookAt, cameraRigComponent.GoalApproachMinVelocity,
            cameraRigComponent.GoalApproachMaxVelocity, cameraRigComponent.GoalApproachMaxDistance,
            msDt / 1000, tempVec3Allocator);

          cameraRigComponent.Camera.setPos(newPos);
          cameraRigComponent.Camera.setLookAt(newLookAt);
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
