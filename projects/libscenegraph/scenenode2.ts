import { SceneNode2AddonKey, SceneNode2Addon } from './scenenode2addon';

export class SceneNode2 {
  public parent: SceneNode2|null = null;
  private children: SceneNode2[] = [];
  private addons = new Map<SceneNode2AddonKey<any>, SceneNode2Addon>();

  setParent(parent: SceneNode2|null) {
    const oldParent = this.parent;
    this.parent = parent;
    this.addons.forEach((addon) => addon.onChangeParent(oldParent, parent));

    if (oldParent) {
      oldParent.children = oldParent.children.filter(c => c !== this);
      oldParent.addons.forEach(addon => addon.onRemoveChild(this));
    }
    parent?.addons.forEach(addon => addon.onAddChild(this));
  }

  setAddon<AddonType extends SceneNode2Addon>(key: SceneNode2AddonKey<AddonType>, addon: AddonType) {
    if (this.addons.has(key)) {
      throw new Error('Scene node already has addon with key ' + key);
    }
    this.addons.set(key, addon);
  }

  getAddon<AddonType extends SceneNode2Addon>(key: SceneNode2AddonKey<AddonType>): AddonType {
    const addon = this.addons.get(key);
    if (!addon) {
      throw new Error('Scene node does not have addon with key ' + key);
    }
    return addon as AddonType;
  }

  getAddonOpt<AddonType extends SceneNode2Addon>(key: SceneNode2AddonKey<AddonType>): AddonType|undefined {
    return this.addons.get(key) as AddonType|undefined;
  }

  clearAddon<AddonType extends SceneNode2Addon>(key: SceneNode2AddonKey<AddonType>) {
    const addon = this.addons.get(key);
    if (addon) {
      addon.cleanup();
      this.addons.delete(key);
    }
  }

  destroy() {
    this.addons.forEach((addon) => addon.cleanup());
    this.setParent(null);
    this.addons.clear();
  }

  getParent() {
    return this.parent;
  }

  onEachChild(fn: (child: SceneNode2)=>void) {
    this.children.forEach(fn);
  }
}
