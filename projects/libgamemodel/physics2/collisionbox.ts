import { OwnedResource, LifecycleOwnedAllocator, TempGroupAllocator } from "@libutil/allocator";
import { vec2 } from "gl-matrix";
import { PhysicsBody } from "./physicsbody";

export enum Sign {
  POSITIVE,
  NEGATIVE,
}

export class CollisionBox {
  constructor(
    public readonly origin: OwnedResource<vec2>,
    public readonly halfSize: OwnedResource<vec2>,
    public readonly rotation: number) {}

  destroy() {
    this.origin.ReleaseFn();
    this.halfSize.ReleaseFn();
  }

  getPointPosition(o: vec2, tempVec2: TempGroupAllocator<vec2>, xSign: Sign, ySign: Sign) {
    const signVal = (sign: Sign) => sign === Sign.POSITIVE ? 1 : -1;
    tempVec2.get(1, (cornerPos) => {
      vec2.set(
        cornerPos,
        this.origin.Value[0] + this.halfSize.Value[0] * signVal(xSign),
        this.origin.Value[1] + this.halfSize.Value[1] * signVal(ySign));
      vec2.rotate(o, cornerPos, this.origin.Value, this.rotation);
    });
  }

  createTransformedBox(
      vec2Allocator: LifecycleOwnedAllocator<vec2>,
      tempVec2: TempGroupAllocator<vec2>,
      physicsBody: PhysicsBody): CollisionBox {
    const newPos = vec2Allocator.get();
    const newHalfSize = vec2Allocator.get();

    tempVec2.get(1, (physicsBodyPos) => {
      physicsBody.getPosition(physicsBodyPos);
      vec2.add(newPos.Value, this.origin.Value, physicsBodyPos);
      vec2.rotate(newPos.Value, newPos.Value, physicsBodyPos, physicsBody.getRotation());

      vec2.copy(newHalfSize.Value, this.halfSize.Value);
    });

    return new CollisionBox(newPos, newHalfSize, this.rotation + physicsBody.getRotation());
  }
}
