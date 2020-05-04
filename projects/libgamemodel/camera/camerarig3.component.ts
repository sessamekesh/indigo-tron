import { BasicCamera } from "./basiccamera";
import { Entity } from "@libecs/entity";

/**
 * Third pass at the camera rig... Eventually completely replace others and rename to just
 *  CameraRigComponent
 */
export class CameraRig3Component {
  constructor(
    public Camera: BasicCamera,
    public PositionEntity: Entity,
    public LookAtEntity: Entity) {}

  static attachOwnership(entity: Entity) {
    entity.addListener('destroy', (e) => {
      const c = e.getComponent(CameraRig3Component);
      if (!c) return;
      c.PositionEntity.destroy();
      c.LookAtEntity.destroy();
    });
  }

  static attachWithOwnership(
      entity: Entity, camera: BasicCamera, posEntity: Entity, lookAtEntity: Entity) {
    entity.addComponent(CameraRig3Component, camera, posEntity, lookAtEntity);
    CameraRig3Component.attachOwnership(entity);
  }
}
