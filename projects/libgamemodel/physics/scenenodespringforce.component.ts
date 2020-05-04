import { SceneNode } from "@libutil/scene/scenenode";

export class SceneNodeSpringForceComponent {
  constructor(
    public SpringLength: number,
    public SpringConstant: number, // in Newtons per meter
    public TargetSceneNode: SceneNode) {}
}
