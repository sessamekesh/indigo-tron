import { Entity } from "@libecs/entity";
import { LightcycleComponent2 } from "@libgamemodel/lightcycle/lightcycle.component";
import { ECSManager } from "@libecs/ecsmanager";
import { CameraRig3Component } from "./camerarig3.component";
import { BasicCamera } from "./basiccamera";
import { SceneNodeFactory } from "@libutil/scene/scenenodefactory";
import { TempGroupAllocator, LifecycleOwnedAllocator } from "@libutil/allocator";
import { vec3 } from "gl-matrix";
import { BoundingSphereConstraintComponent } from "@libgamemodel/physics/boundingsphereconstraint.component";
import { PhysicsUtil } from "@libgamemodel/physics/physics.util";
import { SceneNodeSpringForceComponent } from "@libgamemodel/physics/scenenodespringforce.component";

export class CameraRig3Util {
  // TODO (sessamekesh): Come up with a better way to do a camera, this is entirely too janky!
  static attachCameraRigToLightcycle(
      ecs: ECSManager,
      entity: Entity,
      camera: BasicCamera,
      lookAtFrontOfLightcycle: number,
      positionBehindLightcycle: number,
      height: number,
      sceneNodeFactory: SceneNodeFactory,
      vec3Allocator: TempGroupAllocator<vec3>,
      ownedVec3: LifecycleOwnedAllocator<vec3>,
      boundingSphereSize: number): Entity|null {
    const lightcycleComponent = entity.getComponent(LightcycleComponent2);
    if (!lightcycleComponent) {
      return null;
    }

    // Create the base entities and ownership relationships
    const positionEntity = ecs.createEntity();
    const lookAtEntity = ecs.createEntity();

    const cameraRigEntity = ecs.createEntity();
    CameraRig3Component.attachWithOwnership(cameraRigEntity, camera, positionEntity, lookAtEntity);

    // Create scene nodes for both the goal position and the goal look at locations
    const goalPositionSceneNode = vec3Allocator.get(1, (posOffset) => {
      vec3.set(posOffset, 0, height, -positionBehindLightcycle);
      return sceneNodeFactory.createSceneNode({ pos: posOffset });
    });
    goalPositionSceneNode.attachToParent(lightcycleComponent.BodySceneNode);
    positionEntity.addListener('destroy', (e) => goalPositionSceneNode.detach());

    const goalLookAtSceneNode = vec3Allocator.get(1, (lookAtOffset) => {
      vec3.set(lookAtOffset, 0, 0, lookAtFrontOfLightcycle);
      return sceneNodeFactory.createSceneNode({ pos: lookAtOffset });
    });
    goalLookAtSceneNode.attachToParent(lightcycleComponent.BodySceneNode);
    lookAtEntity.addListener('destroy', (e) => goalLookAtSceneNode.detach());

    // Create the actual positions/velocities for the pos/look at entities
    vec3Allocator.get(2, (pos, vel) => {
      goalPositionSceneNode.getPos(pos);
      vec3.set(vel, 0, 0, 0);
      PhysicsUtil.attachBasicPhysicsComponents(positionEntity, pos, vel, 0.125, ownedVec3);
    });

    vec3Allocator.get(2, (pos, vel) => {
      goalLookAtSceneNode.getPos(pos);
      vec3.set(vel, 0, 0, 0);
      PhysicsUtil.attachBasicPhysicsComponents(lookAtEntity, pos, vel, 0.125, ownedVec3);
    });

    // Scene node spring forces
    positionEntity.addComponent(
      SceneNodeSpringForceComponent,
      /* length */ 0,
      /* k */ 300,
      /* target */ goalPositionSceneNode);
    lookAtEntity.addComponent(
      SceneNodeSpringForceComponent,
      /* length */ 0,
      /* k */ 300,
      /* target */ goalLookAtSceneNode);

    // TODO (sessamekesh): Get the wall planes, and attach PlaneMinDistanceSpringComponents to them

    // Create bounding spheres that prevent wall clipping
    positionEntity.addComponent(BoundingSphereConstraintComponent, boundingSphereSize);
    lookAtEntity.addComponent(BoundingSphereConstraintComponent, boundingSphereSize);

    return cameraRigEntity;
  }
}
