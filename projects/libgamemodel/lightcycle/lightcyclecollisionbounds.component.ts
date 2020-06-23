import { SceneNode2 } from '@libscenegraph/scenenode2';

export class LightcycleCollisionBoundsComponent {
  constructor(
    public FrontLeftPoint: SceneNode2,
    public FrontRightPoint: SceneNode2,
    public BackLeftPoint: SceneNode2,
    public BackRightPoint: SceneNode2) {}
}
