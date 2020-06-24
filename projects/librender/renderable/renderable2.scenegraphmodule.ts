import { SceneGraph2Module } from '@libscenegraph/scenenode2module';
import { SceneNode2 } from '@libscenegraph/scenenode2';
import { Renderable2SceneNodeAddon, QueryResult } from './renderable2.scenenodeaddon';
import { Renderable2 } from './renderable2';
import { Klass } from '@libecs/klass';
import { Mat4TransformModule } from '@libscenegraph/scenenodeaddons/mat4transformmodule';

function flatten<T>(arr: T[][]): T[] {
  return ([] as T[]).concat(...arr);
}

export class Renderable2SceneGraphModule extends SceneGraph2Module {
  __extendSceneNode(sceneNode: SceneNode2) {
    sceneNode.setAddon(Renderable2SceneNodeAddon, new Renderable2SceneNodeAddon(sceneNode));
  }

  __getRequiredModules() {
    return [Mat4TransformModule];
  }

  // Notice: "querySceneGraph" is very expensive. It may be worth making a batch API here that
  //  has queries in the form {type: Klass, tagSet: []}, and returning a map [Klass->QueryResult[]]
  queryRenderables<T>(renderableType: Klass<Renderable2<T>>, tagSets: any[][]) {
    const renderableAddons = this.querySceneGraph((node) => true)
      .map(sceneNode => sceneNode.getAddon(Renderable2SceneNodeAddon));

    const renderResults =
      tagSets.map(
        (tagSet) => renderableAddons.map(
          (addon) => addon.getRenderablesMatchingTags(renderableType, tagSet)));

    return flatten(flatten(renderResults));
  }
}
