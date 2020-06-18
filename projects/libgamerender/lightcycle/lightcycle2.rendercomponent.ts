import { LambertRenderable } from '@librender/renderable/lambertrenderableutil';
import { SceneNode } from '@libutil/scene/scenenode';

export class LightcycleRenderableTag {}

export class LightcycleRenderComponent2 {
  constructor(
    public FrontWheel: LambertRenderable,
    public FrontWheelSceneNode: SceneNode,
    public RearWheel: LambertRenderable,
    public RearWheelSceneNode: SceneNode,
    public Body: LambertRenderable,
    public BodySceneNode: SceneNode) {}
}
