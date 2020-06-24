import { SceneNode2 } from '@libscenegraph/scenenode2';
import { LambertRenderable2 } from '@librender/renderable/lambert.renderable2';

export class LightcycleRenderableTag {}

export class LightcycleRenderComponent2 {
  constructor(
    public FrontWheel: LambertRenderable2,
    public FrontWheelSceneNode: SceneNode2,
    public RearWheel: LambertRenderable2,
    public RearWheelSceneNode: SceneNode2,
    public Body: LambertRenderable2,
    public BodySceneNode: SceneNode2) {}
}
