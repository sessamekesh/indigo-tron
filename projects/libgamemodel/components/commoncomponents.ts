import { SceneNodeFactory } from "@libutil/scene/scenenodefactory";
import { TempGroupAllocator, LifecycleOwnedAllocator } from "@libutil/allocator";
import { quat, mat4, vec3, vec2 } from "gl-matrix";
import { LightcycleColor } from "@libgamemodel/lightcycle/lightcyclecolor.component";
import { Entity } from "@libecs/entity";
import { Plane } from "@libgamemodel/physics/plane";

export class MathAllocatorsComponent {
  constructor(
    public readonly Vec2: TempGroupAllocator<vec2>,
    public readonly Vec3: TempGroupAllocator<vec3>,
    public readonly Mat4: TempGroupAllocator<mat4>,
    public readonly Quat: TempGroupAllocator<quat>) {}
}

export class OwnedMathAllocatorsComponent {
  constructor(
    public readonly Vec2: LifecycleOwnedAllocator<vec2>,
    public readonly Vec3: LifecycleOwnedAllocator<vec3>,
    public readonly Mat4: LifecycleOwnedAllocator<mat4>,
    public readonly Quat: LifecycleOwnedAllocator<quat>,
    public readonly Plane: LifecycleOwnedAllocator<Plane>) {}
}

export class SceneNodeFactoryComponent {
  constructor(public readonly SceneNodeFactory: SceneNodeFactory) {}
}

export class FrameNumberComponent {
  constructor(public FrameNumber: number) {}
}

export class PauseStateComponent {
  constructor(public IsPaused: boolean) {}
}

export class PlayerDeadTag {}

export class GameEndStateComponent {
  constructor(public Winner: LightcycleColor, public PlayerEntity: Entity) {}
}

export class MainPlayerComponent {}
