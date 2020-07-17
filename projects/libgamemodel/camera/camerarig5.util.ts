import { Entity } from "@libecs/entity";
import { ECSManager } from "@libecs/ecsmanager";
import { CameraRig5Component, CameraRig5TargetTag } from "./camerarig5.component";

export class CameraRig5Util {
  static moveCameraRig(ecs: ECSManager, fromPlayer: Entity, toPlayer: Entity) {
    ecs.iterateComponents([CameraRig5Component], (entity, cameraRigComponent) => {
      if (cameraRigComponent.CarEntity !== fromPlayer) {
        return;
      }

      cameraRigComponent.CarEntity = toPlayer;
      toPlayer.addComponent(CameraRig5TargetTag);
      fromPlayer.removeComponent(CameraRig5TargetTag);
    });
  }
}
