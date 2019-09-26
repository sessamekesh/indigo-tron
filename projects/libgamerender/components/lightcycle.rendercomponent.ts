import { SceneNode } from '@libutil/scene/scenenode';

export class LightcycleRenderComponent {
  constructor(
    public BodySceneNode: SceneNode,
    public FrontWheelSceneNode: SceneNode,
    public BackWheelSceneNode: SceneNode,
    public SpawnStickSceneNode: SceneNode) {}
}
