import { SceneNode } from '@libutil/scene/scenenode';
import { Texture } from '@librender/texture/texture';

export class WallRenderComponent {
  constructor(
    public SceneNode: SceneNode,
    public Texture: Texture) {}
}
