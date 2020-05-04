import { ECSSystem } from "@libecs/ecssystem";
import { ECSManager } from "@libecs/ecsmanager";
import { CameraRig3Component } from "./camerarig3.component";
import { PositionComponent } from "@libgamemodel/physics/position.component";

/**
 * Third time is the charm! That's the hope on this camera rig system.
 * If it works, replace the others with this, and rename it to just CameraRigSystem
 */
export class CameraRig3System extends ECSSystem {
  start() { return true; }

  update(ecs: ECSManager) {
    ecs.iterateComponents([CameraRig3Component], (entity, cameraRig) => {
      const pos = cameraRig.PositionEntity.getComponent(PositionComponent);
      const lookAt = cameraRig.LookAtEntity.getComponent(PositionComponent);

      if (!pos || !lookAt) {
        // TODO (sessamekesh): Track unexpected state
        return;
      }

      cameraRig.Camera.setPos(pos.Position.Value);
      cameraRig.Camera.setLookAt(lookAt.Position.Value);
    });
  }
}
