import { SceneNode } from '@libutil/scene/scenenode';

export class LightcycleComponent {
  constructor(
    public Orientation: number,
    public SceneNode: SceneNode) {}
}

export class LightcycleComponent2 {
  constructor(
    public FrontWheelSceneNode: SceneNode,
    public RearWheelSceneNode: SceneNode,
    public BodySceneNode: SceneNode) {}
}
