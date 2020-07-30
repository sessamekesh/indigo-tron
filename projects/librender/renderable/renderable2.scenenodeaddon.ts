import { SceneNode2Addon } from '@libscenegraph/scenenode2addon';
import { SceneNode2 } from '@libscenegraph/scenenode2';
import { Renderable2 } from './renderable2';
import { Klass } from '@libecs/klass';
import { mat4 } from 'gl-matrix';
import { Mat4TransformAddon } from '@libscenegraph/scenenodeaddons/mat4transformaddon';

export type QueryResult<T> = {
  renderable: Renderable2<T>,
  getMat4: (o: mat4)=>void,
};

export class Renderable2SceneNodeAddon extends SceneNode2Addon {
  private readonly renderables = new Map<Klass<Renderable2<any>>, Renderable2<any>[]>();

  constructor(sceneNode: SceneNode2) {
    super(sceneNode);
  }

  cleanup() {

  }

  onAddChild(child: SceneNode2) {}

  onRemoveChild(child: SceneNode2) {}

  onChangeParent(oldParent: SceneNode2|null, newParent: SceneNode2|null) {}

  //
  // API
  //
  addRenderable<T>(key: Klass<Renderable2<T>>, renderable: Renderable2<T>) {
    if (this.renderables.has(key)) {
      this.renderables.get(key)!.push(renderable);
    } else {
      this.renderables.set(key, [renderable]);
    }
    return this;
  }

  removeRenderable<T>(key: Klass<Renderable2<T>>, renderable: Renderable2<T>) {
    let renderableList = this.renderables.get(key);
    if (renderableList == null) return;

    renderableList = renderableList.filter(r=>r!==renderable);
    if (renderableList.length === 0) {
      this.renderables.delete(key);
    }
  }

  getRenderablesMatchingTags<T>(
      key: Klass<Renderable2<T>>, tags: any[]): QueryResult<T>[] {
    const renderableList = this.renderables.get(key);
    if (!renderableList) return [];

    const matWorld = (o: mat4) => this.sceneNode.getAddon(Mat4TransformAddon).getMatWorld(o);

    return renderableList
      .filter(renderable => renderable.hasTags(tags))
      .map(renderable => {
        return {
          renderable,
          getMat4: matWorld,
        };
      });
  }
}
