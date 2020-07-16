import { OwnedResource, LifecycleOwnedAllocator, TempGroupAllocator } from "@libutil/allocator";
import { vec2 } from "gl-matrix";
import { AABB } from "./aabb";

export enum Sign {
  POSITIVE,
  NEGATIVE,
}

export class CollisionBox {
  private constructor(
    public readonly origin: OwnedResource<vec2>,
    public readonly halfSize: OwnedResource<vec2>,
    public rotation: number,
    public aabb: AABB) {}

  static create(
      vec2Allocator: LifecycleOwnedAllocator<vec2>,
      tempVec2: TempGroupAllocator<vec2>,
      origin: vec2,
      halfSize: vec2,
      rotation: number) {
    const originPos = vec2Allocator.get();
    const halfSizeV = vec2Allocator.get();
    vec2.copy(originPos.Value, origin);
    vec2.copy(halfSizeV.Value, halfSize);

    const aabb = tempVec2.get(4, (ul, ur, ll, lr) => {
      CollisionBox.getPointPosition(
        ul, originPos.Value, halfSizeV.Value, rotation, tempVec2, Sign.POSITIVE, Sign.POSITIVE);
      CollisionBox.getPointPosition(
        ur, originPos.Value, halfSizeV.Value, rotation, tempVec2, Sign.POSITIVE, Sign.NEGATIVE);
      CollisionBox.getPointPosition(
        ll, originPos.Value, halfSizeV.Value, rotation, tempVec2, Sign.NEGATIVE, Sign.POSITIVE);
      CollisionBox.getPointPosition(
        lr, originPos.Value, halfSizeV.Value, rotation, tempVec2, Sign.NEGATIVE, Sign.NEGATIVE);
      return AABB.from([ul, ur, ll, lr])
    });
    return new CollisionBox(originPos, halfSizeV, rotation, aabb);
  }

  static getPointPosition(
      o: vec2,
      origin: vec2,
      halfSize: vec2,
      rotation: number,
      tempVec2: TempGroupAllocator<vec2>,
      xSign: Sign,
      ySign: Sign) {
    const signVal = (sign: Sign) => sign === Sign.POSITIVE ? 1 : -1;
    tempVec2.get(1, (cornerPos) => {
      vec2.set(
        cornerPos,
        origin[0] + halfSize[0] * signVal(xSign),
        origin[1] + halfSize[1] * signVal(ySign));
      vec2.rotate(o, cornerPos, origin, rotation);
    });
  }

  updateAABB(tempVec2: TempGroupAllocator<vec2>) {
    tempVec2.get(4, (ul, ur, ll, lr) => {
      CollisionBox.getPointPosition(
        ul, this.origin.Value, this.halfSize.Value,
        this.rotation, tempVec2, Sign.POSITIVE, Sign.POSITIVE);
      CollisionBox.getPointPosition(
        ur, this.origin.Value, this.halfSize.Value,
        this.rotation, tempVec2, Sign.POSITIVE, Sign.NEGATIVE);
      CollisionBox.getPointPosition(
        ll, this.origin.Value, this.halfSize.Value,
        this.rotation, tempVec2, Sign.NEGATIVE, Sign.POSITIVE);
      CollisionBox.getPointPosition(
        lr, this.origin.Value, this.halfSize.Value,
        this.rotation, tempVec2, Sign.NEGATIVE, Sign.NEGATIVE);
      this.aabb.update([ul, ur, ll, lr]);
    });
  }

  destroy() {
    this.halfSize.ReleaseFn();
    this.origin.ReleaseFn();
  }
}
