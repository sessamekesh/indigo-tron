import { OwnedResource, TempGroupAllocator, LifecycleOwnedAllocator } from "@libutil/allocator";
import { vec2 } from "gl-matrix";
import { AABB2 } from './aabb';

export enum Sign {
  POSITIVE,
  NEGATIVE,
}

export class CollisionBox {
  private constructor(
    private Origin: OwnedResource<vec2>,
    private HalfSize: OwnedResource<vec2>,
    private Rotation: number,
    private aabb: AABB2) {}

  broadCollisionCheck(aabb: AABB2): boolean;
  broadCollisionCheck(box: CollisionBox): boolean;
  broadCollisionCheck(aabb: AABB2|CollisionBox): boolean {
    if (aabb instanceof CollisionBox) {
      return AABB2.aabbColliding(this.aabb, aabb.aabb);
    }
    return AABB2.aabbColliding(this.aabb, aabb);
  }

  origin(o: vec2) {
    vec2.copy(o, this.Origin.Value);
  }

  halfSize(o: vec2) {
    vec2.copy(o, this.HalfSize.Value);
  }

  rotation() {
    return this.Rotation;
  }

  update(
      options: { newOrigin?: vec2, newHalfSize?: vec2, newRotation: number },
      tempVec2: TempGroupAllocator<vec2>) {
    let aabbDirty = false;
    if (options.newOrigin) {
      vec2.copy(this.Origin.Value, options.newOrigin);
      aabbDirty = true;
    }

    if (options.newHalfSize) {
      vec2.copy(this.HalfSize.Value, options.newHalfSize);
      aabbDirty = true;
    }

    if (options.newRotation != null) {
      this.Rotation = options.newRotation;
      aabbDirty = true;
    }

    this.aabb = CollisionBox.createAABB_(
      this.Origin.Value, this.HalfSize.Value, this.Rotation, tempVec2);
  }

  static create(
      origin: vec2,
      halfSize: vec2,
      rotation: number,
      tempVec2: TempGroupAllocator<vec2>,
      vec2Allocator: LifecycleOwnedAllocator<vec2>): CollisionBox {
    if (Math.abs(halfSize[0]) < 0.0001 ||
        Math.abs(halfSize[1]) < 0.0001 ||
        Math.abs(halfSize[2]) < 0.0001) {
      throw new Error(`Cannot create box with half size dimension of 0: ${halfSize}`);
    }

    const ownedOrigin = vec2Allocator.get();
    const ownedHalfSize = vec2Allocator.get();
    vec2.copy(ownedOrigin.Value, origin);
    vec2.copy(ownedHalfSize.Value, halfSize);

    const aabb = CollisionBox.createAABB_(origin, halfSize, rotation, tempVec2);

    return new CollisionBox(ownedOrigin, ownedHalfSize, rotation, aabb);
  }

  static getPointPosition(
      o: vec2,
      origin: vec2,
      halfSize: vec2,
      rotation: number,
      tempVec2: TempGroupAllocator<vec2>,
      xSign: Sign,
      ySign: Sign) {
    const signVal = (sign: Sign) => (sign === Sign.POSITIVE) ? 1 : -1;
    tempVec2.get(1, (cornerPos) => {
      vec2.set(
        cornerPos,
        origin[0] + halfSize[0] * signVal(xSign),
        origin[1] + halfSize[1] * signVal(ySign));
      vec2.rotate(o, cornerPos, origin, rotation);
    });
  }

  private static createAABB_(
      origin: vec2, halfSize: vec2, rotation: number, tempVec2: TempGroupAllocator<vec2>): AABB2 {
    return tempVec2.get(4, (ul, ur, ll, lr) => {
      CollisionBox.getPointPosition(
        ul, origin, halfSize, rotation, tempVec2, Sign.POSITIVE, Sign.POSITIVE);
      CollisionBox.getPointPosition(
        ur, origin, halfSize, rotation, tempVec2, Sign.POSITIVE, Sign.NEGATIVE);
      CollisionBox.getPointPosition(
        ll, origin, halfSize, rotation, tempVec2, Sign.NEGATIVE, Sign.POSITIVE);
      CollisionBox.getPointPosition(
        lr, origin, halfSize, rotation, tempVec2, Sign.NEGATIVE, Sign.NEGATIVE);
      return AABB2.from([ul, ur, ll, lr]);
    });
  }

  destroy() {
    this.HalfSize.ReleaseFn();
    this.Origin.ReleaseFn();
  }
}
