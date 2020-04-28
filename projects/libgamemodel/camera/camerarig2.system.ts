import { ECSSystem } from "@libecs/ecssystem";
import { ECSManager } from "@libecs/ecsmanager";
import { CameraRigComponent } from "./camerarig.component";
import { MathAllocatorsComponent } from "@libgamemodel/components/commoncomponents";
import { vec3 } from "gl-matrix";
import { MathUtils } from "@libutil/mathutils";
import { SceneModeUtil } from "@libgamemodel/scenemode/scenemodeutil";

export class CameraRigSystemConfigurationComponent {
  constructor(
    public CloseRatio: number,
    public MinSpeed: number,
    public MaxSpeed: number) {}
}

export class CameraRigSystem2 extends ECSSystem {
  start(ecs: ECSManager): boolean {
    return true;
  }

  update(ecs: ECSManager, msDt: number) {
    if (!SceneModeUtil.isPlaying(ecs)) return;

    const {
      Vec3: vec3Allocator,
    } = ecs.getSingletonComponentOrThrow(MathAllocatorsComponent);
    const {
      CloseRatio: closeRatio,
      MaxSpeed: maxSpeed,
      MinSpeed: minSpeed,
    } = ecs.getSingletonComponentOrThrow(CameraRigSystemConfigurationComponent);
    ecs.iterateComponents([CameraRigComponent], (entity, rigComponent) => {
      vec3Allocator.get(5, (cameraPos, targetPos, targetLookAt, dPos, newPos) => {
        rigComponent.Camera.pos(cameraPos);
        rigComponent.PositionSceneNode.getPos(targetPos);
        rigComponent.LookAtSceneNode.getPos(targetLookAt);
        vec3.sub(dPos, targetPos, cameraPos);
        const posDistance = vec3.len(dPos);
        const targetPosAdjust = posDistance * closeRatio;
        const posAdjust = MathUtils.clamp(targetPosAdjust, minSpeed, maxSpeed) * (msDt / 1000);
        vec3.scaleAndAdd(newPos, cameraPos, dPos, MathUtils.clamp(posAdjust / posDistance, -1, 1));

        rigComponent.Camera.setPos(newPos);
        rigComponent.Camera.setLookAt(targetLookAt);
      });
    });
  }
}
