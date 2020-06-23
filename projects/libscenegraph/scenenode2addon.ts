import { SceneNode2 } from './scenenode2';

export abstract class SceneNode2Addon {
  protected constructor(protected sceneNode: SceneNode2) {}

  abstract onChangeParent(oldParent: SceneNode2|null, newParent: SceneNode2|null): void;
  abstract cleanup(): void;

  abstract onAddChild(child: SceneNode2): void;
  abstract onRemoveChild(child: SceneNode2): void;
}

export type SceneNode2AddonKey<AddonType extends SceneNode2Addon> = new (...args: any[]) => AddonType;
