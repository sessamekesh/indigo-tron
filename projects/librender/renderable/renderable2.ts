/**
 * Renderable: Abstraction around a renderable object. Contains instance-specific data and
 * references to resources that are not owned by this object. For example: a StandardObject may
 * have a matWorld object that it owns, and references to a StandardMesh and Texture used to render
 * it.
 *
 * Intended usage is to store any information not present in the rendering context (camera, scene
 * configuration, etc) on these objects, either as a reference or an owned object.
 */
export abstract class Renderable2<PerObjectDataType> {
  private tags = new Set<any>();

  constructor(public readonly perObjectData: PerObjectDataType) {}

  addTag(tag: any) {
    this.tags.add(tag);
  }

  hasTags(tags: any[]) {
    return tags.every(tag => this.tags.has(tag));
  }

  removeTag(tag: any) {
    this.tags.delete(tag);
  }
}
