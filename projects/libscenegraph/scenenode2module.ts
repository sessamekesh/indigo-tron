import { SceneNode2 } from './scenenode2';
import { Klass } from '@libecs/klass';

export type SceneGraph2ModuleKey<ModuleType extends SceneGraph2Module> = new (...args: any[])=>ModuleType;

export abstract class SceneGraph2Module {
  // Set to a concrete instance for type safety, this is not the real root of course.
  protected rootSceneNode: SceneNode2 = new SceneNode2();

  public __setRootSceneNode(sceneNode: SceneNode2) {
    this.rootSceneNode = sceneNode;
  }
  abstract __extendSceneNode(sceneNode: SceneNode2): void;
  __getRequiredModules(): Klass<any>[] { return []; }

  protected querySceneGraph(predicate: (node: SceneNode2)=>boolean) {
    const nodes: SceneNode2[] = [this.rootSceneNode];
    const returnNodes: SceneNode2[] = [];
    let nextNode: SceneNode2|undefined = undefined;

    while (nextNode = nodes.shift()) {
      if (predicate(nextNode)) {
        returnNodes.push(nextNode);
      }
      nodes.push(...nextNode.getChildren());
    }

    return returnNodes;
  }
}
