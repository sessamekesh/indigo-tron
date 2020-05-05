import { ECSManager } from "@libecs/ecsmanager";
import { Entity } from "@libecs/entity";
import { BasicCamera } from "./basiccamera";
import { SceneNodeFactory } from "@libutil/scene/scenenodefactory";
import { LightcycleComponent2 } from "@libgamemodel/lightcycle/lightcycle.component";
import { PhysicsUtil } from "@libgamemodel/physics/physics.util";
import { LifecycleOwnedAllocator, TempGroupAllocator } from "@libutil/allocator";
import { vec3 } from "gl-matrix";
import { LightcycleUtils } from "@libgamemodel/lightcycle/lightcycleutils";
import { LightcycleSteeringStateComponent } from "@libgamemodel/lightcycle/lightcyclesteeringstate.component";
import { Circle3 } from "@libutil/math/circle3";
import { Y_UNIT_DIR } from "@libutil/helpfulconstants";
import { SceneNodeSpringForceComponent } from "@libgamemodel/physics/scenenodespringforce.component";
import { BoundingSphereConstraintComponent } from "@libgamemodel/physics/boundingsphereconstraint.component";
import { CameraRig4Component } from "./camerarig4.component";

export class CameraRig4Util {
  static findPosLookAtForLightcycle(
      o_pos: vec3,
      o_la: vec3,
      lightcycle: LightcycleComponent2,
      steering: LightcycleSteeringStateComponent,
      leadDistance: number,
      followDistance: number,
      leadScale: number,
      followScale: number,
      cameraHeight: number,
      vec3Allocator: TempGroupAllocator<vec3>,
      circle3Allocator: TempGroupAllocator<Circle3>) {
    vec3Allocator.get(5, (prevPosition, futurePosition, pos, toPrev, toFuture) => {
      LightcycleUtils.getApproximatePositionInFuture(
        prevPosition,
        lightcycle, steering,
        -followDistance / lightcycle.Velocity,
        vec3Allocator, circle3Allocator);
      LightcycleUtils.getApproximatePositionInFuture(
        futurePosition,
        lightcycle, steering,
        leadDistance / lightcycle.Velocity,
        vec3Allocator, circle3Allocator);
      lightcycle.BodySceneNode.getPos(pos);
      vec3.sub(toPrev, prevPosition, pos);
      vec3.sub(toFuture, futurePosition, pos);
      vec3.normalize(toPrev, toPrev);
      vec3.normalize(toFuture, toFuture);

      vec3.scaleAndAdd(o_la, pos, toFuture, leadScale);
      vec3.scaleAndAdd(o_pos, pos, toPrev, followScale);
      vec3.scaleAndAdd(o_pos, o_pos, Y_UNIT_DIR, cameraHeight);
    });
  }

  static attachCameraRigToLightcycle(
      ecs: ECSManager,
      entity: Entity,
      camera: BasicCamera,
      leadDistance: number,
      followDistance: number,
      leadScale: number,
      followScale: number,
      height: number,
      boundingSphereSize: number,
      ownedVec3: LifecycleOwnedAllocator<vec3>,
      tempVec3: TempGroupAllocator<vec3>,
      tempCircle3: TempGroupAllocator<Circle3>,
      sceneNodeFactory: SceneNodeFactory): Entity|null {
    const lightcycleComponent = entity.getComponent(LightcycleComponent2);
    const steering = entity.getComponent(LightcycleSteeringStateComponent);
    if (!lightcycleComponent || !steering) return null;

    // Create the base entities and ownership relationships
    const positionEntity = ecs.createEntity();
    const lookAtEntity = ecs.createEntity();

    const cameraRigEntity = ecs.createEntity();
    cameraRigEntity.addListener('destroy', (e) => {
      positionEntity.destroy();
      lookAtEntity.destroy();
    });

    // Create scene nodes (notice: they are not attached)
    const goalPosSceneNode = sceneNodeFactory.createSceneNode();
    const goalLookAtSceneNode = sceneNodeFactory.createSceneNode();
    cameraRigEntity.addListener('destroy', () => {
      goalPosSceneNode.detach();
      goalLookAtSceneNode.detach();
    });

    tempVec3.get(2, (pos, la) => {
      CameraRig4Util.findPosLookAtForLightcycle(
        pos, la,
        lightcycleComponent, steering,
        leadDistance, followDistance,
        leadScale, followScale,
        height, tempVec3, tempCircle3);
      goalPosSceneNode.update({pos: pos});
      goalLookAtSceneNode.update({pos: la});

      const vel = vec3.fromValues(0, 0, 0);
      PhysicsUtil.attachBasicPhysicsComponents(positionEntity, pos, vel, 0.125, ownedVec3);
      PhysicsUtil.attachBasicPhysicsComponents(lookAtEntity, la, vel, 0.125, ownedVec3);
    });

    // Scene node spring forces
    positionEntity.addComponent(
      SceneNodeSpringForceComponent,
      /* length */ 0,
      /* k */ 300,
      /* target */ goalPosSceneNode);
    lookAtEntity.addComponent(
      SceneNodeSpringForceComponent,
      /* length */ 0,
      /* k */ 180,
      /* target */ goalLookAtSceneNode);

    // TODO (sessamekesh): Get the wall planes, and attach PlaneMinDistanceSpringComponents to them

    // Create bounding spheres that prevent wall clipping
    positionEntity.addComponent(BoundingSphereConstraintComponent, boundingSphereSize);
    lookAtEntity.addComponent(BoundingSphereConstraintComponent, boundingSphereSize);

    // Finally, actually attach the thing
    cameraRigEntity.addComponent(
      CameraRig4Component,
      camera,
      leadDistance,
      followDistance,
      followScale,
      leadScale,
      height,
      entity,
      positionEntity,
      lookAtEntity,
      goalPosSceneNode,
      goalLookAtSceneNode);

    return cameraRigEntity;
  }
}
