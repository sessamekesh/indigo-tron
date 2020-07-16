import { OwnedResource, LifecycleOwnedAllocator, TempGroupAllocator } from "@libutil/allocator";
import { vec2 } from "gl-matrix";
import { CollisionBox } from "./collisionbox";
import { MathUtils } from "@libutil/mathutils";
import { MovementUtils } from "@libgamemodel/utilities/movementutils";

/**
 * Physics representation of a lightcycle.
 *
 * Contains a point for the front and rear wheel, which is
 *  used when updating the lightcycle. It also contains logic for applying the constraint that keeps
 *  the front and rear wheels at the correct distance from each other.
 * Data required for collision detection and resolution are also present here.
 *
 * This should be a plain-old-data class, though some utility methods are added for convinience.
 *
 * https://www.toptal.com/game/video-game-physics-part-i-an-introduction-to-rigid-body-dynamics has
 *  a delightful coverage of all the concepts covered here.
 * See https://www.toptal.com/game/video-game-physics-part-i-an-introduction-to-rigid-body-dynamics
 *  for a nice coverage on calculating the mass and moment of inertia for an object.
 *  https://en.wikipedia.org/wiki/List_of_moments_of_inertia also has a nice cheat sheet
 */
export class LightcycleBody {
  private constructor(
    public readonly frontWheelPos: OwnedResource<vec2>,
    public readonly rearWheelPos: OwnedResource<vec2>,
    public readonly distanceBetweenWheels: number,
    public frontWheelOrientation: number,
    public readonly collisionBox: CollisionBox,

    public readonly invMass: number, // in kg (inverse)
    public readonly invInertia: number, // in kg*m^2 (inverse)

    public frontWheelVelocity: number, // in m/s

    public drivingForce: number, // in N
    public windResistanceCoefficient: number // in N/(m/s) - how much wind resistance as a factor of speed?
  ) {}

  static create(
      vec2Allocator: LifecycleOwnedAllocator<vec2>,
      tempVec2: TempGroupAllocator<vec2>,
      frontWheelPos: vec2,
      rearWheelPos: vec2,
      frontWheelOrientation: number,
      collisionBoxWidth: number,
      collisionBoxFrontRearPadding: number,
      mass: number,
      maxAcceleration: number,
      maxSpeed: number) {
    const frontWheel = vec2Allocator.get();
    const rearWheel = vec2Allocator.get();

    if (mass === 0) {
      throw new Error('Expected non-zero mass and inertia');
    }

    vec2.copy(frontWheel.Value, frontWheelPos);
    vec2.copy(rearWheel.Value, rearWheelPos);

    // Driving force: apply Newton's second law of motion (F=ma) given the maximum acceleration
    //  given to find the force that should be applied every frame.
    const drivingForce = mass * maxAcceleration;

    // Maximum speed is the speed such that WindForce = DrivingForce
    // DrivingForce = WindResistanceCoefficient * MaximumVelocity
    const windResistanceCoefficient = drivingForce / maxSpeed;

    const distanceBetweenWheels = vec2.distance(frontWheel.Value, rearWheel.Value);
    if (distanceBetweenWheels <= 0) {
      throw new Error('Expected distance bewteen wheels to be greater than 0');
    }

    const collisionBoxHeight = distanceBetweenWheels + collisionBoxFrontRearPadding * 2;
    const collisionBox = tempVec2.get(3, (origin, halfSize, toFrontWheel) => {
      vec2.lerp(origin, frontWheel.Value, rearWheel.Value, 0.5);
      vec2.set(halfSize, collisionBoxWidth / 2, collisionBoxHeight / 2);
      vec2.sub(toFrontWheel, frontWheelPos, rearWheelPos);
      const rotation = Math.atan2(toFrontWheel[0], toFrontWheel[1]);
      return CollisionBox.create(vec2Allocator, tempVec2, origin, halfSize, rotation);
    });

    return new LightcycleBody(
      frontWheel, rearWheel, distanceBetweenWheels, frontWheelOrientation, collisionBox,
      1/mass,
      (1/12) * mass * (collisionBoxWidth * collisionBoxWidth + collisionBoxHeight * collisionBoxHeight),
      /* velocity */ 0, drivingForce, windResistanceCoefficient);
  }

  destroy() {
    this.frontWheelPos.ReleaseFn();
    this.rearWheelPos.ReleaseFn();
  }

  setSteering(rot: number) {
    this.frontWheelOrientation = rot;
  }

  getSteering() {
    return this.frontWheelOrientation;
  }

  getFrontWheelPos(o: vec2) {
    vec2.copy(o, this.frontWheelPos.Value);
  }

  getBodyPos(o: vec2) {
    vec2.copy(o, this.frontWheelPos.Value);
  }

  getRearWheelPos(o: vec2) {
    vec2.copy(o, this.rearWheelPos.Value);
  }

  getBodyOrientation() {
    return MathUtils.clampAngle(this.collisionBox.rotation);
  }

  /**
   * Apply forces to the lightcycle object, integrate to find velocity, integrate to find frontWheelPosition
   * @param {number} dt time in seconds that has elapsed
   */
  integrate(dt: number, tempVec2: TempGroupAllocator<vec2>) {
    const forwardForce =
      Math.max(this.drivingForce - this.windResistanceCoefficient * this.frontWheelVelocity, 0);
    const forwardAccleration = forwardForce * this.invMass;
    this.frontWheelVelocity += forwardAccleration * dt;
    tempVec2.get(1, (newMovement) => {
      const x = Math.sin(this.frontWheelOrientation);
      const y = Math.cos(this.frontWheelOrientation);
      vec2.set(newMovement, x * this.frontWheelVelocity * dt, y * this.frontWheelVelocity * dt);
      vec2.add(this.frontWheelPos.Value, this.frontWheelPos.Value, newMovement);
    });

    // TODO (sessamekesh): There is a bug, exposed here (but not caused here), that causes the
    //  bike to update as if it is being driven backwards. What the hell?
    MathUtils.nudgeToDistance2(
      this.rearWheelPos.Value,
      this.frontWheelPos.Value,
      this.rearWheelPos.Value,
      this.distanceBetweenWheels,
      tempVec2);
    const newOrientation = MovementUtils.findOrientationBetweenPoints2(
      this.frontWheelPos.Value, this.rearWheelPos.Value);
    vec2.lerp(
      this.collisionBox.origin.Value, this.frontWheelPos.Value, this.rearWheelPos.Value, 0.5);
    this.collisionBox.rotation = newOrientation;
    this.collisionBox.updateAABB(tempVec2);
  }
}
