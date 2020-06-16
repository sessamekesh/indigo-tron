import { Renderable } from './renderable';
import { Klass, Klass2 } from '@libecs/klass';

/**
 * Render group: encapsulates a group of Renderable objects, and exposes methods to allocate new
 * ones, and query for matching renderable objects
 */
export class RenderGroup
    <GLResourcesType, PerObjectDataType, RenderableType extends Renderable<PerObjectDataType, GLResourcesType>> {
  private renderables_: RenderableType[] = [];

  constructor(
    private defaultObjectDataGenerator: ()=>PerObjectDataType,
    private defaultObjectDataCleanup: (d: PerObjectDataType)=>void,
    private renderableGenerator: (objData: PerObjectDataType, geo: GLResourcesType)=>RenderableType) {}

  createRenderable(geo: GLResourcesType) {
    const newRenderable = this.renderableGenerator(this.defaultObjectDataGenerator(), geo);
    this.renderables_.push(newRenderable);
    return newRenderable;
  }

  destroy(renderable: RenderableType) {
    this.renderables_ = this.renderables_.filter(r => {
      if (r === renderable) {
        this.defaultObjectDataCleanup(r.perObjectData);
        return false;
      }

      return true;
    });
  }

  query(tags: any[]) {
    return this.renderables_.filter(renderable => {
      return renderable.hasTags(tags);
    });
  }
}
