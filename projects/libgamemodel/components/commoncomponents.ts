import { SceneNodeFactory } from "@libutil/scene/scenenodefactory";
import { TempGroupAllocator, LifecycleOwnedAllocator } from "@libutil/allocator";
import { quat, mat4, vec3 } from "gl-matrix";

export class MathAllocatorsComponent {
  constructor(
    public readonly Vec3: TempGroupAllocator<vec3>,
    public readonly Mat4: TempGroupAllocator<mat4>,
    public readonly Quat: TempGroupAllocator<quat>) {}
}

export class OwnedMathAllocatorsComponent {
  constructor(
    public readonly Vec3: LifecycleOwnedAllocator<vec3>,
    public readonly Mat4: LifecycleOwnedAllocator<mat4>,
    public readonly Quat: LifecycleOwnedAllocator<quat>) {}
}

export class SceneNodeFactoryComponent {
  constructor(public readonly SceneNodeFactory: SceneNodeFactory) {}
}

export class FrameNumberComponent {
  constructor(public FrameNumber: number) {}
}