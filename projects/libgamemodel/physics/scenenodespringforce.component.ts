import { SceneNode2 } from '@libscenegraph/scenenode2';

export class SceneNodeSpringForceComponent {
  constructor(
    public SpringLength: number,
    public SpringConstant: number, // in Newtons per meter
    public TargetSceneNode: SceneNode2) {}
}
