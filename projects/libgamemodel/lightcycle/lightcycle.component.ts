import { SceneNode2 } from '@libscenegraph/scenenode2';

export class LightcycleComponent2 {
  constructor(
    public FrontWheelSceneNode: SceneNode2,
    public RearWheelSceneNode: SceneNode2,
    public BodySceneNode: SceneNode2,
    public Vitality: number,
    public Velocity: number,
    public AngularVelocity: number) {}
}
