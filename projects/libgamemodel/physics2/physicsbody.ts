import { OwnedResource, LifecycleOwnedAllocator, TempGroupAllocator } from "@libutil/allocator";
import { vec2 } from "gl-matrix";

/**
 * Encapsulate information about a single physics body - center of mass position, orientation,
 *  velocity, rotation, mass, and inertial tensor.
 * Notice: SI units are used because they're _much_ easier to deal with for mathematics and science.
 * If you're a fellow American, get used to them - for human-scale mass and length, they're not too
 *  hard to build a nice intuition for, and the conversions are great.
 * https://www.toptal.com/game/video-game-physics-part-i-an-introduction-to-rigid-body-dynamics has
 *  a delightful coverage of all the concepts covered here.
 */
export class PhysicsBody {
  constructor(
    // Linear spatial data
    private position: OwnedResource<vec2>, // meters
    private velocity: OwnedResource<vec2>, // meters / second
    private accumulatedForce: OwnedResource<vec2>, // Newtons (kg*meters / second^2)
    // Rotational spatial data
    private rotation: number, // radians
    private angularVelocity: number, // radians / second
    private accumulatedTorque: number, // radians / second^2
    // For Newton's second law of motion
    private inverseMass: number, // kilograms (inverted)
    private inverseInertiaTensor: number /* kilograms * meters^2 (inverted) */) {}

  static Inverse(input: number) {
    if (input === 0) {
      return 0;
    }
    return 1 / input;
  }

  clearForcesAndTorque() {
    vec2.set(this.accumulatedForce.Value, 0, 0);
    this.accumulatedTorque = 0;
  }

  // @param {vec2} point of force application in world space meters
  // @param {vec2} force to apply to body in Newtons ( kg*m/s^2 )
  applyForceAtPoint(point: vec2, force: vec2, tempVec2: TempGroupAllocator<vec2>,) {
    tempVec2.get(1, (toPoint) => {
      vec2.sub(toPoint, point, this.position.Value);
      vec2.add(this.accumulatedForce.Value, this.accumulatedForce.Value, force);
      this.accumulatedTorque += toPoint[0] * force[1] - toPoint[1] * force[0];
    });
  }

  // Integrate
  // @param {number} time in seconds over which to update the rigid body simulation
  integrateOverTimestep(time: number, tempVec2: TempGroupAllocator<vec2>) {
    tempVec2.get(1, (linearAcceleration /* in m/s^2 */) => {
      // Newton's second law of motion: force = mass * acceleration
      // We have force, we need acceleration: acceleration = force / mass = force * inverseMass
      vec2.scale(linearAcceleration, this.accumulatedForce.Value, this.inverseMass);

      // Torque is similar: torque = momentOfInertia * angularAcceleration
      // We have the torque, so the angular acceleration: angAcc = torque * invMomentOfInertia
      const angularAcceleration /* rad/s^2 */ = this.accumulatedTorque * this.inverseInertiaTensor;

      // Without detailed information about the simulation, we are limited to running a Riemann sums
      //  approximation to find the change in velocity for a frame, and from the updated velocity
      //  the change in position for a frame. Notice: A trapezoidal approximation, or midpoint
      //  approximation would be much more accurate in the case strong forces or high velocities.
      vec2.scaleAndAdd(
        this.velocity.Value,
        this.velocity.Value,
        linearAcceleration,
        time);
      this.angularVelocity += angularAcceleration * time;

      vec2.scaleAndAdd(
        this.position.Value,
        this.position.Value,
        this.velocity.Value,
        time);
      this.rotation += this.angularVelocity * time;
    });
  }

  getPosition(o: vec2) {
    vec2.copy(o, this.position.Value);
  }

  getRotation() {
    return this.rotation;
  }

  // See https://www.toptal.com/game/video-game-physics-part-i-an-introduction-to-rigid-body-dynamics
  //  for a nice coverage on calculating the mass and moment of inertia for an object.
  // https://en.wikipedia.org/wiki/List_of_moments_of_inertia also has a nice cheat sheet
  // Moment of inertia I_xz is taken (e.g., height axis is ignored)
  // @param {number} density given in kg/m3 of the cube in question
  // @param {number} cubeHeight in m along the (ignored) Y axis of the cube used
  // @param {number} width in m
  // @param {number} height in m
  static generateBodyFromSquareProjectionOfCube(
      density: number, cubeHeight: number, width: number, height: number,
      vec2Allocator: LifecycleOwnedAllocator<vec2>): PhysicsBody {
    const bodyMass /* kg */ = density * cubeHeight * width * height;
    const I_xz /* kg*m2 */ = (1/12) * bodyMass * (width * width + height * height);
    const pos = vec2Allocator.get(); vec2.set(pos.Value, 0, 0);
    const vel = vec2Allocator.get(); vec2.set(vel.Value, 0, 0);
    const force = vec2Allocator.get(); vec2.set(force.Value, 0, 0);

    return new PhysicsBody(
      pos, vel, force, 0, 0, 0, PhysicsBody.Inverse(bodyMass), PhysicsBody.Inverse(I_xz));
  }
}
