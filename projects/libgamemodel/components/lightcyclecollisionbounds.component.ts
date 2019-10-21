import { SceneNode } from '@libutil/scene/scenenode';

export class LightcycleCollisionBoundsComponent {
  constructor(
    public FrontLeftPoint: SceneNode,
    public FrontRightPoint: SceneNode,
    public BackLeftPoint: SceneNode,
    public BackRightPoint: SceneNode) {}
}
