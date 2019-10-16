import { SceneNode } from '@libutil/scene/scenenode';

export class LightcycleComponent2 {
  constructor(
    public FrontWheelSceneNode: SceneNode,
    public RearWheelSceneNode: SceneNode,
    public BodySceneNode: SceneNode,
    public Vitality: number) {}
}
