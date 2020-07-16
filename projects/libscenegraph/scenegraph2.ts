import { SceneNode2 } from './scenenode2';
import { SceneGraph2ModuleKey, SceneGraph2Module } from './scenenode2module';
export class SceneGraph2 {
  private modules = new Map<SceneGraph2ModuleKey<any>, SceneGraph2Module>();

  private readonly rootNode = new SceneNode2();

  addModule<ModuleType extends SceneGraph2Module>(
      key: SceneGraph2ModuleKey<ModuleType>, value: ModuleType) {
    if (this.modules.has(key)) {
      throw new Error('SceneGraphModule with key already exists: ' + key);
    }

    const requiredModules = value.__getRequiredModules();
    const missingModules = requiredModules.filter(moduleKey => !this.modules.has(moduleKey));
    if (missingModules.length > 0) {
      throw new Error(
        'SceneGraphModule requires installation of missing modules: ' + missingModules.join(','));
    }

    this.extendAllSceneNodes(value, this.rootNode);
    value.__setRootSceneNode(this.rootNode);
    this.modules.set(key, value);
    return this;
  }

  with<ModuleType extends SceneGraph2Module>(key: SceneGraph2ModuleKey<ModuleType>) {
    const module = this.modules.get(key) as ModuleType|undefined;
    if (!module) {
      throw new Error('SceneGraphModule with key not found: ' + key);
    }
    return module;
  }

  createSceneNode(parent?: SceneNode2): SceneNode2 {
    const sceneNode = new SceneNode2();
    sceneNode.setParent(parent || this.rootNode);
    this.modules.forEach(mod => mod.__extendSceneNode(sceneNode));
    return sceneNode;
  }

  protected extendAllSceneNodes
      <ModuleType extends SceneGraph2Module>(mod: ModuleType, sceneNode: SceneNode2) {
    mod.__extendSceneNode(sceneNode);
    sceneNode.onEachChild(child => this.extendAllSceneNodes(mod, child));
  }

  destroy() {
    this.rootNode.destroy();
  }
}
