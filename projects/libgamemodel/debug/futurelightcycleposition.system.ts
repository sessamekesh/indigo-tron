import { ECSSystem } from "@libecs/ecssystem";
import { ECSManager } from "@libecs/ecsmanager";
import { LightcycleComponent2 } from "@libgamemodel/lightcycle/lightcycle.component";
import { Entity } from "@libecs/entity";
import { FutureLightcyclePositionComponent } from "./futurelightcycleposition.component";
import { LifecycleOwnedAllocator } from "@libutil/allocator";
import { vec3 } from "gl-matrix";
import { OwnedMathAllocatorsComponent, MathAllocatorsComponent } from "@libgamemodel/components/commoncomponents";
import { LightcycleUtils } from "@libgamemodel/lightcycle/lightcycleutils";
import { LightcycleSteeringStateComponent } from "@libgamemodel/lightcycle/lightcyclesteeringstate.component";
import { DebugRenderTag } from "./debugrendertag";

export class DebugFutureLightcyclePositionSystem extends ECSSystem {
  start() { return true; }
  update(ecs: ECSManager, msDt: number) {
    const dt = msDt / 1000;
    const { Vec3 } = ecs.getSingletonComponentOrThrow(OwnedMathAllocatorsComponent);
    const {
      Vec3: tempVec3,
      Circle3: tempCircle3,
    } = ecs.getSingletonComponentOrThrow(MathAllocatorsComponent);

    ecs.iterateComponents(
        [LightcycleComponent2, LightcycleSteeringStateComponent],
        (e, lightcycle, steeringState) => {
      const futurePosition = this.getFuturePositionComponent(e, Vec3);
      LightcycleUtils.getApproximatePositionInFuture(
        futurePosition.Position.Value,
        lightcycle,
        steeringState,
        0.25,
        tempVec3,
        tempCircle3);
      if (Math.random() < 0.001) {
        console.log(futurePosition.Position.Value);
      }
    });
  }

  private getFuturePositionComponent(
      e: Entity,
      vec3Allocator: LifecycleOwnedAllocator<vec3>): FutureLightcyclePositionComponent {
    let component = e.getComponent(FutureLightcyclePositionComponent);
    if (!component) {
      const futurePosition = vec3Allocator.get();
      component = e.addComponent(FutureLightcyclePositionComponent, futurePosition);
      e.addComponent(DebugRenderTag);
      e.addListener('destroy', (e) => futurePosition.ReleaseFn());
    }
    return component;
  }
}
