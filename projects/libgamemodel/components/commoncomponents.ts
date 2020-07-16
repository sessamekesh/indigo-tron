import { TempGroupAllocator, LifecycleOwnedAllocator } from "@libutil/allocator";
import { quat, mat4, vec3, vec2, vec4 } from "gl-matrix";
import { LightcycleColor } from "@libgamemodel/lightcycle/lightcyclecolor.component";
import { Entity } from "@libecs/entity";
import { Circle3 } from '@libutil/math/circle3';
import { Plane } from "@libgamemodel/physics/plane";
import { SceneGraph2 } from '@libscenegraph/scenegraph2';
import { ECSManager } from "@libecs/ecsmanager";

export class MathAllocatorsComponent {
  constructor(
    public readonly Vec2: TempGroupAllocator<vec2>,
    public readonly Vec3: TempGroupAllocator<vec3>,
    public readonly Mat4: TempGroupAllocator<mat4>,
    public readonly Quat: TempGroupAllocator<quat>,
    public readonly Circle3: TempGroupAllocator<Circle3>) {}

  static upsertSingleton(ecs: ECSManager) {
    const existing = ecs.getSingletonComponent(MathAllocatorsComponent);
    if (existing) return existing;

    const e = ecs.createEntity();
    const vec2Allocator = new TempGroupAllocator(vec2.create);
    const vec3Allocator = new TempGroupAllocator(vec3.create);
    const mat4Allocator = new TempGroupAllocator(mat4.create);
    const quatAllocator = new TempGroupAllocator(quat.create);
    const circle3Allocator = new TempGroupAllocator(
      () => new Circle3(vec3.create(), vec3.create(), 0));

    const c = e.addComponent(
      MathAllocatorsComponent,
      vec2Allocator,
      vec3Allocator,
      mat4Allocator,
      quatAllocator,
      circle3Allocator);
    e.addListener('destroy', () => {
      vec2Allocator.clear();
      vec3Allocator.clear();
      mat4Allocator.clear();
      quatAllocator.clear();
      circle3Allocator.clear();
    });
    return c;
  }
}

export class OwnedMathAllocatorsComponent {
  constructor(
    public readonly Vec2: LifecycleOwnedAllocator<vec2>,
    public readonly Vec3: LifecycleOwnedAllocator<vec3>,
    public readonly Vec4: LifecycleOwnedAllocator<vec4>,
    public readonly Mat4: LifecycleOwnedAllocator<mat4>,
    public readonly Quat: LifecycleOwnedAllocator<quat>,
    public readonly Plane: LifecycleOwnedAllocator<Plane>) {}

  static upsertSingleton(ecs: ECSManager) {
    const existing = ecs.getSingletonComponent(OwnedMathAllocatorsComponent);
    if (existing) return existing;

    const e = ecs.createEntity();

    const v2 = new LifecycleOwnedAllocator(vec2.create);
    const v3 = new LifecycleOwnedAllocator(vec3.create);
    const v4 = new LifecycleOwnedAllocator(vec4.create);
    const m4 = new LifecycleOwnedAllocator(mat4.create);
    const qt = new LifecycleOwnedAllocator(quat.create);
    const pl = new LifecycleOwnedAllocator(() => Plane.defaultPlane());

    const c = e.addComponent(OwnedMathAllocatorsComponent, v2, v3, v4, m4, qt, pl);
    e.addListener('destroy', () => {
      v2.reset();
      v3.reset();
      v4.reset();
      m4.reset();
      qt.reset();
      pl.reset();
    });

    return c;
  }
}

export class SceneGraphComponent {
  constructor(public readonly SceneGraph: SceneGraph2) {}

  static upsertSingleton(ecs: ECSManager) {
    const existing = ecs.getSingletonComponent(SceneGraphComponent);
    if (existing) return existing;

    const e = ecs.createEntity();
    const sceneGraph = new SceneGraph2();
    e.addListener('destroy', () => sceneGraph.destroy());
    return e.addComponent(SceneGraphComponent, sceneGraph);
  }
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
