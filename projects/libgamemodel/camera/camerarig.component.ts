import { BasicCamera } from './basiccamera';
import { SceneNode } from '@libutil/scene/scenenode';

export class CameraRigComponent {
  constructor(
    public Camera: BasicCamera,
    public LookAtSceneNode: SceneNode,
    public PositionSceneNode: SceneNode) {}
}
