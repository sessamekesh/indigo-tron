import { LambertRenderable } from '@librender/renderable/lambertrenderableutil';
import { SceneNode2 } from '@libscenegraph/scenenode2';

export class LightcycleRenderableTag {}

export class LightcycleRenderComponent2 {
  constructor(
    public FrontWheel: LambertRenderable,
    public FrontWheelSceneNode: SceneNode2,
    public RearWheel: LambertRenderable,
    public RearWheelSceneNode: SceneNode2,
    public Body: LambertRenderable,
    public BodySceneNode: SceneNode2) {}
}
