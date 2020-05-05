import { Entity } from '@libecs/entity';
import { SceneNode } from '@libutil/scene/scenenode';

export class DrawFutureLightcycleComponent {
  constructor(public RenderEntity: Entity, public MatWorldSceneNode: SceneNode) {}
}
