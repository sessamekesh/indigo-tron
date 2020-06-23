import { ECSSystem } from "@libecs/ecssystem";
import { ECSManager } from "@libecs/ecsmanager";
import { SceneNodeSpringForceComponent } from "./scenenodespringforce.component";
import { PositionComponent } from "./position.component";
import { ForceAccumulatorComponent } from "./forceaccumulator.component";
import { OwnedMathAllocatorsComponent, MathAllocatorsComponent } from "@libgamemodel/components/commoncomponents";
import { LifecycleOwnedAllocator, TempGroupAllocator, OwnedResource } from "@libutil/allocator";
import { vec3 } from "gl-matrix";
import { Entity } from "@libecs/entity";
import { VelocityComponent } from "./velocity.component";
import { PlaneMinDistanceSpringComponent } from "./planemindistancespring.component";
import { MassComponent } from "./masscomponent";
import { PlaneAbsoluteConstraintComponent } from "./planeabsoluteconstraint.component";
import { BoundingSphereConstraintComponent } from "./boundingsphereconstraint.component";
import { SceneModeUtil } from "@libgamemodel/scenemode/scenemodeutil";
import { ForceDampingComponent } from "./forcedamping.component";
import { Mat4TransformAddon } from "@libgamemodel/../libscenegraph/scenenodeaddons/mat4transformaddon";

export class UpdatePhysicsSystemConfigComponent {
  constructor(
    public UpdateTick: number, // in seconds
    public TimeSinceLastTick: number,
    public MaxCollisionResolutionIterations: number,
    public PositionErrorThreshold: number, // Maximum allowable position error in a resolution pass
    public VelocityErrorThreshold: number, // Maximum allowable velocity error in a resolution pass
  ) {}
}

interface ImpulseError {
  Velocity: number,
  Position: number,
};

function getMaxImpulseError(a: ImpulseError, b: ImpulseError): ImpulseError {
  return {
    Velocity: Math.max(a.Velocity, b.Velocity),
    Position: Math.max(a.Position, b.Position),
  };
}

function getZeroImpulseError(): ImpulseError {
  return {
    Position: 0,
    Velocity: 0,
  };
}

export class UpdatePhysicsSystem extends ECSSystem {
  start(ecs: ECSManager) {
    if (!ecs.getSingletonComponent(UpdatePhysicsSystemConfigComponent)) {
      console.error('Missing UpdatePhysicsSystemConfigComponent');
      return false;
    }
    if (!ecs.getSingletonComponent(OwnedMathAllocatorsComponent)) {
      console.error('Missing OwnedMathAllocatorsComponent');
      return false;
    }
    return true;
  }

  update(ecs: ECSManager, msDt: number) {
    if (SceneModeUtil.isPaused(ecs)) {
      return;
    }

    const dt = msDt / 1000;

    const config = ecs.getSingletonComponentOrThrow(UpdatePhysicsSystemConfigComponent);
    const { Vec3: vec3Allocator } = ecs.getSingletonComponentOrThrow(OwnedMathAllocatorsComponent);
    const { Vec3: tempVec3 } = ecs.getSingletonComponentOrThrow(MathAllocatorsComponent);

    config.TimeSinceLastTick += dt;
    while (config.TimeSinceLastTick > config.UpdateTick) {
      config.TimeSinceLastTick -= config.UpdateTick;

      this.clearOutForces(ecs);
      this.applyDampingForce(ecs, vec3Allocator, config.UpdateTick);
      this.applySceneNodeSpringForces(ecs, vec3Allocator, tempVec3);
      this.applyPlaneMinDistanceSpringForces(ecs, vec3Allocator, tempVec3);
      this.integrateForces(ecs, config.UpdateTick);
      this.integratePositions(ecs, config.UpdateTick);

      // Apply impulses. Those impulses may cause other impulses, so resolve in a loop until either
      //  some pre-determined maximum number of passes has elapsed, or until the error generated
      //  from these impulses is low enough to satisfy our system. A perfect system that is
      //  guaranteed to resolve all impulses in negligible time with no floating point error would
      //  have infinity maximum iterations, and zero as its error thresholds.
      for (let i = 0; i < config.MaxCollisionResolutionIterations; i++) {
        let impulseError = getZeroImpulseError();

        impulseError = getMaxImpulseError(
          impulseError,
          this.applyAbsolutePlaneBoundingSphereCollisions(ecs, dt, tempVec3));

        if (impulseError.Position <= config.PositionErrorThreshold
            && impulseError.Velocity <= config.VelocityErrorThreshold) {
          break;
        }
      }
    }
  }

  private clearOutForces(ecs: ECSManager) {
    ecs.iterateComponents([ForceAccumulatorComponent], (_, forceAccumulatorComponent) => {
      vec3.set(forceAccumulatorComponent.Force.Value, 0, 0, 0);
    });
  }

  private applyDampingForce(
      ecs: ECSManager, vec3Allocator: LifecycleOwnedAllocator<vec3>, dt: number) {
    ecs.iterateComponents(
        [VelocityComponent, ForceDampingComponent, MassComponent],
        (entity, velocityComponent, forceDampingComponent, massComponent) => {
      const forceAccumulator = this.getForceAccumulator(entity, vec3Allocator);
      // Cannot apply to static objects
      if (massComponent.InvMass === 0) return;
      vec3.scaleAndAdd(
        forceAccumulator.Force.Value,
        forceAccumulator.Force.Value,
        velocityComponent.Velocity.Value,
        -forceDampingComponent.Damping / (massComponent.InvMass * dt));
    });
  }

  private applySceneNodeSpringForces(
      ecs: ECSManager,
      vec3Allocator: LifecycleOwnedAllocator<vec3>,
      tempVec3: TempGroupAllocator<vec3>) {
    ecs.iterateComponents(
        [SceneNodeSpringForceComponent, PositionComponent],
        (entity, springForceComponent, positionComponent) => {
      const forceAccumulator = this.getForceAccumulator(entity, vec3Allocator);
      // Find the stretch/compression of the spring, and apply force as appropriate
      tempVec3.get(3, (goalPos, diff, direction) => {
        springForceComponent.TargetSceneNode.getAddon(Mat4TransformAddon).getPos(goalPos);
        vec3.sub(diff, positionComponent.Position.Value, goalPos);
        const springActualLength = vec3.length(diff);

        // Find the direction the spring is facing - impossible if spring is compressed near len 0
        if (springActualLength < 0.0001) {
          // Special case: Pick an arbitrary direction
          vec3.set(direction, 0, 1, 0);
        } else {
          vec3.normalize(direction, diff);
        }
        const springStretchOrCompression = springActualLength - springForceComponent.SpringLength;
        const force = springStretchOrCompression * springForceComponent.SpringConstant; // N
        vec3.scaleAndAdd(
          /* output */ forceAccumulator.Force.Value,
          forceAccumulator.Force.Value,
          direction,
          -force);
      });
    });
  }

  private applyPlaneMinDistanceSpringForces(
      ecs: ECSManager, vec3Allocator: LifecycleOwnedAllocator<vec3>, tempVec3: TempGroupAllocator<vec3>) {
    ecs.iterateComponents(
      [PlaneMinDistanceSpringComponent, PositionComponent],
      (entity, planeSpring, positionComponent) => {
    const forceAccumulator = this.getForceAccumulator(entity, vec3Allocator);
    tempVec3.get(2, (closestPlanePoint, planeNormal) => {
      planeSpring.Plane.Value.getClosestPointOnPlane(
        closestPlanePoint, positionComponent.Position.Value);
      const dist = vec3.distance(closestPlanePoint, positionComponent.Position.Value);
      const compression = planeSpring.MinDistance - dist;
      if (compression <= 0) return;
      const force = compression * planeSpring.SpringConstant; // N
      planeSpring.Plane.Value.getNormal(planeNormal);
      vec3.scaleAndAdd(
        /* output */ forceAccumulator.Force.Value,
        forceAccumulator.Force.Value,
        planeNormal,
        force);
    });
  });
  }

  private getForceAccumulator(entity: Entity, vec3Allocator: LifecycleOwnedAllocator<vec3>) {
    let forceAccumulator = entity.getComponent(ForceAccumulatorComponent);
    if (!forceAccumulator) {
      forceAccumulator = entity.addComponent(ForceAccumulatorComponent, vec3Allocator.get());
      vec3.set(forceAccumulator.Force.Value, 0, 0, 0);
      ForceAccumulatorComponent.attachLifecycle(entity);
    }
    return forceAccumulator;
  }

  private integrateForces(ecs: ECSManager, dt: number) {
    ecs.iterateComponents(
        [ForceAccumulatorComponent, VelocityComponent, MassComponent],
        (entity, force, velocity, mass) => {
      // Newton's second law of motion: Force = mass * acceleration
      // Definition of acceleration: acceleration = derivative of velocity with respect to time
      // Integration of constant acceleration: velocity = oldVelocity + acceleration * time
      // (1) acceleration = force / mass
      // (2) velocity += (force / mass) * time
      vec3.scaleAndAdd(
        velocity.Velocity.Value, velocity.Velocity.Value, force.Force.Value, mass.InvMass * dt);
    });
  }

  private integratePositions(ecs: ECSManager, dt: number) {
    // Definition of velocity: derivative of position with respect to time.
    // Integration of constant velocity: position = oldPosition + velocity * time
    ecs.iterateComponents(
        [VelocityComponent, PositionComponent],
        (entity, velocity, position) => {
      vec3.scaleAndAdd(
        position.Position.Value, position.Position.Value, velocity.Velocity.Value, dt);
    });
  }

  private applyAbsolutePlaneBoundingSphereCollisions(
      ecs: ECSManager, dt: number, tempVec3: TempGroupAllocator<vec3>): ImpulseError {
    let impulseError: ImpulseError = getZeroImpulseError();
    // Notice: This is O(n*m) on number of plane and number of bounding sphere constraints
    // This shouldn't be too bad for this application, but deserves a better treatment in a general
    //  purpose physics engine. Read up on "broadphase collision detection" for more information.
    ecs.iterateComponents([PlaneAbsoluteConstraintComponent], (_, planeConstraint) => {
      ecs.iterateComponents(
          [BoundingSphereConstraintComponent, PositionComponent, VelocityComponent],
          (_, boundingSphereConstraint, positionComponent, velocityComponent) => {
        tempVec3.get(2, (closestPlanePoint, planeNormal) => {
          planeConstraint.Plane.Value.getClosestPointOnPlane(
            closestPlanePoint, positionComponent.Position.Value);
          const distToWall = vec3.distance(positionComponent.Position.Value, closestPlanePoint);
          const collisionDistance = boundingSphereConstraint.Radius - distToWall;
          if (collisionDistance <= 0) return;

          planeConstraint.Plane.Value.getNormal(planeNormal);

          // Take away all velocity that is travelling into the constraint (no bouncing)
          const velocityIntoWall = vec3.dot(velocityComponent.Velocity.Value, planeNormal);
          vec3.scaleAndAdd(
            /* o */ velocityComponent.Velocity.Value,
            velocityComponent.Velocity.Value,
            planeNormal,
            -velocityIntoWall);

          vec3.scaleAndAdd(
            /* o */ positionComponent.Position.Value,
            positionComponent.Position.Value,
            planeNormal,
            collisionDistance);

          impulseError = getMaxImpulseError(impulseError, {
            Position: collisionDistance,
            Velocity: Math.max(velocityIntoWall, 0),
          });
        });
      });
    });

    return impulseError;
  }
}
